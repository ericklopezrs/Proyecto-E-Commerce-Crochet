# main.py
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter
from jwt_service import decodificar_token


from database import engine, get_db
from schema import schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    # fail rápido si el .env está mal (antes lo descubrías en el primer request)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()   # antes: await pool.close()


async def get_context(request: Request, session: AsyncSession = Depends(get_db)) -> dict:
    # La sesión vive durante TODA la operación GraphQL (igual que antes)...
    # pero ahora también decodificamos quién anda pidiendo cosas 👀
    usuario = None
    token_expirado = False

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ")
        payload = decodificar_token(token)
        if payload is None:
            token_expirado = True
        elif payload.get("tipo") == "access":
            usuario = payload

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

# Si la carpeta no existe (por ejemplo, un repo sin imágenes), la crea
# en vez de tronar al arrancar
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")