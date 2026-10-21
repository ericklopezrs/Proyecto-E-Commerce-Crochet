import asyncio
import enum
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo
from sqlalchemy.orm import selectinload

from postali_service import buscar_cp
from divisas_service import obtener_tasa

from decimal import Decimal
from mercadoPago_client import MercadoPagoError, crear_orden_pago, estado_pedido
from email_service import enviar_confirmacion_pago

import strawberry
from email_validator import EmailNotValidError, validate_email
from passlib.context import CryptContext
from sqlalchemy import and_, case, func, select, update
from strawberry.schema.config import StrawberryConfig

from auth import requerir_admin, requerir_usuario
from jwt_service import (
    decodificar_token,
    generar_access_token,
    generar_refresh_token,
)
from models import (
    CategoriaModel,
    DetallePedidoModel,
    PedidoModel,
    ProductoModel,
    RefreshTokenModel,
    UsuarioModel,
)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
TZ_MX = ZoneInfo("America/Mexico_City")


@strawberry.enum
class RolUsuario(enum.Enum):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"


@strawberry.type
class Usuario:
    id: strawberry.ID
    nombre: str
    email: str
    rol: RolUsuario
    activo: bool

    @classmethod
    def from_orm(cls, obj: UsuarioModel) -> "Usuario":
        return cls(
            id=str(obj.id),
            nombre=obj.nombre,
            email=obj.email,
            rol=RolUsuario(obj.rol),
            activo=obj.activo,
        )


@strawberry.type
class Producto:
    id: strawberry.ID
    nombre: str
    precio: float
    stock: int
    activo: bool
    _orm: strawberry.Private[ProductoModel]
    descripcion: Optional[str] = None
    imagen: Optional[str] = None

    @classmethod
    def from_orm(cls, obj: ProductoModel) -> "Producto":
        return cls(
            id=str(obj.id),
            nombre=obj.nombre,
            precio=float(obj.precio),
            stock=obj.stock,
            activo=obj.activo,
            descripcion=obj.descripcion,
            imagen=obj.imagen,
            _orm=obj,
        )
        
    @strawberry.field
    def categoria(self) -> Optional["Categoria"]:
        return Categoria.from_orm(self._orm.categoria) if self._orm.categoria else None

@strawberry.type
class Categoria:
    id: strawberry.ID
    nombre: str
    _orm: strawberry.Private[CategoriaModel]
    descripcion: Optional[str] = None

    @classmethod
    def from_orm(cls, obj: CategoriaModel) -> "Categoria":
        return cls(
            id=str(obj.id),
            nombre=obj.nombre,
            descripcion=obj.descripcion,
            _orm=obj,
        )

    @strawberry.field
    def productos(self) -> list["Producto"]:
        return [Producto.from_orm(p) for p in self._orm.productos if p.activo]


@strawberry.type
class DetallePedido:
    id: strawberry.ID
    cantidad: int
    precio_unitario: float
    _orm: strawberry.Private[DetallePedidoModel]

    @classmethod
    def from_orm(cls, obj: DetallePedidoModel) -> "DetallePedido":
        return cls(
            id=str(obj.id),
            cantidad=obj.cantidad,
            precio_unitario=float(obj.precio_unitario),
            _orm=obj,
        )

    @strawberry.field
    def producto(self) -> Optional["Producto"]:
        return Producto.from_orm(self._orm.producto) if self._orm.producto else None

@strawberry.type
class Pedido:
    id: strawberry.ID
    fecha: str
    total: float
    status: str
    _orm: strawberry.Private[PedidoModel]

    @classmethod
    def from_orm(cls, obj: PedidoModel) -> "Pedido":
        fecha = obj.fecha
        if isinstance(fecha, datetime):
            fecha = fecha.isoformat()
        return cls(
            id=str(obj.id),
            fecha=fecha,
            total=float(obj.total),
            status=obj.status,
            _orm=obj,
        )

    @strawberry.field
    def usuario(self) -> Optional["Usuario"]:
        return Usuario.from_orm(self._orm.usuario) if self._orm.usuario else None

    @strawberry.field
    def detalles(self) -> list["DetallePedido"]:
        return [DetallePedido.from_orm(d) for d in self._orm.detalles]
        


@strawberry.input
class ItemPedidoInput:
    producto_id: strawberry.ID
    cantidad: int
    precio_unitario: float


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class UsuarioInput:
    nombre: str
    email: str
    password: str


