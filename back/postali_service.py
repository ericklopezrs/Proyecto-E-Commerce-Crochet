import re

import httpx

POSTALI_URL = "https://postali.app/api/v1/mx/cp"
_cache: dict[str, dict] = {}


async def buscar_cp(cp: str) -> dict:
    if not re.fullmatch(r"\d{5}", cp):
        raise Exception("El código postal debe tener 5 dígitos")
    if cp in _cache:
        return _cache[cp]

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{POSTALI_URL}/{cp}")
    except httpx.HTTPError:
        raise Exception("No se pudo consultar el código postal, intenta de nuevo")

    if r.status_code in (400, 404):
        raise Exception("Código postal no encontrado")
    if r.status_code != 200:
        raise Exception("No se pudo consultar el código postal, intenta de nuevo")

    try:
        data = r.json()
    except ValueError:
        raise Exception("No se pudo consultar el código postal, intenta de nuevo")

    asentamientos = data.get("asentamientos") or []
    colonias = [a["nombre"] for a in asentamientos if a.get("nombre")]
    if not colonias:
        raise Exception("Código postal no encontrado")

    ciudad = next((a.get("ciudad") for a in asentamientos if a.get("ciudad")), None)

    resultado = {
        "cp": cp,
        "estado": data.get("estado", ""),
        "municipio": data.get("municipio", ""),
        "ciudad": ciudad,
        "colonias": colonias,
    }
    _cache[cp] = resultado
    return resultado