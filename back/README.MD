# Backend — Peluches Crochet (P2-6)

Servidor GraphQL en FastAPI + Strawberry, conectado a PostgreSQL con SQLAlchemy (async).

## Requisitos
- Python 3.12+
- PostgreSQL 14+ corriendo localmente (o accesible por red)

## Instalación

1. Crea y activa un entorno virtual:
```bash
   python3 -m venv venv
   source venv/bin/activate
```

2. Instala dependencias:
```bash
   pip install fastapi uvicorn strawberry-graphql[fastapi] sqlalchemy[asyncio] asyncpg python-dotenv
```

3. Crea la base de datos y carga el esquema + datos de ejemplo:
```bash
   createdb ecommerce_p26
   psql -U postgres -d ecommerce_p26 -f db.sql
```

4. Copia el archivo de variables de entorno y ajusta tus credenciales:
```bash
   cp .env.example .env
```
   Edita `.env` con tu usuario/contraseña reales de PostgreSQL.

5. Crea la carpeta de imágenes si no existe:
```bash
   mkdir -p uploads
```

6. Levanta el servidor:
```bash
   uvicorn main:app --reload --port 4000
```

El servidor queda disponible en `http://localhost:4000/graphql`, con el GraphQL Playground integrado en esa misma ruta.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_USER` | Usuario de PostgreSQL |
| `DB_HOST` | Host de la base (ej. `localhost`) |
| `DB_NAME` | Nombre de la base (`ecommerce_p26`) |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (default `5432`) |

## Endpoint único
`POST /graphql` — queries y mutations documentadas en `schema.py`.

## Estructura del proyecto

| Archivo | Contenido |
|---|---|
| `main.py` | App de FastAPI, lifespan (conexión a BD) y montaje del router GraphQL |
| `database.py` | Engine async de SQLAlchemy, sesión y `Base` declarativa |
| `models.py` | Modelos ORM (`CategoriaModel`, `ProductoModel`, `UsuarioModel`, `PedidoModel`, `DetallePedidoModel`) |
| `schema.py` | Tipos GraphQL (Strawberry), Query y Mutation |

## Imágenes
Se sirven de forma estática en `/uploads/<nombre_archivo>`.