# schema.py
import enum
from datetime import datetime, timedelta, timezone
from typing import Optional

import strawberry
from email_validator import EmailNotValidError, validate_email
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from strawberry.schema.config import StrawberryConfig

from auth import requerir_admin, requerir_usuario
from jwt_service import (
    REFRESH_EXPIRACION_DIAS,
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


@strawberry.enum
class RolUsuario(enum.Enum):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"


# ─────────────────────────────────────────────────────────────
# Types: envuelven el objeto ORM en _orm (from_row → from_orm)
# ─────────────────────────────────────────────────────────────

@strawberry.type
class Usuario:
    id: strawberry.ID
    nombre: str
    email: str
    rol: RolUsuario

    @classmethod
    def from_orm(cls, obj: UsuarioModel) -> "Usuario":
        return cls(
            id=str(obj.id),
            nombre=obj.nombre,
            email=obj.email,
            rol=RolUsuario(obj.rol),
        )


@strawberry.type
class Producto:
    id: strawberry.ID
    nombre: str
    precio: float
    stock: int
    _orm: strawberry.Private[ProductoModel]
    descripcion: Optional[str] = None
    imagen: Optional[str] = None

    @classmethod
    def from_orm(cls, obj: ProductoModel) -> "Producto":
        return cls(
            id=str(obj.id),
            nombre=obj.nombre,
            precio=float(obj.precio),   # Numeric → Decimal → float
            stock=obj.stock,
            descripcion=obj.descripcion,
            imagen=obj.imagen,
            _orm=obj,
        )

    @strawberry.field
    def categoria(self) -> Optional["Categoria"]:
        # Ya viene cargada (selectin) → resolver puro: sin async, sin SQL, sin N+1
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
    async def productos(self, info: strawberry.Info) -> list["Producto"]:
        # Relación inversa: query explícita (selectin aquí arrastraría la tabla
        # completa de productos en cascada). Igual que en la versión asyncpg,
        # pero con query builder en vez de SQL crudo.
        result = await info.context["session"].execute(
            select(ProductoModel)
            .where(ProductoModel.categoria_id == self._orm.id)
            .order_by(ProductoModel.id)
        )
        return [Producto.from_orm(p) for p in result.scalars().all()]


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
    def producto(self) -> "Producto":
        return Producto.from_orm(self._orm.producto)   # selectin: ya cargado


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
        if isinstance(fecha, datetime):   # TIMESTAMP → ISO; si la columna es TEXT ya es str
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
class UsuarioInput:
    nombre: str
    email: str
    password: str


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: str
    usuario: Usuario


@strawberry.type
class RefreshPayload:
    access_token: str
    refresh_token: str


@strawberry.input
class ItemPedidoInput:
    producto_id: strawberry.ID
    cantidad: int
    precio_unitario: float


# ─────────────────────────────────────────────────────────────
# Query
# ─────────────────────────────────────────────────────────────

@strawberry.type
class Query:
    @strawberry.field
    async def categorias(self, info: strawberry.Info) -> list[Categoria]:
        result = await info.context["session"].execute(
            select(CategoriaModel).order_by(CategoriaModel.id)
        )
        return [Categoria.from_orm(c) for c in result.scalars().all()]

    @strawberry.field
    async def categoria(
        self, info: strawberry.Info, id: strawberry.ID
    ) -> Optional[Categoria]:
        # session.get = lookup por PK (tu SELECT ... WHERE id = $1 en una llamada)
        obj = await info.context["session"].get(CategoriaModel, int(id))
        return Categoria.from_orm(obj) if obj else None

    @strawberry.field
    async def productos(
        self,
        info: strawberry.Info,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[Producto]:
        # limit(None)/offset(None) = sin cláusula → adiós al SQL armado con f-strings
        result = await info.context["session"].execute(
            select(ProductoModel).order_by(ProductoModel.id).limit(limit).offset(offset)
        )
        return [Producto.from_orm(p) for p in result.scalars().all()]

    @strawberry.field
    async def producto(self, info: strawberry.Info, id: strawberry.ID) -> Optional[Producto]:
        obj = await info.context["session"].get(ProductoModel, int(id))
        return Producto.from_orm(obj) if obj else None

    @strawberry.field
    async def pedidos(self, info: strawberry.Info) -> list[Pedido]:
        requerir_admin(info)   # solo un admin ve TODOS los pedidos
        result = await info.context["session"].execute(
            select(PedidoModel).order_by(PedidoModel.id)
        )
        return [Pedido.from_orm(p) for p in result.scalars().all()]


# ─────────────────────────────────────────────────────────────
# Mutation
# ─────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:
    # ───────────────────────── Auth ─────────────────────────

    @strawberry.mutation(name="crearUsuario")
    async def crear_usuario(
        self, info: strawberry.Info, datos: UsuarioInput
    ) -> Optional[Usuario]:
        session = info.context["session"]
        try:
            email = validate_email(datos.email, check_deliverability=True).normalized
        except EmailNotValidError as e:
            raise Exception(f"Correo inválido: {e}")

        usuario = UsuarioModel(
            nombre=datos.nombre,
            email=email,
            password=pwd_context.hash(datos.password),
            rol="CLIENTE",   # el registro NUNCA crea admins
        )
        session.add(usuario)
        try:
            await session.commit()
        except IntegrityError:   # UNIQUE(email)
            await session.rollback()
            raise Exception("Este correo ya se encuentra registrado")
        return Usuario.from_orm(usuario)

    @strawberry.mutation
    async def login(self, info: strawberry.Info, datos: LoginInput) -> AuthPayload:
        session = info.context["session"]
        result = await session.execute(
            select(UsuarioModel).where(UsuarioModel.email == datos.email.strip().lower())
        )
        usuario = result.scalar_one_or_none()

        try:
            valido = usuario is not None and pwd_context.verify(datos.password, usuario.password)
        except UnknownHashError:   # password guardado en texto plano (datos viejos)
            valido = False
        if not valido:
            raise Exception("Credenciales inválidas")

        payload = {"usuario_id": usuario.id, "email": usuario.email, "rol": usuario.rol}
        access_token = generar_access_token(payload)
        refresh_token, jti = generar_refresh_token(payload)

        session.add(RefreshTokenModel(
            usuario_id=usuario.id,
            jti=jti,
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRACION_DIAS),
        ))
        await session.commit()
        return AuthPayload(
            access_token=access_token,
            refresh_token=refresh_token,
            usuario=Usuario.from_orm(usuario),
        )

    @strawberry.mutation(name="refrescarToken")
    async def refrescar_token(
        self, info: strawberry.Info, refresh_token: str
    ) -> RefreshPayload:
        session = info.context["session"]
        payload = decodificar_token(refresh_token)
        if payload is None or payload.get("tipo") != "refresh":
            raise Exception("Refresh Token Inválido")

        jti, usuario_id = payload["jti"], payload["usuario_id"]
        result = await session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.jti == jti)
        )
        token_row = result.scalar_one_or_none()
        if token_row is None:
            raise Exception("Refresh Token Inválido")

        if token_row.usado:
            # Reuso → posible robo: se revocan TODAS las sesiones del usuario.
            # El commit va ANTES del raise, si no el rollback deshace la revocación.
            await session.execute(
                update(RefreshTokenModel)
                .where(RefreshTokenModel.usuario_id == usuario_id)
                .values(usado=True)
            )
            await session.commit()
            raise Exception("Refresh Token ya utilizado - Session Terminated")

        token_row.usado = True   # rotación: un refresh solo sirve una vez

        # Rol ACTUAL desde la BD, no el que traía el token viejo
        usuario = await session.get(UsuarioModel, usuario_id)
        if usuario is None:
            await session.commit()
            raise Exception("Refresh Token Inválido")

        datos = {"usuario_id": usuario.id, "email": usuario.email, "rol": usuario.rol}
        nuevo_access = generar_access_token(datos)
        nuevo_refresh, nuevo_jti = generar_refresh_token(datos)
        session.add(RefreshTokenModel(
            usuario_id=usuario.id,
            jti=nuevo_jti,
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRACION_DIAS),
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
            select(RefreshTokenModel).where(RefreshTokenModel.jti == payload["jti"])
        )
        token_row = result.scalar_one_or_none()
        if token_row is None:
            raise Exception("Refresh Token Inválido")

        token_row.usado = True
        await session.commit()
        return True

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
        session = info.context["session"]

        categoria = await session.get(CategoriaModel, int(categoria_id))
        if categoria is None:
            raise Exception(f"No existe la categoría {categoria_id}")  # antes: FK violation crudo

        producto = ProductoModel(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            imagen=imagen,
            stock=stock,
            categoria=categoria,   # relación en memoria → el resolver categoria la lee sin query
        )
        session.add(producto)
        await session.commit()     # el flush interno asigna producto.id
        return Producto.from_orm(producto)

    @strawberry.mutation(name="actualizarProducto")
    async def actualizar_producto(
        self, info: strawberry.Info, id: strawberry.ID, *,
        nombre: Optional[str] = None,
        precio: Optional[float] = None,
        stock: Optional[int] = None,
    ) -> Producto:
        requerir_admin(info)
        session = info.context["session"]

        producto = await session.get(ProductoModel, int(id))
        if producto is None:
            raise Exception(f"No existe el producto {id}")

        # Los if reemplazan al COALESCE del SQL: None = "no tocar este campo"
        if nombre is not None:
            producto.nombre = nombre
        if precio is not None:
            producto.precio = precio
        if stock is not None:
            producto.stock = stock

        await session.commit()
        return Producto.from_orm(producto)

    @strawberry.mutation(name="eliminarProducto")
    async def eliminar_producto(self, info: strawberry.Info, id: strawberry.ID) -> bool:
        requerir_admin(info)
        session = info.context["session"]
        producto = await session.get(ProductoModel, int(id))
        if producto is not None:
            await session.delete(producto)
            await session.commit()
        return True
        # Ojo: si el producto tiene detalles de pedidos, el FK lo bloquea
        # (igual que en la versión asyncpg). Decidir si el FK es ON DELETE
        # RESTRICT / SET NULL es tema de db.sql, no de este código.

    @strawberry.mutation(name="registrarPedido")
    async def registrar_pedido(
        self, info: strawberry.Info, *,
        total: float,
        items: list[ItemPedidoInput],
    ) -> Pedido:
        # El usuario sale del TOKEN, no del cliente: nadie pide a nombre de otro.
        # (Va ANTES de session.begin(): no toca la BD, así que no inicia transacción.)
        auth = requerir_usuario(info)
        session = info.context["session"]

        if not items:
            raise Exception("El pedido no tiene items")

        # async with session.begin() ≡ tu BEGIN/COMMIT/ROLLBACK de asyncpg:
        # sale sin excepción → COMMIT; con excepción → ROLLBACK automático y el
        # error sube como error de GraphQL (stock restaurado, nada a medias)
        async with session.begin():
            usuario = await session.get(UsuarioModel, int(auth["usuario_id"]))
            if usuario is None:
                raise Exception("El usuario de la sesión ya no existe")

            pedido = PedidoModel(
                usuario=usuario,      # relación en memoria → resolver sin query extra
                total=total,
                status="pendiente",
                fecha=func.now(),    # la genera Postgres (funciona para TIMESTAMP o TEXT)
            )
            session.add(pedido)

            for item in items:
                # with_for_update bloquea la fila hasta el COMMIT: dos pedidos
                # simultáneos del mismo producto ya no pueden pasar ambos el
                # check de stock y dejarlo negativo (race condition clásica)
                producto = await session.get(
                    ProductoModel, int(item.producto_id), with_for_update=True
                )
                if producto is None:
                    raise Exception(f"No existe el producto {item.producto_id}")
                if producto.stock < item.cantidad:
                    raise Exception(
                        f"Stock insuficiente de '{producto.nombre}': "
                        f"quedan {producto.stock}, se piden {item.cantidad}"
                    )

                producto.stock -= item.cantidad   # se persiste en el COMMIT

                detalle = DetallePedidoModel(
                    pedido=pedido,       # ← se asigna aquí, no con .append() del lado contrario
                    producto=producto,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario,
                )
                session.add(detalle)

        # El COMMIT ya ocurrió; refresh trae la fecha que generó la BD
        await session.refresh(pedido)
        return Pedido.from_orm(pedido)


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=False),
)