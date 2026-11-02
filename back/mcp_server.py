from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from sqlalchemy import func, select

from database import AsyncSessionLocal
from models import CategoriaModel, DetallePedidoModel, PedidoModel, ProductoModel

TZ_MX = ZoneInfo("America/Mexico_City")
MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

mcp = FastMCP(
    "Peluches Crochet",
    instructions=(
        "Consulta de ventas de la tienda de peluches de crochet. Todas las herramientas son "
        "de solo lectura. Los montos están en pesos mexicanos (MXN) y las fechas usan la hora "
        "de la Ciudad de México. Solo cuentan los pedidos pagados."
    ),
)


def _mes_anterior() -> tuple[int, int]:
    hoy = datetime.now(TZ_MX)
    return (hoy.year - 1, 12) if hoy.month == 1 else (hoy.year, hoy.month - 1)


def _rango_mes(anio: int, mes: int) -> tuple[datetime, datetime]:
    """Inicio y fin del mes en hora de México, convertidos a UTC."""
    inicio = datetime(anio, mes, 1, tzinfo=TZ_MX)
    fin = datetime(anio + 1, 1, 1, tzinfo=TZ_MX) if mes == 12 else datetime(anio, mes + 1, 1, tzinfo=TZ_MX)
    return inicio.astimezone(timezone.utc), fin.astimezone(timezone.utc)


@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": False})
async def productos_mas_vendidos(
    anio: int | None = None,
    mes: int | None = None,
    limite: int = 5,
) -> dict:
    """Devuelve los productos más vendidos de un mes, ordenados por unidades vendidas.

    Si no se indican anio y mes, usa el mes anterior al actual (hora de México). Para
    "este mes" o cualquier otro mes, indica anio y mes explícitos (mes del 1 al 12).
    Solo cuenta pedidos pagados. limite es cuántos productos regresar (1 a 20).
    """
    if (anio is None) != (mes is None):
        raise ToolError("Indica anio y mes juntos, o ninguno para usar el mes anterior.")
    if anio is None:
        anio, mes = _mes_anterior()
    if not 1 <= mes <= 12:
        raise ToolError("El mes debe estar entre 1 y 12.")
    if not 2000 <= anio <= datetime.now(TZ_MX).year:
        raise ToolError("El año no es válido.")
    if not 1 <= limite <= 20:
        raise ToolError("El límite debe estar entre 1 y 20.")

    inicio, fin = _rango_mes(anio, mes)

    unidades = func.sum(DetallePedidoModel.cantidad)
    ingresos = func.sum(DetallePedidoModel.cantidad * DetallePedidoModel.precio_unitario)

    consulta = (
        select(
            ProductoModel.nombre.label("producto"),
            CategoriaModel.nombre.label("categoria"),
            unidades.label("unidades"),
            ingresos.label("ingresos"),
        )
        .select_from(DetallePedidoModel)
        .join(PedidoModel, PedidoModel.id == DetallePedidoModel.pedido_id)
        .join(ProductoModel, ProductoModel.id == DetallePedidoModel.producto_id)
        .join(CategoriaModel, CategoriaModel.id == ProductoModel.categoria_id)
        .where(
            PedidoModel.status == "PAGADO",
            PedidoModel.fecha_pago >= inicio,
            PedidoModel.fecha_pago < fin,
        )
        .group_by(ProductoModel.id, ProductoModel.nombre, CategoriaModel.nombre)
        .order_by(unidades.desc(), ingresos.desc())
        .limit(limite)
    )

    async with AsyncSessionLocal() as session:
        filas = (await session.execute(consulta)).all()

    return {
        "periodo": f"{MESES[mes - 1]} de {anio}",
        "criterio": "pedidos pagados, ordenados por unidades vendidas",
        "productos": [
            {
                "posicion": i,
                "producto": f.producto,
                "categoria": f.categoria,
                "unidades_vendidas": int(f.unidades or 0),
                "ingresos_mxn": round(float(f.ingresos or 0), 2),
            }
            for i, f in enumerate(filas, start=1)
        ],
        "nota": None if filas else "No hubo ventas pagadas en ese periodo.",
    }


# Endpoint interno /mcp; main.py lo monta bajo un prefijo
mcp_app = mcp.http_app(path="/mcp", stateless_http=True, json_response=True)