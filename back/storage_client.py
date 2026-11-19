import os
import uuid

import httpx

BUCKET = "productos"
MAX_BYTES = 2 * 1024 * 1024  # 2 MB
TIMEOUT = httpx.Timeout(30.0)


def _detectar_tipo(contenido: bytes) -> tuple[str, str] | None:
    """Lee los primeros bytes del archivo en lugar de confiar en lo que diga el navegador."""
    if contenido.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


async def guardar_imagen(contenido: bytes) -> str:
    """Sube la imagen al bucket y regresa su URL pública."""
    url = os.getenv("SUPABASE_URL")
    llave = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not llave:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el entorno")
    url = url.rstrip("/")

    tipo = _detectar_tipo(contenido)
    if tipo is None:
        raise ValueError("Formato no permitido. Usa JPG, PNG o WebP")
    content_type, extension = tipo

    nombre = f"{uuid.uuid4().hex}.{extension}"

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        respuesta = await client.post(
            f"{url}/storage/v1/object/{BUCKET}/{nombre}",
            content=contenido,
            headers={
                "Authorization": f"Bearer {llave}",
                "apikey": llave,
                "Content-Type": content_type,
            },
        )

    if respuesta.status_code not in (200, 201):
        raise RuntimeError(f"Supabase Storage respondió {respuesta.status_code}: {respuesta.text}")

    return f"{url}/storage/v1/object/public/{BUCKET}/{nombre}"