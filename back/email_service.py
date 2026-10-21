import os
from email.utils import parseaddr
from html import escape

import httpx
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Peluches Crochet <tu_correo@ejemplo.com>")
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


async def enviar_correo(para: str, asunto: str, html: str) -> bool:
    """Nunca lanza excepción: un correo caído no debe romper el webhook."""
    if not BREVO_API_KEY:
        print("BREVO_API_KEY no configurada; correo omitido")
        return False

    nombre_remitente, correo_remitente = parseaddr(EMAIL_FROM)
    if not correo_remitente:
        print("EMAIL_FROM inválido; correo omitido")
        return False

    cuerpo = {
        "sender": {"name": nombre_remitente or "Peluches Crochet", "email": correo_remitente},
        "to": [{"email": para}],
        "subject": asunto,
        "htmlContent": html,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                BREVO_URL,
                headers={
                    "api-key": BREVO_API_KEY,
                    "accept": "application/json",
                    "content-type": "application/json",
                },
                json=cuerpo,
            )
        if r.status_code >= 400:
            print("Brevo error:", r.status_code, r.text)
            return False
        return True
    except httpx.HTTPError as e:
        print("Brevo error:", e)
        return False


async def enviar_confirmacion_pago(para, nombre, pedido_id, lineas, total, direccion=None):
    filas = "".join(
        f"<tr><td>{escape(n)}</td><td align='center'>{c}</td>"
        f"<td align='right'>${p * c:,.2f}</td></tr>"
        for n, c, p in lineas
    )
    envio = f"<p><b>Envío a:</b> {escape(direccion)}</p>" if direccion else ""
    html = f"""
    <h2>¡Gracias por tu compra, {escape(nombre)}!</h2>
    <p>Recibimos el pago de tu pedido <b>#{pedido_id}</b>.</p>
    <table width="100%" cellpadding="6" style="border-collapse:collapse">
      <tr><th align="left">Producto</th><th>Cant.</th><th align="right">Subtotal</th></tr>
      {filas}
    </table>
    <p><b>Total: ${total:,.2f} MXN</b></p>
    {envio}
    """
    return await enviar_correo(para, f"Pedido #{pedido_id} confirmado", html)