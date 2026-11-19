import { ArrowLeft, CreditCard, Lock, Package, PackageOpen, Clock, CircleCheck, CircleX, Ban, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { obtenerMisPedidos } from '../../services/pedidos.js';
import '../../styles/pedidos.css';

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
  PENDIENTE: { texto: 'Pendiente de pago', icono: Clock },
  PAGADO: { texto: 'Pagado', icono: CircleCheck },
  RECHAZADO: { texto: 'Rechazado', icono: CircleX },
  CANCELADO: { texto: 'Cancelado', icono: Ban },
};

export default function MisPedidosIsland() {
  const access_token = useAuthStore((s) => s.access_token);
  const [pedidos, setPedidos] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    if (!access_token) return;
    obtenerMisPedidos()
      .then(setPedidos)
      .catch((err) => setError(err.message));
  }, [access_token]);

  const Envoltura = ({ children }) => (
    <div className="main-container">
      <main className="content">
        <div className="pc-page">{children}</div>
      </main>
    </div>
  );

  // ===== Sin sesión =====
  if (!access_token) {
    return (
      <Envoltura>
        <div className="pc-card pc-empty">
          <Lock size="1em" className="icono" />
          <p style={{ margin: 0 }}>Necesitas iniciar sesión para ver tus pedidos.</p>
          <div className="pc-actions">
            <a href="/login" className="pc-btn pc-btn-morado">Iniciar sesión</a>
          </div>
        </div>
      </Envoltura>
    );
  }

  let contenido;
  if (error) {
    contenido = <div className="pc-card pc-empty">{error}</div>;
  } else if (pedidos === null) {
    contenido = <div className="pc-card pc-empty">Cargando tus pedidos...</div>;
  } else if (pedidos.length === 0) {
    contenido = (
      <div className="pc-card pc-empty">
        <PackageOpen size="1em" className="icono" />
        <p style={{ margin: 0 }}>Todavía no tienes pedidos.</p>
        <div className="pc-actions">
          <a href="/" className="pc-btn pc-btn-morado">Ver productos</a>
        </div>
      </div>
    );
  } else {
    contenido = (
      <section className="pc-orders">
        {pedidos.map((pedido) => {
          const estado = ESTADOS[pedido.status] ?? { texto: pedido.status, icono: Info };
          const piezas = pedido.detalles.reduce((t, d) => t + d.cantidad, 0);
          const estaAbierto = abierto === pedido.id;

          return (
            <article key={pedido.id} className="pc-order">
              <button
                type="button"
                className="pc-order-head"
                onClick={() => setAbierto(estaAbierto ? null : pedido.id)}
                aria-expanded={estaAbierto}
              >
                <div className="pc-order-info">
                  <span className="pc-order-num">Pedido #{pedido.id}</span>
                  <span className="pc-order-date">
                    {formatearFecha(pedido.fecha)} · {piezas} {piezas === 1 ? 'pieza' : 'piezas'}
                  </span>
                </div>
                <span className={`pc-badge pc-badge-${pedido.status.toLowerCase()}`}>
                  <estado.icono size="1em" className="icono" />
                  {estado.texto}
                </span>
                <span className="pc-order-total">{mxn(pedido.total)}</span>
                {estaAbierto
                  ? <ChevronUp size="1em" className="icono pc-chevron" />
                  : <ChevronDown size="1em" className="icono pc-chevron" />}
              </button>

              {estaAbierto && (
                <div className="pc-order-body">
                  {pedido.detalles.map((d) => (
                    <div key={d.id} className="pc-item">
                      <img
                        className="pc-thumb"
                        src={d.producto?.imagen || IMAGEN_RESPALDO}
                        alt={d.producto?.nombre ?? 'Producto no disponible'}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = IMAGEN_RESPALDO;
                        }}
                      />
                      <div className="pc-item-info">
                        {d.producto ? (
                          <a href={`/producto/${d.producto.id}`} className="pc-item-name">
                            {d.producto.nombre}
                          </a>
                        ) : (
                          <span className="pc-item-name">Producto no disponible</span>
                        )}
                        <span className="pc-item-sub">
                          {d.cantidad} × {mxn(d.precio_unitario)}
                        </span>
                      </div>
                      <span className="pc-item-price">{mxn(d.cantidad * d.precio_unitario)}</span>
                    </div>
                  ))}

                  {pedido.status === 'PENDIENTE' && (
                    <div className="pc-order-actions">
                      <a href={`/checkout?pedido=${pedido.id}`} className="pc-btn pc-btn-morado">
                        <CreditCard size="1em" className="icono" />
                        Pagar ahora
                      </a>
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
    <Envoltura>
      <a href="/" className="pc-back">
        <ArrowLeft size="1em" className="icono" />
        Volver al catálogo
      </a>

      <h3 className="pc-title">
        <Package size="1em" className="icono" />
        Mis pedidos
      </h3>

      {contenido}
    </Envoltura>
  );
}
