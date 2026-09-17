
# Backend — Peluches Crochet (P2-6)

Servidor GraphQL en Node.js + Express + Apollo Server, conectado a PostgreSQL.

## Requisitos
- Node.js 18+
- PostgreSQL 14+ corriendo localmente (o accesible por red)

## Instalación

1. Instala dependencias:
```bash
   npm install
```

2. Crea la base de datos y carga el esquema + datos de ejemplo:
```bash
   createdb ecommerce_p26
   psql -U postgres -d ecommerce_p26 -f db.sql
```

3. Copia el archivo de variables de entorno y ajusta tus credenciales:
```bash
   cp .env.example .env
```
   Edita `.env` con tu usuario/contraseña reales de PostgreSQL.

4. Levanta el servidor:
```bash
   node index.js
```
   (o `npm start` si lo defines en `package.json`)

El servidor queda disponible en `http://localhost:4000/graphql`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_USER` | Usuario de PostgreSQL |
| `DB_HOST` | Host de la base (ej. `localhost`) |
| `DB_NAME` | Nombre de la base (`ecommerce_p26`) |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (default `5432`) |
| `PORT` | Puerto donde corre el servidor GraphQL (default `4000`) |

## Endpoint único
`POST /graphql` — queries y mutations documentadas en `schema.js`.

## Imágenes
Se sirven de forma estática en `/uploads/<nombre_archivo>`.