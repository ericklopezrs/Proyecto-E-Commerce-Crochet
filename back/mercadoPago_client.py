import hashlib
import hmac
import os
import uuid
from decimal import Decimal, ROUND_HALF_UP
import httpx
from dotenv import load_dotenv

load_dotenv()

MP_API_URL = "https://api.mercadopago.com"
TIMEOUT = httpx.Timeout(15.0)

def _access_token():
    token = os.getenv("MP_ACCESS_TOKEN")
    if not token:
        raise ValueError("MP_ACCESS_TOKEN is not set in the environment variables.")
    return token

def _monto(valor) -> str:
    """Mercado Pago requires the amount to be a string with two decimal places."""
    return str(Decimal(str(valor)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

async def crear_orden(pedido_id: int, items: list[dict]) -> dict:
    """
    Crea una order de Checkout Pro y regresa {"id": ..., "checkout_url": ...}
    Cada item: {"titulo": str, "cantidad": int, "precio": número}
    """
    frontend = os.getenv("FRONTEND_URL", "http://localhost:4321").rstrip("/")

    items_mp = []
    total = Decimal("0.00")
    for item in items:
        precio = Decimal(_monto(item["precio"]))
        subtotal = precio * item["cantidad"]
        total += subtotal
        items_mp.append({
            "title": item["titulo"],
            "unit_price": _monto(precio),
            "quantity": item["cantidad"],
            "unit_measure": "unit",
            "total_amount": _monto(subtotal),
        })

    url_retorno = f"{frontend}/checkout/resultado"
    config_online = {
        "success_url": url_retorno,
        "pending_url": url_retorno,
        "failure_url": url_retorno,
    }

    #auto_return solo si el front es HTTPS
    if frontend.startswith("https://"):
        config_online["auto_return"] = "approved"

    body = {
        "type": "online",
        "processing_mode": "manual",
        "total_amount": _monto(total),
        "external_reference": str(pedido_id),
        "expiration_time": "PT30M",
        "items": items_mp,
        "config": {"online": config_online},
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        respuesta = await client.post(
            f"{MP_API_URL}/v1/orders",
            json=body,
            headers={
                "Authorization": f"Bearer {_access_token()}",
                "X-Idempotency-Key": str(uuid.uuid4()),
            },
        )

    if respuesta.status_code not in (200, 201):
        raise Exception (f"Mercado PAgo a rechazado la orden ({respuesta.status_code}): {respuesta.text}")

    datos = respuesta.json()
    return {"id": datos["id"], "checkout_url": datos["checkout_url"]}

async def obtener_orden(order_id: str) -> dict:
    """Consulta a mercado pago el estado de una orden"""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        respuesta = await client.get(
            f"{MP_API_URL}/v1/orders/{order_id}",
            headers={"Authorization": f"Bearer {_access_token()}"},

        )

    if respuesta.status_code != 200:
        raise Exception(f"Mercado Pago no pudo obtener la orden {order_id} ({respuesta.status_code}): {respuesta.text}")

    return respuesta.json()

def estado_pedido(orden: dict) -> str | None:
    """Traduce el estado de mercado pago al status de la tabla de pedidos (None = no cambiar)"""
    status = orden.get("status")
    detalle = orden.get("status_detail")

    if status == "processed" and detalle == "accredited":
        return "PAGADO"
    if status == "failed":
        return "RECHAZADO"
    if status == "canceled":
        return "CANCELADO"
    return None

def validar_firma(x_signature: str, x_request_id: str, data_id: str) -> bool:
    """Comprueba que el webhook de verdad lo mando Mercado Pago"""
    secreto = os.getenv("MP_WEBHOOK_SECRET")
    if not secreto:
        return False
    #ts pmo fr gng
    ts = None
    firma_recibida = None
    for parte in x_signature.split(","):
        if "=" not in parte:
            continue
        clave, _, valor = parte.partition("=")
        clave, valor = clave.strip(), valor.strip()
        if clave == "ts":
            ts = valor
        elif clave == "v1":
            firma_recibida = valor

    if ts is None or firma_recibida is None:
        return False

    segmentos = []
    if data_id:
        segmentos.append(f"id:{data_id.lower()}")
    if x_request_id:
        segmentos.append(f"request-id:{x_request_id}")
    segmentos.append(f"ts:{ts}")
    manifiesto = ";".join(segmentos) + ";"
    firma_calculada = hmac.new(
        secreto.encode(),
        manifiesto.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(firma_calculada, firma_recibida)