@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: str
    usuario: Usuario

@strawberry.type
class PagoPayload:
    pedido_status: str          # PENDIENTE / PAGADO / RECHAZADO / CANCELADO
    orden_id: str
    mp_status: Optional[str] = None
    mp_status_detail: Optional[str] = None

@strawberry.type
class RefreshPayload:
    access_token: str
    refresh_token: str

@strawberry.type
class DireccionCP:
    cp: str
    estado: str
    municipio: str
    ciudad: Optional[str]
    colonias: list[str]


@strawberry.type
class KPIDashboard:
    ventas_mes: float
    pedidos_mes: int
    clientes_total: int
    peluches_catalogo: int
    cambio_ventas: Optional[float] = None
    cambio_pedidos: Optional[float] = None


@strawberry.type
class PuntoSerie:
    etiqueta: str
    valor: float


@strawberry.type
class PuntoCategoria:
    etiqueta: str
    valor: float
    color: str


@strawberry.type
class DashboardAdmin:
    kpis: KPIDashboard
    ventas_por_mes: list[PuntoSerie]
    pedidos_por_dia: list[PuntoSerie]
    ventas_por_categoria: list[PuntoCategoria]


def _validar_producto(nombre=None, precio=None, stock=None):
    if nombre is not None:
        if not nombre.strip():
            raise Exception("El nombre no puede estar vacío")
        if len(nombre) > 100:
            raise Exception("El nombre no puede pasar de 100 caracteres")
    if precio is not None and precio <= 0:
        raise Exception("El precio debe ser mayor a 0")
    if stock is not None and stock < 0:
        raise Exception("El stock no puede ser negativo")


async def _cerrar_sesiones(session, usuario_id: int):
    """Invalida todos los refresh tokens del usuario: tendrá que iniciar sesión de nuevo."""
    await session.execute(
        update(RefreshTokenModel)
        .where(RefreshTokenModel.usuario_id == usuario_id)
        .values(usado=True)
    )


def _meses_atras_utc(n: int) -> datetime:
    """Inicio del mes n meses atrás, en hora de México, convertido a UTC."""
    now_mx = datetime.now(TZ_MX)
    anio, mes = now_mx.year, now_mx.month - n
    while mes <= 0:
        mes += 12
        anio -= 1
    return datetime(anio, mes, 1, tzinfo=TZ_MX).astimezone(timezone.utc)


def _dias_atras_utc(n: int) -> datetime:
    """Inicio del día n días atrás, en hora de México, convertido a UTC."""
    now_mx = datetime.now(TZ_MX)
    dia_mx = (now_mx - timedelta(days=n)).replace(hour=0, minute=0, second=0, microsecond=0)
    return dia_mx.astimezone(timezone.utc)


def _cambio_pct(actual: float, anterior: float) -> Optional[float]:
    """% de cambio vs. periodo anterior. None si no hay base de comparación."""
    if anterior <= 0:
        return None
    return round((actual - anterior) / anterior * 100, 1)


_MESES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
_DIAS_ABREV  = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
_PALETA_CAT  = ["#8b5cf6", "#baa2f3", "#f9a8d4", "#fcd34d", "#a7f3d0", "#93c5fd", "#fca5a5", "#86efac"]


