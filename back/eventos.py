import asyncio

_suscriptores: set[asyncio.Queue] = set()


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


def publicar(evento: dict) -> None:
    for cola in list(_suscriptores):
        try:
            cola.put_nowait(evento)
        except asyncio.QueueFull:
            pass  # cliente muy lento: se omite, se resincroniza al reconectar


async def escuchar():
    cola: asyncio.Queue = asyncio.Queue(maxsize=100)
    _suscriptores.add(cola)
    try:
        while True:
            yield await cola.get()
    finally:
        _suscriptores.discard(cola)