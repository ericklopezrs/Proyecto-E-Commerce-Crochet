# main.py
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter

from database import engine, get_db
from jwt_service import decodificar_token
from schema import schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    # fail rápido si el .env está mal (antes lo descubrías en el primer request)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()   # antes: await pool.close()


async def get_context(request: Request, session: AsyncSession = Depends(get_db)) -> dict:
    # La sesión vive durante TODA la operación GraphQL (ver nota original).
    # Además leemos el Bearer token de CADA petición:
    #   usuario        → payload del access token (o None)
    #   token_expirado → hubo token pero no se pudo decodificar/expiró
    usuario = None
    token_expirado = False

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        payload = decodificar_token(auth_header.removeprefix("Bearer "))
        if payload is None:
            token_expirado = True
        elif payload.get("tipo") == "access":   # un refresh token NO sirve como sesión
            usuario = payload

    return {"session": session, "usuario": usuario, "token_expirado": token_expirado}


graphql_app = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(lifespan=lifespan)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4321"],  # ← agrégale el 4321
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")