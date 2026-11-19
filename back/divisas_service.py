import time

import httpx

_cache = {"rates": None, "ts": 0.0}
TTL_SEG = 3600


async def obtener_tasa(moneda: str = "USD") -> float:
    ahora = time.time()
    if _cache["rates"] is None or ahora - _cache["ts"] > TTL_SEG:
        try:
            async with httpx.AsyncClient(timeout=6) as client:
                r = await client.get("https://open.er-api.com/v6/latest/MXN")
                r.raise_for_status()
                data = r.json()
            if data.get("result") == "success":
                _cache["rates"], _cache["ts"] = data["rates"], ahora
        except (httpx.HTTPError, ValueError):
            pass  # si falla, usamos la caché vieja si existe
    if _cache["rates"] is None:
        raise Exception("No se pudo obtener el tipo de cambio")
    tasa = _cache["rates"].get(moneda.upper())
    if tasa is None:
        raise Exception(f"Moneda no soportada: {moneda}")
    return float(tasa)