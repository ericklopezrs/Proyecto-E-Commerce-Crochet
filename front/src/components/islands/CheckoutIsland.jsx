import { useEffect, useRef, useState } from 'react';
import { Lock, CircleCheck, CircleAlert, ShoppingBag, Clock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import {
  registrarPedido,
  pagarPedido,
  obtenerMiPedido,
} from '../../services/pedidos.js';
import { buscarPorCP } from '../../services/direccion.js';
import PrecioUSD from '../PrecioUSD.jsx';
import '../../styles/pedidos.css';

const PUBLIC_KEY = import.meta.env.PUBLIC_MP_PUBLIC_KEY;
const BRICK_ID = 'cardPaymentBrick_container';

const campo = {
  width: '100%', padding: '10px', border: '1px solid #cbd5e1',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
};

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


// status_detail que manda Mercado Pago cuando el pago falla.
// Algunos códigos no vienen en la documentación de Orders, así que también
// incluimos los nombres viejos (cc_rejected_*) por si llegan así.
const MOTIVOS = {
  // OTHE
  rejected_by_issuer: 'Rechazado por error general',
  cc_rejected_other_reason: 'Rechazado por error general',

  // FUND
  insufficient_amount: 'Rechazado por importe insuficiente',
  card_insufficient_amount: 'Rechazado por importe insuficiente',
  cc_rejected_insufficient_amount: 'Rechazado por importe insuficiente',

  // SECU / EXPI / FORM / CARD
  bad_filled_card_data: 'Rechazado debido a un error de formulario',
  cc_rejected_bad_filled_other: 'Rechazado debido a un error de formulario',
  cc_rejected_bad_filled_security_code: 'Rechazado por código de seguridad inválido',
  cc_rejected_bad_filled_date: 'Rechazado debido a un problema de fecha de vencimiento',
  cc_rejected_bad_filled_card_number: 'Rechazado por falta de card_number',

  // CALL
  required_call_for_authorize: 'Rechazado con validación para autorizar',
  cc_rejected_call_for_authorize: 'Rechazado con validación para autorizar',

  // INST
  invalid_installments: 'Rechazado por cuotas invalidas',
  cc_rejected_invalid_installments: 'Rechazado por cuotas invalidas',

  // DUPL
  duplicated_payment: 'Rechazado por pago duplicado',
  cc_rejected_duplicated_payment: 'Rechazado por pago duplicado',

  // LOCK
  card_disabled: 'Rechazado por tarjeta deshabilitada',
  cc_rejected_card_disabled: 'Rechazado por tarjeta deshabilitada',

  // CTNA
  card_type_not_allowed: 'Rechazado por tipo de tarjeta no permitida',
  cc_rejected_card_type_not_allowed: 'Rechazado por tipo de tarjeta no permitida',

  // ATTE
  max_attempts_exceeded: 'Rechazado debido a intentos excedidos del pin de la tarjeta',
  cc_rejected_max_attempts: 'Rechazado debido a intentos excedidos del pin de la tarjeta',

  // BLAC
  high_risk: 'Rechazado por estar en lista negra',
  cc_rejected_blacklist: 'Rechazado por estar en lista negra',
  cc_rejected_high_risk: 'Rechazado por estar en lista negra',

  // UNSU
  unsupported: 'No soportado',
  cc_rejected_unsupported: 'No soportado',

  // TEST
  amount_limit_exceeded: 'Usado para aplicar regla de montos',

  // Sin mensaje en tu lista: se quedan los anteriores
  invalid_card_token: 'Los datos de la tarjeta expiraron. Vuelve a capturarlos.',
  processing_error: 'Hubo un error al procesar el pago. Intenta de nuevo en unos minutos.',
  '3ds_challenge_expired': 'Se acabó el tiempo para validar el pago con tu banco.',
  expired: 'El pago expiró antes de completarse.',
  canceled: 'El pago fue cancelado.',
};

// CONT
const MOTIVOS_PENDIENTE = {
  in_process: 'Pendiente de pago',
  pending_review_manual: 'Pendiente de pago',
  in_review: 'Pendiente de pago',
  contingency: 'Pendiente de pago',
  pending_contingency: 'Pendiente de pago',
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

  const [errorPedido, setErrorPedido] = useState('');
  const [brickListo, setBrickListo] = useState(false);
  const [resultado, setResultado] = useState(null); // { estado, total, motivo }

  // ---------- dirección de envío (solo para pedidos nuevos) ----------
  const [dir, setDir] = useState({ cp: '', colonia: '', calle: '' });
  const [zona, setZona] = useState(null);
  const [errorCP, setErrorCP] = useState('');

  const handleCP = async (valor) => {
    const cp = valor.replace(/\D/g, '').slice(0, 5);
    setDir((d) => ({ ...d, cp, colonia: '' }));
    setZona(null);
    setErrorCP('');
    if (cp.length !== 5) return;
    try {
      const info = await buscarPorCP(cp);
      setZona(info);
      setDir((d) => ({ ...d, colonia: info.colonias[0] ?? '' }));
    } catch (err) {
      setErrorCP(err.message);
    }
  };

  const direccionLista = Boolean(zona && dir.colonia && dir.calle.trim().length >= 5);

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
  const total = usandoPedido ? Number(pedidoExistente?.total ?? 0) : Number(getTotal());

  const puedePagar =
    Boolean(access_token) &&
    !resultado &&
    total > 0 &&
    (usandoPedido ? pedidoExistente?.status === 'PENDIENTE' : cart.length > 0);

  // ---------- lo que pasa al darle "Pagar" en el Brick ----------
  submitRef.current = async (formData) => {
    setErrorPedido('');

    // Un pedido nuevo necesita dirección antes de cobrar
    if (!usandoPedido && !pedidoIdRef.current && !direccionLista) {
      const msg = 'Completa tu dirección de envío antes de pagar.';
      setErrorPedido(msg);
      throw new Error(msg); // el Brick vuelve a habilitar el botón
    }

    try {
      let pedidoId = usandoPedido ? pedidoExistente.id : pedidoIdRef.current;

      // 1) Crear el pedido (aparta stock) solo la primera vez
      if (!pedidoId) {
        const items = cart.map((item) => ({
          producto_id: String(item.producto.id),
          cantidad: parseInt(item.cantidad, 10),
          precio_unitario: parseFloat(item.producto.precio),
        }));
        const { registrarPedido: pedido } = await registrarPedido({
          usuarioId: usuario.id,
          total: parseFloat(getTotal()),
          items,
          direccion: `${dir.calle.trim()}, ${dir.colonia}, CP ${dir.cp}, ${zona.municipio}, ${zona.estado}`,
        });
        pedidoId = pedido.id;
        pedidoIdRef.current = pedidoId;
      }

      // 2) Cobrar con el token que generó el Brick
      const pago = await pagarPedido({
        pedidoId,
        token: formData.token,
        paymentMethodId: formData.payment_method_id,
        paymentType: formData.paymentTypeId,
        installments: formData.installments,
        email: formData.payer?.email,
        identificationType: formData.payer?.identification?.type,
        identificationNumber: formData.payer?.identification?.number,
      });

      console.log('Resultado Mercado Pago:', pago.mp_status, pago.mp_status_detail);

      if (pago.pedido_status === 'PAGADO') {
        if (!usandoPedido) clearCart();
        setResultado({ estado: 'PAGADO', total });
      } else if (pago.pedido_status === 'PENDIENTE') {
        setResultado({
          estado: 'PENDIENTE',
          total,
          pedidoId,
          motivo: MOTIVOS_PENDIENTE[pago.mp_status_detail] ?? '',
        });
      } else {
        // RECHAZADO / CANCELADO: ese pedido ya murió (el stock se regresó)
        pedidoIdRef.current = null;
        setResultado({
          estado: pago.pedido_status,
          total,
          motivo: MOTIVOS[pago.mp_status_detail] ?? 'Rechazado por error general',
        });
      }
    } catch (err) {
      // Error "reintentable": el pedido sigue pendiente, el Brick se queda abierto.
      // Nunca mostramos el JSON crudo de Mercado Pago al cliente.
      const msg = String(err?.message ?? '');
      setErrorPedido(
        msg.length > 160 || msg.includes('{')
          ? 'No pudimos procesar el pago. Revisa los datos de tu tarjeta e intenta de nuevo.'
          : msg
      );
      throw err; // le avisa al Brick que vuelva a habilitar el botón
    }
  };

  // ---------- montar el Card Payment Brick ----------
  useEffect(() => {
    if (!puedePagar || montadoRef.current) return;
    let controller = null;
    let cancelado = false;

    (async () => {
      if (!PUBLIC_KEY) {
        setErrorPedido('Falta PUBLIC_MP_PUBLIC_KEY en front/.env');
        return;
      }
      try {
        await cargarSdkMP();
        if (cancelado) return;

        const mp = new window.MercadoPago(PUBLIC_KEY, { locale: 'es-MX' });
        controller = await mp.bricks().create('cardPayment', BRICK_ID, {
          initialization: { amount: total },
          customization: {
            paymentMethods: { maxInstallments: 1 },
          },
          callbacks: {
            onReady: () => setBrickListo(true),
            onSubmit: (formData) => submitRef.current(formData),
            onError: (error) => {
              console.error('Brick error', error);
            },
          },
        });
        if (cancelado) {
          controller.unmount();
          controller = null;
          return;
        }
        montadoRef.current = true;
      } catch (err) {
        console.error(err);
        setErrorPedido('No se pudo cargar el formulario de pago: ' + err.message);
      }
    })();

    return () => {
      cancelado = true;
      if (controller) {
        controller.unmount();
        controller = null;
      }
      montadoRef.current = false;
    };
  }, [puedePagar, total]);

  // ---------- si quedó PENDIENTE, preguntamos cada 4 s si ya cambió ----------
  useEffect(() => {
    if (resultado?.estado !== 'PENDIENTE') return;
    let intentos = 0;
    const id = setInterval(async () => {
      intentos += 1;
      try {
        const p = await obtenerMiPedido(resultado.pedidoId);
        if (p && p.status !== 'PENDIENTE') {
          clearInterval(id);
          if (p.status === 'PAGADO' && !usandoPedido) clearCart();
          setResultado({ estado: p.status, total: Number(p.total) });
        }
      } catch {
        /* seguimos intentando */
      }
      if (intentos >= 30) clearInterval(id);
    }, 4000);
    return () => clearInterval(id);
  }, [resultado]);

  // ================= Vistas =================
  if (!access_token) {
    return (
      <Vacio
        icono={<Lock size={34} color="#7c5cd6" style={{ display: 'block', margin: '0 auto 12px' }} />}
        texto="Necesitas iniciar sesión para completar tu pedido."
        href="/login"
        boton="Iniciar sesión"
      />
    );
  }

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
              <h3>Pago aprobado</h3>
              <p>Recibimos tu pago de <strong>{mxn(resultado.total)}</strong>. ¡Gracias por tu compra! 🧶</p>
            </>
          )}
          {pendiente && (
            <>
              <h3>{resultado.motivo || 'Pendiente de pago'}</h3>
              <p>Esta pantalla se actualiza sola; también lo ves en “Mis pedidos”.</p>
            </>
          )}
          {!ok && !pendiente && (
            <>
              <h3>{resultado.motivo || 'Rechazado por error general'}</h3>
              <p>Tu carrito sigue intacto, puedes intentarlo de nuevo.</p>
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
      </Aviso>
    );
  }

  if (usandoPedido && (cargandoPedido || (!pedidoExistente && !errorCarga))) {
    return <Aviso><div className="pc-card pc-empty">Cargando tu pedido...</div></Aviso>;
  }
  if (usandoPedido && (errorCarga || pedidoExistente.status !== 'PENDIENTE')) {
    return (
      <Vacio
        icono={<i className="fa-solid fa-circle-info"></i>}
        texto={errorCarga || 'Este pedido ya no está pendiente de pago.'}
        href="/mis-pedidos"
        boton="Ir a mis pedidos"
      />
    );
  }

  if (!usandoPedido && cart.length === 0) {
    return (
      <Vacio
        icono={<i className="fa-solid fa-cart-flatbed"></i>}
        texto="Tu carrito está vacío."
        href="/"
        boton="Ver productos"
      />
    );
  }

  return (
    <Aviso>
      <a href={usandoPedido ? '/mis-pedidos' : '/carrito'} className="pc-back">
        <i className="fa-solid fa-arrow-left"></i>
        {usandoPedido ? 'Volver a mis pedidos' : 'Volver al carrito'}
      </a>

      <h3 className="pc-title">
        <i className="fa-solid fa-clipboard-check"></i>
        Confirmar y pagar
      </h3>

      <section className="pc-card">
        <h4 className="pc-card-title">
          <i className="fa-solid fa-bag-shopping"></i>
          Resumen del pedido{usandoPedido ? ` #${pedidoExistente.id}` : ''}
        </h4>

        {lineas.map((l) => (
          <div key={l.id} className="pc-item">
            <img
              className="pc-thumb"
              src={l.imagen || IMAGEN_RESPALDO}
              alt={l.nombre}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = IMAGEN_RESPALDO;
              }}
            />
            <div className="pc-item-info">
              <span className="pc-item-name">{l.nombre}</span>
              <span className="pc-item-sub">Cantidad: {l.cantidad}</span>
            </div>
            <span className="pc-item-price">{mxn(l.subtotal)}</span>
          </div>
        ))}

        <div className="pc-total">
          <span>Total a pagar</span>
          <strong>{mxn(total)}</strong>
        </div>
        <div style={{ textAlign: 'right', color: '#64748b', fontSize: '14px' }}>
          <PrecioUSD mxn={total} />
        </div>
      </section>

      {!usandoPedido && (
        <section className="pc-card">
          <h4 className="pc-card-title">
            <i className="fa-solid fa-truck"></i>
            Dirección de envío
          </h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            <input
              style={campo}
              inputMode="numeric"
              placeholder="Código postal (5 dígitos)"
              value={dir.cp}
              onChange={(e) => handleCP(e.target.value)}
            />
            {errorCP && <small style={{ color: '#dc2626' }}>{errorCP}</small>}
            {zona && (
              <>
                <input style={campo} value={`${zona.municipio}, ${zona.estado}`} readOnly />
                <select
                  style={campo}
                  value={dir.colonia}
                  onChange={(e) => setDir({ ...dir, colonia: e.target.value })}
                >
                  {zona.colonias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </>
            )}
            <input
              style={campo}
              placeholder="Calle y número"
              value={dir.calle}
              onChange={(e) => setDir({ ...dir, calle: e.target.value })}
            />
          </div>
        </section>
      )}

      <section className="pc-card">
        <h4 className="pc-card-title">
          <i className="fa-solid fa-credit-card"></i>
          Datos de tu tarjeta
        </h4>

        {errorPedido && (
          <div className="pc-alert" role="alert" style={{ marginTop: 0, marginBottom: '14px' }}>
            <CircleAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorPedido}</span>
          </div>
        )}

        {!usandoPedido && !direccionLista && (
          <p className="pc-muted" style={{ marginTop: 0 }}>
            Completa tu dirección de envío para poder pagar.
          </p>
        )}

        {!brickListo && <p className="pc-muted">Cargando formulario de pago...</p>}
        <div id={BRICK_ID}></div>
        <p className="pc-muted" style={{ marginTop: '12px', textAlign: 'center' }}>
          <i className="fa-solid fa-lock" style={{ marginRight: '6px' }}></i>
          Pago seguro procesado por Mercado Pago
        </p>
      </section>
    </Aviso>
  );
}