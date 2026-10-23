import asyncio
import logging
from collections import defaultdict

logger = logging.getLogger("uvicorn.error")

_canales: dict[str, set[asyncio.Queue]] = defaultdict(set)


def snapshot_producto(p) -> dict:
    """Foto simple del producto (sin objetos ORM) para mandarla por la subscription."""
    return {
        "id": str(p.id),
        "nombre": p.nombre,
        "precio": float(p.precio),
        "stock": p.stock,
        "activo": p.activo,
        "descripcion": p.descripcion,
        "imagen": p.imagen,
        "categoria_id": str(p.categoria_id) if p.categoria_id is not None else None,
    }


def publicar(evento: dict, canal: str = "productos") -> None:
    for cola in list(_canales.get(canal, ())):
        try:
            cola.put_nowait(evento)
        except asyncio.QueueFull:
            pass  # cliente muy lento: se omite, se resincroniza al reconectar


async def escuchar(canal: str = "productos"):
    cola: asyncio.Queue = asyncio.Queue(maxsize=100)
    _canales[canal].add(cola)
    try:
        while True:
            yield await cola.get()
    finally:
        _canales[canal].discard(cola)


async def publicar_pedido(pedido_id: int) -> None:
    """Relee el pedido en una sesión corta (ya con todo cargado) y lo publica a los admins."""
    if not _canales.get("pedidos"):
        return  # nadie escuchando: no vale la pena consultar la base

    # Imports aquí dentro para evitar importaciones circulares
    from database import AsyncSessionLocal
    from models import PedidoModel

    try:
        async with AsyncSessionLocal() as session:
            p = await session.get(PedidoModel, pedido_id)
            if p is None:
                return
            evento = {
                "id": str(p.id),
                "fecha": p.fecha.isoformat() if p.fecha else "",
                "fecha_pago": p.fecha_pago.isoformat() if p.fecha_pago else None,
                "total": float(p.total),
                "status": p.status,
                "direccion_envio": p.direccion_envio,
                "usuario": (
                    {"id": str(p.usuario.id), "nombre": p.usuario.nombre, "email": p.usuario.email}
                    if p.usuario
                    else None
                ),
                "detalles": [
                    {
                        "id": str(d.id),
                        "cantidad": d.cantidad,
                        "precio_unitario": float(d.precio_unitario),
                        "producto": (
                            {"id": str(d.producto.id), "nombre": d.producto.nombre, "imagen": d.producto.imagen}
                            if d.producto
                            else None
                        ),
                    }
                    for d in p.detalles
                ],
            }
        publicar(evento, "pedidos")
    except Exception:
        # Un fallo al avisar nunca debe romper la compra ni el webhook
        logger.exception("No se pudo publicar el evento del pedido %s", pedido_id)