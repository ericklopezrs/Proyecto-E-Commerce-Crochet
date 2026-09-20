# main.py
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import GraphQLRouter

from database import engine, get_db
from schema import schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    # fail rápido si el .env está mal (antes lo descubrías en el primer request)
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    yield
    await engine.dispose()   # antes: await pool.close()


async def get_context(session: AsyncSession = Depends(get_db)) -> dict:
    # La sesión vive durante TODA la operación GraphQL: FastAPI cierra la
    # dependencia con yield después de enviar la respuesta → los resolvers
    # anidados también pueden usarla.
    return {"session": session}


graphql_app = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(lifespan=lifespan)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")