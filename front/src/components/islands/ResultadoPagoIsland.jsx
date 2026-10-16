import { useEffect, useState } from 'react';
import { useCartStore } from '../../store/useCartStore.js';
import { obtenerMiPedido } from '../../services/pedidos.js';

const INTERVALO_MS = 3000;
const MAX_INTENTOS = 10;

const MENSAJES = {
    PAGADO: { titulo: '¡Pago recibido!', texto: 'Tu pedido quedó confirmado. Gracias por tu compra.' },
    RECHAZADO: { titulo: 'Pago rechazado', texto: 'Mercado Pago no pudo procesar el pago. Puedes intentarlo de nuevo desde el carrito.' },
    CANCELADO: { titulo: 'Pedido cancelado', texto: 'El pedido se canceló o expiró antes de pagarse. Tu carrito sigue disponible.' },
};

export default function ResultadoPagoIsland() {
    const { clearCart } = useCartStore();
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState(null);
    const [agotado, setAgotado] = useState(false);

    useEffect(() => {
    const pedidoId = new URLSearchParams(window.location.search).get('external_reference');
    if (!pedidoId) {
        setError('No encontramos el pedido en la dirección.');
        return;
    }

    let intentos = 0;
    let timer;
    let cancelado = false;

    const consultar = async () => {
        try {
        const p = await obtenerMiPedido(pedidoId);
        if (cancelado) return;
        if (!p) {
            setError('No encontramos ese pedido.');
            return;
        }
        setPedido(p);

        if (p.status === 'PAGADO') {
            clearCart();
            return;
        }
        if (p.status !== 'PENDIENTE') return;

        intentos += 1;
        if (intentos >= MAX_INTENTOS) {
            setAgotado(true);
            return;
        }
        timer = setTimeout(consultar, INTERVALO_MS);
        } catch (err) {
        if (!cancelado) setError(err.message);
        }
    };

    consultar();
    return () => {
        cancelado = true;
        clearTimeout(timer);
    };
    }, []);

    let contenido;
    if (error) {
    contenido = <p>{error}</p>;
    } else if (!pedido) {
    contenido = <p>Confirmando tu pago...</p>;
    } else if (pedido.status === 'PENDIENTE') {
    contenido = agotado ? (
        <p>Tu pago sigue en proceso. Revisa tu pedido en unos minutos.</p>
    ) : (
        <p>Confirmando tu pago con Mercado Pago...</p>
    );
    } else {
    const m = MENSAJES[pedido.status];
    contenido = (
        <>
        <h3 className="section-title">{m.titulo}</h3>
        <p>{m.texto}</p>
        </>
    );
    }

    return (
    <div className="main-container">
        <main className="content">
        <div className="empty-cart" style={{ maxWidth: '480px', margin: '0 auto' }}>
            {contenido}
            <a href="/" className="primary-btn-sm" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '12px' }}>
            Volver a la tienda
            </a>
        </div>
        </main>
    </div>
    );
}