@strawberry.type
class Query:
    @strawberry.field(name="tipoCambio")
    async def tipo_cambio(self, moneda: str = "USD") -> float:
        return await obtener_tasa(moneda)

    @strawberry.field(name="direccionPorCP")
    async def direccion_por_cp(self, cp: str) -> DireccionCP:
        return DireccionCP(**(await buscar_cp(cp)))

    @strawberry.field(name="miPedido")
    async def mi_pedido(
        self, info: strawberry.Info, id: strawberry.ID
    ) -> Optional[Pedido]:
        usuario_token = requerir_usuario(info)
        obj = await info.context["session"].get(PedidoModel, int(id))
        if obj is None or obj.usuario_id != int(usuario_token["usuario_id"]):
            return None
        return Pedido.from_orm(obj)

    @strawberry.field(name="misPedidos")
    async def mis_pedidos(self, info: strawberry.Info) -> list[Pedido]:
        usuario_token = requerir_usuario(info)
        result = await info.context["session"].execute(
            select(PedidoModel)
            .where(PedidoModel.usuario_id == int(usuario_token["usuario_id"]))
            .order_by(PedidoModel.fecha.desc(), PedidoModel.id.desc())
        )
        return [Pedido.from_orm(p) for p in result.scalars().all()]    


    @strawberry.field
    async def categorias(self, info: strawberry.Info) -> list[Categoria]:
        result = await info.context["session"].execute(
            select(CategoriaModel)
            .options(selectinload(CategoriaModel.productos))
            .order_by(CategoriaModel.id)
        )
        return [Categoria.from_orm(c) for c in result.scalars().all()]

    @strawberry.field
    async def categoria(
        self, info: strawberry.Info, id: strawberry.ID
    ) -> Optional[Categoria]:
        obj = await info.context["session"].get(
            CategoriaModel, int(id),
            options=[selectinload(CategoriaModel.productos)]
        )
        return Categoria.from_orm(obj) if obj else None

    @strawberry.field
    async def productos(
        self,
        info: strawberry.Info,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[Producto]:
        result = await info.context["session"].execute(
            select(ProductoModel)
            .where(ProductoModel.activo.is_(True))
            .order_by(ProductoModel.id)
            .limit(limit)
            .offset(offset)
        )
        return [Producto.from_orm(p) for p in result.scalars().all()]

    @strawberry.field
    async def producto(self, info: strawberry.Info, id: strawberry.ID) -> Optional[Producto]:
        obj = await info.context["session"].get(ProductoModel, int(id))
        return Producto.from_orm(obj) if obj and obj.activo else None

    @strawberry.field(name="productosAdmin")
    async def productos_admin(self, info: strawberry.Info) -> list[Producto]:
        requerir_admin(info)
        result = await info.context["session"].execute(
            select(ProductoModel).order_by(ProductoModel.id)
        )
        return [Producto.from_orm(p) for p in result.scalars().all()]

    @strawberry.field(name="usuariosAdmin")
    async def usuarios_admin(self, info: strawberry.Info) -> list[Usuario]:
        requerir_admin(info)
        result = await info.context["session"].execute(
            select(UsuarioModel).order_by(UsuarioModel.id)
        )
        return [Usuario.from_orm(u) for u in result.scalars().all()]

    @strawberry.field
    async def pedidos(self, info: strawberry.Info) -> list[Pedido]:
        requerir_admin(info)
        result = await info.context["session"].execute(
            select(PedidoModel).order_by(PedidoModel.id)
        )
        return [Pedido.from_orm(p) for p in result.scalars().all()]

    @strawberry.field(name="dashboardAdmin")
    async def dashboard_admin(self, info: strawberry.Info) -> DashboardAdmin:
        requerir_admin(info)
        session = info.context["session"]
        inicio_mes_actual   = _meses_atras_utc(0)
        inicio_mes_anterior = _meses_atras_utc(1)
        inicio_6_meses      = _meses_atras_utc(5)
        inicio_7_dias       = _dias_atras_utc(6)

        # ---- 1. KPIs del mes (y mes anterior para el %) ----
        kpi_row = (await session.execute(
            select(
                func.coalesce(func.sum(case(
                    (PedidoModel.fecha_pago >= inicio_mes_actual, PedidoModel.total),
                    else_=0,
                )), 0),
                func.coalesce(func.sum(case(
                    (and_(
                        PedidoModel.fecha_pago >= inicio_mes_anterior,
                        PedidoModel.fecha_pago <  inicio_mes_actual,
                    ), PedidoModel.total),
                    else_=0,
                )), 0),
                func.count(case((PedidoModel.fecha_pago >= inicio_mes_actual, 1))),
                func.count(case((
                    and_(
                        PedidoModel.fecha_pago >= inicio_mes_anterior,
                        PedidoModel.fecha_pago <  inicio_mes_actual,
                    ), 1,
                ))),
            ).where(
                PedidoModel.status == "PAGADO",
                PedidoModel.fecha_pago >= inicio_mes_anterior,
            )
        )).one()
        ventas_mes   = float(kpi_row[0] or 0)
        ventas_ant   = float(kpi_row[1] or 0)
        pedidos_mes  = int(kpi_row[2] or 0)
        pedidos_ant  = int(kpi_row[3] or 0)
        clientes_total = int((await session.execute(
            select(func.count()).select_from(UsuarioModel)
        )).scalar() or 0)
        peluches = int((await session.execute(
            select(func.count()).select_from(ProductoModel)
            .where(ProductoModel.activo.is_(True))
        )).scalar() or 0)
        kpis = KPIDashboard(
            ventas_mes=ventas_mes,
            pedidos_mes=pedidos_mes,
            clientes_total=clientes_total,
            peluches_catalogo=peluches,
            cambio_ventas=_cambio_pct(ventas_mes, ventas_ant),
            cambio_pedidos=_cambio_pct(pedidos_mes, pedidos_ant),
        )

        # ---- 2. Ventas por mes (últimos 6 meses, TZ México) ----
        filas_mes = (await session.execute(
            select(
                func.date_trunc(
                    "month",
                    func.timezone("America/Mexico_City", PedidoModel.fecha_pago),
                ),
                func.coalesce(func.sum(PedidoModel.total), 0),
            )
            .where(
                PedidoModel.status == "PAGADO",
                PedidoModel.fecha_pago >= inicio_6_meses,
            )
            .group_by(func.date_trunc(
                "month",
                func.timezone("America/Mexico_City", PedidoModel.fecha_pago),
            ))
        )).all()
        mapa_mes = {(f[0].year, f[0].month): float(f[1]) for f in filas_mes if f[0]}
        ventas_por_mes: list[PuntoSerie] = []
        for i in range(5, -1, -1):
            local = _meses_atras_utc(i).astimezone(TZ_MX)
            clave = (local.year, local.month)
            ventas_por_mes.append(PuntoSerie(
                etiqueta=_MESES_ABREV[local.month - 1],
                valor=mapa_mes.get(clave, 0.0),
            ))

        # ---- 3. Pedidos por día (últimos 7 días, TZ México) ----
        filas_dia = (await session.execute(
            select(
                func.date(func.timezone("America/Mexico_City", PedidoModel.fecha_pago)),
                func.count(),
            )
            .where(
                PedidoModel.status == "PAGADO",
                PedidoModel.fecha_pago >= inicio_7_dias,
            )
            .group_by(func.date(func.timezone("America/Mexico_City", PedidoModel.fecha_pago)))
        )).all()
        mapa_dia = {f[0]: int(f[1]) for f in filas_dia if f[0]}
        pedidos_por_dia: list[PuntoSerie] = []
        for i in range(6, -1, -1):
            fecha = _dias_atras_utc(i).astimezone(TZ_MX)
            etiqueta = _DIAS_ABREV[fecha.weekday()]
            pedidos_por_dia.append(PuntoSerie(
                etiqueta=etiqueta,
                valor=float(mapa_dia.get(fecha.date(), 0)),
            ))

        # ---- 4. Ventas por categoría (mes actual) ----
        filas_cat = (await session.execute(
            select(
                CategoriaModel.nombre,
                func.coalesce(func.sum(
                    DetallePedidoModel.cantidad * DetallePedidoModel.precio_unitario
                ), 0),
            )
            .select_from(DetallePedidoModel)
            .join(PedidoModel,    PedidoModel.id    == DetallePedidoModel.pedido_id)
            .join(ProductoModel,  ProductoModel.id  == DetallePedidoModel.producto_id)
            .join(CategoriaModel, CategoriaModel.id == ProductoModel.categoria_id)
            .where(
                PedidoModel.status == "PAGADO",
                PedidoModel.fecha_pago >= inicio_mes_actual,
            )
            .group_by(CategoriaModel.id, CategoriaModel.nombre)
            .order_by(func.sum(
                DetallePedidoModel.cantidad * DetallePedidoModel.precio_unitario
            ).desc())
        )).all()
        total_cat = sum(float(f[1] or 0) for f in filas_cat)
        ventas_por_categoria: list[PuntoCategoria] = []
        if total_cat > 0 and filas_cat:
            pcts: list[float] = []
            for fila in filas_cat:
                pcts.append(round(float(fila[1]) / total_cat * 100, 1))
            # ajuste para que sumen 100 exactos y el SVG no quede con hueco
            pcts[-1] = round(100 - sum(pcts[:-1]), 1)
            for i, (fila, pct) in enumerate(zip(filas_cat, pcts)):
                ventas_por_categoria.append(PuntoCategoria(
                    etiqueta=fila[0],
                    valor=pct,
                    color=_PALETA_CAT[i % len(_PALETA_CAT)],
                ))

        return DashboardAdmin(
            kpis=kpis,
            ventas_por_mes=ventas_por_mes,
            pedidos_por_dia=pedidos_por_dia,
            ventas_por_categoria=ventas_por_categoria,
        )


@strawberry.type
class Mutation:

    @strawberry.mutation(name="pagarPedido")
    async def pagar_pedido(
        self, info: strawberry.Info, *,
        pedido_id: strawberry.ID,
        token: str,
        payment_method_id: str,
        payment_type: str = "credit_card",
        installments: int = 1,
        email: str,
        identification_type: Optional[str] = None,
        identification_number: Optional[str] = None,
    ) -> PagoPayload:
        session = info.context["session"]
        usuario_token = requerir_usuario(info)

        # with_for_update: si el usuario le pica dos veces a "Pagar", la segunda
        # petición espera aquí y ya no encuentra el pedido PENDIENTE.
        pedido = await session.get(PedidoModel, int(pedido_id), with_for_update=True)
        if pedido is None or pedido.usuario_id != int(usuario_token["usuario_id"]):
            raise Exception("Pedido no encontrado")
        if pedido.status != "PENDIENTE":
            raise Exception("Este pedido ya no está pendiente de pago")

        items = [
            {
                "titulo": d.producto.nombre,
                "cantidad": d.cantidad,
                "precio": d.precio_unitario,
            }
            for d in pedido.detalles
        ]

        try:
            orden = await crear_orden_pago(
                pedido.id,
                items,
                token=token,
                payment_method_id=payment_method_id,
                payment_type=payment_type,
                installments=installments,
                email=email,
                identification={"type": identification_type, "number": identification_number},
            )
        except MercadoPagoError as err:
            # El pedido sigue PENDIENTE (con su stock apartado) para reintentar.
            await session.rollback()
            raise Exception(str(err))

        pedido.mp_order_id = str(orden.get("id"))
        nuevo_estado = estado_pedido(orden)

        if nuevo_estado is not None:
            pedido.status = nuevo_estado
            if nuevo_estado == "PAGADO":
                pedido.fecha_pago = datetime.now(timezone.utc)
            else:  # RECHAZADO / CANCELADO -> regresamos el stock apartado
                for detalle in pedido.detalles:
                    producto = await session.get(
                        ProductoModel, detalle.producto_id, with_for_update=True
                    )
                    producto.stock += detalle.cantidad

        # Datos del correo antes del commit (después la sesión ya los expiró)
        correo = None
        if pedido.status == "PAGADO" and pedido.usuario:
            correo = {
                "para": pedido.usuario.email,
                "nombre": pedido.usuario.nombre,
                "pedido_id": pedido.id,
                "lineas": [
                    (d.producto.nombre, d.cantidad, float(d.precio_unitario))
                    for d in pedido.detalles
                ],
                "total": float(pedido.total),
                "direccion": pedido.direccion_envio,
            }

        await session.commit()

        if correo:
            # En segundo plano: el cliente no espera a Brevo para ver "Pago aprobado"
            asyncio.create_task(enviar_confirmacion_pago(**correo))

        pago = (orden.get("transactions", {}).get("payments") or [{}])[0]
        return PagoPayload(
            pedido_status=pedido.status,
            orden_id=str(orden.get("id")),
            mp_status=orden.get("status"),
            mp_status_detail=pago.get("status_detail") or orden.get("status_detail"),
        )

    @strawberry.mutation(name="crearProducto")
    async def crear_producto(
        self, info: strawberry.Info, *,
        nombre: str,
        precio: float,
        stock: int,
        categoria_id: strawberry.ID,
        descripcion: Optional[str] = None,
        imagen: Optional[str] = None,
    ) -> Producto:
        requerir_admin(info)
        _validar_producto(nombre, precio, stock)
        session = info.context["session"]

        categoria = await session.get(CategoriaModel, int(categoria_id))
        if categoria is None:
            raise Exception(f"No existe la categoría {categoria_id}")

        producto = ProductoModel(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            imagen=imagen,
            stock=stock,
            categoria=categoria,
        )
        session.add(producto)
        await session.commit()
        return Producto.from_orm(producto)

    @strawberry.mutation(name="actualizarProducto")
    async def actualizar_producto(
        self, info: strawberry.Info, id: strawberry.ID, *,
        nombre: Optional[str] = None,
        precio: Optional[float] = None,
        stock: Optional[int] = None,
        descripcion: Optional[str] = None,
        categoria_id: Optional[strawberry.ID] = None,
        imagen: Optional[str] = None 
    ) -> Producto:

        requerir_admin(info)
        _validar_producto(nombre, precio, stock)
        session = info.context["session"]

        producto = await session.get(ProductoModel, int(id))
        if producto is None:
            raise Exception(f"No existe el producto {id}")

        if nombre is not None:
            producto.nombre = nombre
        if precio is not None:
            producto.precio = precio
        if stock is not None:
            producto.stock = stock
        if descripcion is not None:
            producto.descripcion = descripcion
        if imagen is not None:
            producto.imagen = imagen
        if categoria_id is not None:
            categoria = await session.get(CategoriaModel, int(categoria_id))
            if categoria is None:
                raise Exception(f"No existe la categoría {categoria_id}")
            producto.categoria = categoria

        await session.commit()
        return Producto.from_orm(producto)

    @strawberry.mutation(name="eliminarProducto")
    async def eliminar_producto(self, info: strawberry.Info, id: strawberry.ID) -> bool:
        requerir_admin(info)
        session = info.context["session"]

        producto = await session.get(ProductoModel, int(id))
        if producto is None:
            raise Exception(f"No existe el producto {id}")

        producto.activo = False
        await session.commit()
        return True
    
    @strawberry.mutation(name="restaurarProducto")
    async def restaurar_producto(self, info: strawberry.Info, id: strawberry.ID) -> Producto:
        requerir_admin(info)
        session = info.context["session"]

        producto = await session.get(ProductoModel, int(id))
        if producto is None:
            raise Exception(f"No existe el producto {id}")

        producto.activo = True
        await session.commit()
        return Producto.from_orm(producto)

    @strawberry.mutation(name="cambiarRolUsuario")
    async def cambiar_rol_usuario(
        self, info: strawberry.Info, id: strawberry.ID, rol: RolUsuario
    ) -> Usuario:
        requerir_admin(info)
        session = info.context["session"]
        yo = int(info.context["usuario"]["usuario_id"])
        usuario = await session.get(UsuarioModel, int(id), with_for_update=True)
        if usuario is None:
            raise Exception(f"No existe el usuario {id}")
        if usuario.id == yo:
            raise Exception("No puedes cambiar tu propio rol")
        nuevo = rol.value
        if usuario.rol == nuevo:
            return Usuario.from_orm(usuario)
        usuario.rol = nuevo
        await _cerrar_sesiones(session, usuario.id)
        await session.commit()
        return Usuario.from_orm(usuario)

    @strawberry.mutation(name="cambiarEstadoUsuario")
    async def cambiar_estado_usuario(
        self, info: strawberry.Info, id: strawberry.ID, activo: bool
    ) -> Usuario:
        requerir_admin(info)
        session = info.context["session"]
        yo = int(info.context["usuario"]["usuario_id"])
        usuario = await session.get(UsuarioModel, int(id), with_for_update=True)
        if usuario is None:
            raise Exception(f"No existe el usuario {id}")
        if usuario.id == yo:
            raise Exception("No puedes desactivar tu propia cuenta")
        usuario.activo = activo
        if not activo:
            await _cerrar_sesiones(session, usuario.id)
        await session.commit()
        return Usuario.from_orm(usuario)

    @strawberry.mutation
    async def login(self, info: strawberry.Info, datos: LoginInput) -> AuthPayload:
        session = info.context["session"]

        result = await session.execute(
            select(UsuarioModel).where(UsuarioModel.email == datos.email)
        )
        usuario = result.scalars().first()

        if usuario is None:
            raise Exception("Credenciales inválidas")

        try:
            password_ok = pwd_context.verify(datos.password, usuario.password)
        except Exception:
            password_ok = False

        if not password_ok:
            raise Exception("Credenciales inválidas")

        if not usuario.activo:
            raise Exception("Tu cuenta está desactivada. Contacta a un administrador.")

        payload_datos = {
            "usuario_id": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol,
        }
        access_token = generar_access_token(payload_datos)
        refresh_token, jti = generar_refresh_token(payload_datos)

        session.add(RefreshTokenModel(
            usuario_id=usuario.id,
            jti=uuid.UUID(jti),
            usado=False,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        ))
        await session.commit()

        return AuthPayload(
            access_token=access_token,
            refresh_token=refresh_token,
            usuario=Usuario.from_orm(usuario),
        )

    @strawberry.mutation(name="crearUsuario")
    async def crear_usuario(self, info: strawberry.Info, datos: UsuarioInput) -> Usuario:
        session = info.context["session"]

        try:
            email_info = validate_email(datos.email, check_deliverability=True)
            normalized_email = email_info.normalized
        except EmailNotValidError as e:
            raise Exception(f"Correo inválido: {e}")

        result = await session.execute(
            select(UsuarioModel).where(UsuarioModel.email == normalized_email)
        )
        if result.scalars().first() is not None:
            raise Exception("Este correo ya se encuentra registrado")

        usuario = UsuarioModel(
            nombre=datos.nombre,
            email=normalized_email,
            password=pwd_context.hash(datos.password),
        )
        session.add(usuario)
        await session.commit()
        await session.refresh(usuario)

        return Usuario.from_orm(usuario)

    @strawberry.mutation(name="refrescarToken")
    async def refrescar_token(self, info: strawberry.Info, refresh_token: str) -> RefreshPayload:
        session = info.context["session"]

        payload = decodificar_token(refresh_token)
        if payload is None or payload.get("tipo") != "refresh":
            raise Exception("Refresh Token Inválido")

        jti = uuid.UUID(payload["jti"])
        usuario_id = payload["usuario_id"]

        result = await session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.jti == jti)
        )
        row = result.scalars().first()
        if row is None:
            raise Exception("Refresh Token Inválido")

        if row.usado:
            await session.execute(
                update(RefreshTokenModel)
                .where(RefreshTokenModel.usuario_id == usuario_id)
                .values(usado=True)
            )
            await session.commit()
            raise Exception("Refresh Token ya utilizado - Sesión Terminada")

        row.usado = True

        usuario = await session.get(UsuarioModel, usuario_id)
        if usuario is None:
            raise Exception("Usuario no encontrado")
        if not usuario.activo:
            raise Exception("Tu cuenta está desactivada. Contacta a un administrador.")

        payload_datos = {
            "usuario_id": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol,
        }
        nuevo_access = generar_access_token(payload_datos)
        nuevo_refresh, nuevo_jti = generar_refresh_token(payload_datos)

        session.add(RefreshTokenModel(
            usuario_id=usuario.id,
            jti=uuid.UUID(nuevo_jti),
            usado=False,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        ))
        await session.commit()

        return RefreshPayload(access_token=nuevo_access, refresh_token=nuevo_refresh)

    @strawberry.mutation
    async def logout(self, info: strawberry.Info, refresh_token: str) -> bool:
        session = info.context["session"]

        payload = decodificar_token(refresh_token)
        if payload is None or payload.get("tipo") != "refresh":
            raise Exception("Refresh Token Inválido")

        result = await session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.jti == uuid.UUID(payload["jti"]))
        )
        row = result.scalars().first()
        if row is None:
            raise Exception("Refresh Token Inválido")

        row.usado = True
        await session.commit()
        return True

    @strawberry.mutation(name="registrarPedido")
    async def registrar_pedido(
        self, info: strawberry.Info, *,
        usuario_id: strawberry.ID,
        total: float,
        items: list[ItemPedidoInput],
        direccion_envio: Optional[str] = None,
    ) -> Pedido:
        session = info.context["session"]
        usuario = requerir_usuario(info)

        pedido = PedidoModel(
            usuario_id=int(usuario["usuario_id"]),
            total=0,
            status="PENDIENTE",
            fecha=func.now(),
            direccion_envio=direccion_envio,
        )
        session.add(pedido)
        await session.flush()   #  asegura que el pedido ya tenga id

        total_servidor = Decimal("0")
        for item in items:
            producto = await session.get(
                ProductoModel, int(item.producto_id), with_for_update=True
            )
            if producto is None or not producto.activo:
                raise Exception(f"El producto {item.producto_id} ya no está disponible")
            if producto.stock < item.cantidad:
                raise Exception(
                    f"Stock insuficiente de '{producto.nombre}': "
                    f"quedan {producto.stock}, se piden {item.cantidad}"
                )
            producto.stock -= item.cantidad
            total_servidor += producto.precio * item.cantidad
            session.add(DetallePedidoModel(
                pedido=pedido,
                producto=producto,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
            ))


        pedido.total = total_servidor
        await session.commit()

        await session.refresh(pedido)
        return Pedido.from_orm(pedido)


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=False),
)