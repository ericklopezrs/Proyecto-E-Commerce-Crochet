import { useEffect, useRef, useState } from 'react';
import { Lock, CircleCheck, CircleAlert, ShoppingBag, Clock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import {
  registrarPedido,
  pagarPedido,
  obtenerMiPedido,
} from '../../services/pedidos.js';
import '../../styles/pedidos.css';

const PUBLIC_KEY = import.meta.env.PUBLIC_MP_PUBLIC_KEY;
const BRICK_ID = 'cardPaymentBrick_container';

function cargarSdkMP() {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Mercado Pago'));
    document.head.appendChild(script);
  });
}

// Mensajes amigables para los status_detail más comunes de rechazo.
const MOTIVOS = {
  rejected_by_issuer: 'Tu banco rechazó el pago. Prueba con otra tarjeta.',
  failed: 'El pago no pasó. Prueba con otra tarjeta.',
  cc_rejected_insufficient_amount: 'La tarjeta no tiene fondos suficientes.',
  cc_rejected_bad_filled_security_code: 'El código de seguridad es incorrecto.',
  cc_rejected_bad_filled_date: 'La fecha de vencimiento es incorrecta.',
  cc_rejected_bad_filled_other: 'Revisa los datos de la tarjeta.',
  cc_rejected_call_for_authorize: 'Tu banco necesita autorizar el pago; llámales y vuelve a intentar.',
  cc_rejected_card_disabled: 'La tarjeta está deshabilitada.',
  cc_rejected_duplicated_payment: 'Ya hiciste un pago igual hace poco.',
  cc_rejected_max_attempts: 'Superaste el máximo de intentos.',
};

const mxn = (n) =>
  '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';

const IMAGEN_RESPALDO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<text x="50%" y="54%" font-size="14" text-anchor="middle" ' +
      'fill="#94a3b8" font-family="sans-serif">Sin foto</text></svg>'
  );

function Aviso({ children }) {
  return (
    <div className="main-container">
      <main className="content">
        <div className="pc-page pc-page-narrow">{children}</div>
      </main>
    </div>
  );
}

function Vacio({ icono, texto, href, boton }) {
  return (
    <Aviso>
      <div className="pc-card pc-empty">
        {icono}
        <p style={{ margin: 0 }}>{texto}</p>
        {href && (
          <div className="pc-actions">
            <a href={href} className="pc-btn pc-btn-morado">{boton}</a>
          </div>
        )}
      </div>
    </Aviso>
  );
}

export default function CheckoutIsland() {
  const { cart, clearCart, getTotal } = useCartStore();
  const { access_token, usuario } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [errorPedido, setErrorPedido] = useState('');
  const [brickListo, setBrickListo] = useState(false);
  const [resultado, setResultado] = useState(null); // { estado, total, motivo }

  // ?pedido=ID  -> pagar un pedido que ya existía (botón "Pagar ahora" de Mis pedidos)
  const [pedidoParam, setPedidoParam] = useState(null);
  const [pedidoExistente, setPedidoExistente] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const pedidoIdRef = useRef(null); // pedido creado en este checkout (para reintentos)
  const submitRef = useRef(null);
  const montadoRef = useRef(false);

  // ---------- leer ?pedido= ----------
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('pedido');
    if (id) setPedidoParam(id);
  }, []);

  useEffect(() => {
    if (!pedidoParam || !access_token) return;
    setCargandoPedido(true);
    obtenerMiPedido(pedidoParam)
      .then((p) => {
        if (!p) throw new Error('No encontramos ese pedido.');
        setPedidoExistente(p);
      })
      .catch((err) => setErrorCarga(err.message))
      .finally(() => setCargandoPedido(false));
  }, [pedidoParam, access_token]);

  // ---------- qué se va a cobrar ----------
  const usandoPedido = Boolean(pedidoParam);
  const lineas = usandoPedido
    ? (pedidoExistente?.detalles ?? []).map((d) => ({
        id: d.id,
        nombre: d.producto?.nombre ?? 'Producto',
        imagen: d.producto?.imagen,
        cantidad: d.cantidad,
        subtotal: d.cantidad * d.precio_unitario,
      }))
    : cart.map((i) => ({
        id: i.producto.id,
        nombre: i.producto.nombre,
        imagen: i.producto.imagen,
        cantidad: i.cantidad,
        subtotal: i.producto.precio * i.cantidad,
      }));

      const { registrarPedido: pedido } = await registrarPedido({
        usuarioId: usuario.id,
        total: parseFloat(getTotal()),
        items,
      });

      const { checkout_url } = await iniciarPago(pedido.id);
      window.location.href = checkout_url;
    } catch (err) {
      alert('Error al iniciar el pago: ' + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="main-container">
      <main className="content">
        <div style={{ maxWidth: '550px', margin: '0 auto' }}>
          <a href="/carrito" className="back-button" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
            Volver al carrito
          </a>

    (async () => {
      if (!PUBLIC_KEY) {
        setErrorPedido('Falta PUBLIC_MP_PUBLIC_KEY en front/.env');
        return;
      }
      try {
        await cargarSdkMP();
        if (cancelado) return;

          <div className="cart-box">
            <h4 style={{ margin: '0 0 16px 0', color: '#64748b' }}>Resumen del Pedido</h4>

    return () => {
      cancelado = true;
      if (controller) {
        controller.unmount();
        controller = null;
      }
      montadoRef.current = false;
    };
  }, [puedePagar, total]);

            <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '16px 0' }} />

            <div className="cart-total-row" style={{ paddingTop: '0' }}>
              <span>Total a Pagar:</span>
              <span style={{ fontSize: '22px' }}>${getTotal()} MXN</span>
            </div>

  if (resultado) {
    const ok = resultado.estado === 'PAGADO';
    const pendiente = resultado.estado === 'PENDIENTE';
    const clase = ok ? 'pc-result-ok' : pendiente ? 'pc-result-wait' : 'pc-result-error';
    return (
      <Aviso>
        <div className={`pc-card pc-result ${clase}`}>
          <div className="pc-result-icon">
            {ok ? <CircleCheck size={38} /> : pendiente ? <Clock size={38} /> : <CircleAlert size={38} />}
          </div>
          {ok && (
            <>
              <h3>¡Pago aprobado!</h3>
              <p>Recibimos tu pago de <strong>{mxn(resultado.total)}</strong>. ¡Gracias por tu compra! 🧶</p>
            </>
          )}
          {pendiente && (
            <>
              <h3>Tu pago está en proceso</h3>
              <p>Mercado Pago aún lo está validando. Esta pantalla se actualiza sola; también lo ves en “Mis pedidos”.</p>
            </>
          )}
          {!ok && !pendiente && (
            <>
              <h3>No se pudo completar el pago</h3>
              <p>
                {resultado.estado === 'RECHAZADO' ? 'Tu pago fue rechazado.' : 'El pago se canceló.'}{' '}
                {resultado.motivo} Tu carrito sigue intacto, puedes intentarlo de nuevo.
              </p>
            </>
          )}
          <div className="pc-actions">
            {!ok && !pendiente ? (
              <a href="/carrito" className="pc-btn pc-btn-morado">Volver al carrito</a>
            ) : (
              <>
                <a href="/mis-pedidos" className="pc-btn pc-btn-ghost">Mis pedidos</a>
                <a href="/" className="pc-btn pc-btn-morado">
                  <ShoppingBag size={16} /> Seguir comprando
                </a>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}