import asyncio, os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def probar(ssl):
    try:
        conn = await asyncpg.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host="127.0.0.1",
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME"),
            ssl=ssl,
        )
        print(f"ssl={ssl}: CONECTÓ ->", await conn.fetchval("SELECT version()"))
        await conn.close()
    except Exception as e:
        print(f"ssl={ssl}: FALLÓ ->", type(e).__name__, e)

async def main():
    print("DB_USER =", os.getenv("DB_USER"), "| DB_NAME =", os.getenv("DB_NAME"), "| DB_PORT =", os.getenv("DB_PORT"))
    await probar(False)
    await probar("prefer")

asyncio.run(main())