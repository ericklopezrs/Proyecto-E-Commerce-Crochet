# database.py
import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

load_dotenv()  # ⚠️ ANTES de leer cualquier variable — este era el bug del .env

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

# quote_plus: una contraseña con @ : / # ya no rompe la URL silenciosamente
DATABASE_URL = (
    f"postgresql+asyncpg://{DB_USER}:{quote_plus(DB_PASSWORD or '')}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_async_engine(DATABASE_URL, echo=True)  # echo=False en producción

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # ← CRÍTICO, ver nota
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session  # el async with ya cierra la sesión; el try/finally sobraba