import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { obtenerMisPedidos, iniciarPago } from '../../services/pedidos.js';

const IMAGEN_RESPALDO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<text x="50%" y="54%" font-size="14" text-anchor="middle" ' +
      'fill="#94a3b8" font-family="sans-serif">Sin foto</text></svg>'
  );

const mxn = (n) =>
  '$' +
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) +
  ' MXN';

const formatearFecha = (iso) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente de pago', icono: 'fa-clock' },
  PAGADO: { texto: 'Pagado', icono: 'fa-circle-check' },
  RECHAZADO: { texto: 'Rechazado', icono: 'fa-circle-xmark' },
  CANCELADO: { texto: 'Cancelado', icono: 'fa-ban' },
};

export default function MisPedidosIsland() {
  const access_token = useAuthStore((s) => s.access_token);
  const [pedidos, setPedidos] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [pagando, setPagando] = useState(null);

  useEffect(() => {
    if (!access_token) return;
    obtenerMisPedidos()
      .then(setPedidos)
      .catch((err) => setError(err.message));
  }, [access_token]);

  const handlePagar = async (pedidoId) => {
    setPagando(pedidoId);
    try {
      const { checkout_url } = await iniciarPago(pedidoId);
      window.location.href = checkout_url;
    } catch (err) {
      setError(err.message);
      setPagando(null);
    }
  };

  // ===== Sin sesión =====
  if (!access_token) {
    return (
      <div className="main-container">
        <main className="content">
          <div className="empty-cart" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <i className="fa-solid fa-lock" style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}></i>
            Necesitas iniciar sesión para ver tus pedidos.
            <div style={{ marginTop: '16px' }}>
              <a href="/login" className="primary-btn-sm" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Iniciar Sesión
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  let contenido;
  if (error) {
    contenido = <div className="empty-cart">{error}</div>;
  } else if (pedidos === null) {
    contenido = <div className="empty-cart">Cargando tus pedidos...</div>;
  } else if (pedidos.length === 0) {
    contenido = (
      <div className="empty-cart">
        <i className="fa-solid fa-box-open" style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}></i>
        Todavía no tienes pedidos.
        <div style={{ marginTop: '16px' }}>
          <a href="/" className="primary-btn" style={{ display: 'inline-block', width: 'auto', textDecoration: 'none' }}>
            Ver productos
          </a>
        </div>
      </div>
    );
  } else {
    contenido = (
      <section className="pedidos-lista">
        {pedidos.map((pedido) => {
          const estado = ESTADOS[pedido.status] ?? { texto: pedido.status, icono: 'fa-circle-info' };
          const piezas = pedido.detalles.reduce((t, d) => t + d.cantidad, 0);
          const estaAbierto = abierto === pedido.id;

          return (
            <article key={pedido.id} className="pedido-card">
              <button
                type="button"
                className="pedido-header"
                onClick={() => setAbierto(estaAbierto ? null : pedido.id)}
                aria-expanded={estaAbierto}
              >
                <div className="pedido-header-info">
                  <span className="pedido-numero">Pedido #{pedido.id}</span>
                  <span className="pedido-fecha">
                    {formatearFecha(pedido.fecha)} · {piezas} {piezas === 1 ? 'pieza' : 'piezas'}
                  </span>
                </div>
                <span className={`pedido-status pedido-status-${pedido.status.toLowerCase()}`}>
                  <i className={`fa-solid ${estado.icono}`}></i>
                  {estado.texto}
                </span>
                <span className="pedido-total">{mxn(pedido.total)}</span>
                <i className={`fa-solid fa-chevron-${estaAbierto ? 'up' : 'down'} pedido-chevron`}></i>
              </button>

              {estaAbierto && (
                <div className="pedido-detalles">
                  {pedido.detalles.map((d) => (
                    <div key={d.id} className="pedido-detalle">
                      <img
                        className="ml-thumb ml-thumb-sm"
                        src={d.producto?.imagen || IMAGEN_RESPALDO}
                        alt={d.producto?.nombre ?? 'Producto no disponible'}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = IMAGEN_RESPALDO;
                        }}
                      />
                      <div className="pedido-detalle-info">
                        {d.producto ? (
                          <a href={`/producto/${d.producto.id}`} className="ml-item-name">
                            {d.producto.nombre}
                          </a>
                        ) : (
                          <span className="ml-item-name">Producto no disponible</span>
                        )}
                        <span className="ml-item-unit">
                          {d.cantidad} × {mxn(d.precio_unitario)}
                        </span>
                      </div>
                      <span className="pedido-detalle-subtotal">{mxn(d.cantidad * d.precio_unitario)}</span>
                    </div>
                  ))}

                  {pedido.status === 'PENDIENTE' && (
                    <div className="pedido-acciones">
                      <button
                        type="button"
                        className="primary-btn-sm"
                        onClick={() => handlePagar(pedido.id)}
                        disabled={pagando === pedido.id}
                      >
                        <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i>
                        {pagando === pedido.id ? 'Redirigiendo...' : 'Pagar ahora'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>
    );
  }

  return (
    <div className="main-container">
      <main className="content">
        <div className="ml-cart">
          <a href="/" className="back-button" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
            Volver al catálogo
          </a>

          <h3 className="section-title">
            <i className="fa-solid fa-box" style={{ marginRight: '8px' }}></i>
            Mis pedidos
          </h3>

          {contenido}
        </div>
      </main>
    </div>
  );
}