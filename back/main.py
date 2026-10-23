# main.py
import os
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import HTTPConnection
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter
from jwt_service import decodificar_token
from fastapi import File, UploadFile
from storage_client import MAX_BYTES, guardar_imagen
from models import PedidoModel, ProductoModel, UsuarioModel
from eventos import publicar, publicar_pedido, snapshot_producto
import logging
logger = logging.getLogger("uvicorn.error")

from database import engine, get_db
from schema import schema

from fastapi import HTTPException
from database import AsyncSessionLocal
from models import PedidoModel, ProductoModel
from mercadoPago_client import estado_pedido, obtener_orden, validar_firma
from email_service import enviar_confirmacion_pago




@asynccontextmanager
async def lifespan(app: FastAPI):
    # fail rápido si el .env está mal (antes lo descubrías en el primer request)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()   # antes: await pool.close()

async def _usuario_vigente(session: AsyncSession, payload: dict):
    """Confirma en la BD que la cuenta siga activa y usa el rol actual, no el del token."""
    fila = await session.get(UsuarioModel, int(payload["usuario_id"]))
    if fila is None or not fila.activo:
        return None
    return {**payload, "rol": fila.rol}

async def get_context(request: HTTPConnection, session: AsyncSession = Depends(get_db)) -> dict:
    # La sesión vive durante TODA la operación GraphQL (igual que antes)...
    # pero ahora también decodificamos quién anda pidiendo cosas 👀
    # HTTPConnection cubre tanto Request (HTTP) como WebSocket (subscriptions).
    usuario = None
    token_expirado = False

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ")
        payload = decodificar_token(token)
        if payload is None:
            token_expirado = True
        elif payload.get("tipo") == "access":
            usuario = await _usuario_vigente(session, payload)

    return {
        "session": session,
        "usuario": usuario,
        "token_expirado": token_expirado,
    }


graphql_app = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(lifespan=lifespan)
app.include_router(graphql_app, prefix="/graphql")

# Orígenes permitidos: local siempre, y el dominio de Netlify vía FRONTEND_URL
origenes = ["http://localhost:5173", "http://localhost:4321"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origenes.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/webhooks/mercadopago")
async def webhook_mercadopago(request: Request, background_tasks: BackgroundTasks):
    data_id = request.query_params.get("data.id", "")
    if not validar_firma(
        request.headers.get("x-signature", ""),
        request.headers.get("x-request-id", ""),
        data_id,
    ):
        raise HTTPException(status_code=401, detail="Firma inválida")

    if not data_id:
        cuerpo = await request.json()
        data_id = (cuerpo.get("data") or {}).get("id", "")
    if not data_id:
        return {"ok": True}

    orden = await obtener_orden(data_id)
    nuevo_estado = estado_pedido(orden)
    if nuevo_estado is None:
        return {"ok": True}

    try:
        pedido_id = int(orden["external_reference"])
    except (KeyError, TypeError, ValueError):
        return {"ok": True}

    correo = None
    eventos = []
    async with AsyncSessionLocal() as session:
        async with session.begin():
            pedido = await session.get(PedidoModel, pedido_id, with_for_update=True)
            if pedido is None or pedido.status != "PENDIENTE":
                return {"ok": True}

            pedido.status = nuevo_estado

            # Datos para el correo; se envía DESPUÉS del commit
            if nuevo_estado == "PAGADO" and pedido.usuario:
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

            if nuevo_estado in ("RECHAZADO", "CANCELADO"):
                for detalle in pedido.detalles:
                    producto = await session.get(
                        ProductoModel, detalle.producto_id, with_for_update=True
                    )
                    producto.stock += detalle.cantidad
                    eventos.append(snapshot_producto(producto))

    # Ya con la transacción cerrada: publicamos fuera del bloque
    for ev in eventos:
        publicar(ev)
    await publicar_pedido(pedido_id)

    if correo:
        background_tasks.add_task(enviar_confirmacion_pago, **correo)

    return {"ok": True}

@app.post("/admin/upload")
async def subir_imagen_producto(request: Request, archivo: UploadFile = File(...)):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta el token")

    payload = decodificar_token(auth_header.removeprefix("Bearer "))
    if payload is None or payload.get("tipo") != "access":
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    async with AsyncSessionLocal() as session:
        vigente = await _usuario_vigente(session, payload)
    if vigente is None or vigente["rol"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Solo administradores")

    contenido = await archivo.read(MAX_BYTES + 1)
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="La imagen no puede pasar de 2 MB")

    try:
        url = await guardar_imagen(contenido)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Falló la subida de imagen a Supabase Storage")
        raise HTTPException(status_code=502, detail="No se pudo guardar la imagen")

    return {"url": url}

# Si la carpeta no existe (por ejemplo, un repo sin imágenes), la crea
# en vez de tronar al arrancara
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")