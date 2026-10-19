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

class MercadoPagoError(Exception):
    """Mercado Pago rechazó la petición (datos inválidos, token mal, etc.)."""


async def crear_orden_pago(
    pedido_id: int,
    items: list[dict],
    *,
    token: str,
    payment_method_id: str,
    payment_type: str,
    installments: int,
    email: str,
    identification: dict | None = None,
) -> dict:
    """
    Checkout API + Orders (modo automático): crea la order Y cobra en un solo paso.
    `token` es el card token que genera el Card Payment Brick en el navegador
    (de un solo uso). Cada item: {"titulo": str, "cantidad": int, "precio": número}.
    Regresa el JSON de la order tal cual lo manda Mercado Pago.
    """
    items_mp = []
    total = Decimal("0.00")
    for item in items:
        precio = Decimal(_monto(item["precio"]))
        total += precio * item["cantidad"]
        items_mp.append({
            "title": item["titulo"],
            "unit_price": _monto(precio),
            "quantity": item["cantidad"],
        })

    payer = {"email": email}
    if identification and identification.get("type") and identification.get("number"):
        payer["identification"] = {
            "type": identification["type"],
            "number": identification["number"],
        }

    body = {
        "type": "online",
        "processing_mode": "automatic",
        "total_amount": _monto(total),
        "external_reference": str(pedido_id),
        "payer": payer,
        "items": items_mp,
        "transactions": {
            "payments": [{
                "amount": _monto(total),
                "payment_method": {
                    "id": payment_method_id,
                    "type": payment_type,
                    "token": token,
                    "installments": installments,
                },
            }]
        },
    }

    # Misma clave para el mismo pedido + mismo token: si el cliente reintenta
    # por un timeout, MP no cobra dos veces.
    llave = hashlib.sha256(f"{pedido_id}:{token}".encode()).hexdigest()
    idempotency_key = str(uuid.UUID(llave[:32]))

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        respuesta = await client.post(
            f"{MP_API_URL}/v1/orders",
            json=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {_access_token()}",
                "X-Idempotency-Key": idempotency_key,
            },
        )

    if respuesta.status_code in (200, 201):
        return respuesta.json()

    try:
        cuerpo = respuesta.json()
    except ValueError:
        cuerpo = {}

    # 402 (u otro 4xx) con la order en "data" = el pago SÍ se procesó pero lo
    # rechazaron (tarjeta/banco). Regresamos la order para que el pedido quede
    # RECHAZADO, se devuelva el stock y el front muestre un mensaje bonito.
    orden = cuerpo.get("data") if isinstance(cuerpo, dict) else None
    if isinstance(orden, dict) and orden.get("status"):
        return orden

    # Error "de verdad" (datos mal, token vencido...): el detalle va a la
    # terminal de uvicorn y al usuario solo le llega un mensaje corto.
    print(f"[MercadoPago] Error {respuesta.status_code}: {respuesta.text}")
    raise MercadoPagoError(
        "No pudimos procesar el pago. Revisa los datos de tu tarjeta e intenta de nuevo."
    )

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
    if status in ("canceled", "expired"):
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