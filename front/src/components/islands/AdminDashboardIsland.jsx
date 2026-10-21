import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import AdminNav from '../AdminNav.jsx';
import { obtenerDashboardAdmin } from '../../services/dashboard.js';

const fmtMXN = (n) =>
  `$${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(n || 0)}`;

// ====== GRÁFICA 1: BARRAS ======
function GraficaBarras({ datos }) {
  const ancho = 320, alto = 180, base = 150, margen = 20;
  const maximo = Math.max(1, ...datos.map((d) => d.valor));
  const paso = (ancho - margen * 2) / Math.max(1, datos.length);
  const anchoBarra = paso * 0.6;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="admin-grafica" role="img" aria-label="Ventas por mes">
      <line x1={margen} x2={ancho - margen} y1={base} y2={base} stroke="#cbd5e1" />
      {datos.map((d, i) => {
        const h = (d.valor / maximo) * (base - 20);
        const x = margen + i * paso + (paso - anchoBarra) / 2;
        return (
          <g key={`${d.etiqueta}-${i}`}>
            <rect x={x} y={base - h} width={anchoBarra} height={h} rx="4" fill="#8b5cf6" />
            <text x={x + anchoBarra / 2} y={base + 16} textAnchor="middle" className="admin-grafica-texto">
              {d.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ====== GRÁFICA 2: LÍNEA CON ÁREA ======
function GraficaLinea({ datos }) {
  const ancho = 320, alto = 180, base = 150, margen = 20;
  const maximo = Math.max(1, ...datos.map((d) => d.valor));
  const paso = datos.length > 1 ? (ancho - margen * 2) / (datos.length - 1) : 0;

  const puntos = datos.map((d, i) => ({
    x: margen + i * paso,
    y: base - (d.valor / maximo) * (base - 20),
    etiqueta: d.etiqueta,
  }));

  const linea = puntos.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${margen},${base} ${linea} ${margen + (datos.length - 1) * paso},${base}`;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="admin-grafica" role="img" aria-label="Pedidos por día">
      <line x1={margen} x2={ancho - margen} y1={base} y2={base} stroke="#cbd5e1" />
      <polygon points={area} fill="#baa2f3" opacity="0.35" />
      <polyline points={linea} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" />
      {puntos.map((p, i) => (
        <g key={`${p.etiqueta}-${i}`}>
          <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
          <text x={p.x} y={base + 16} textAnchor="middle" className="admin-grafica-texto">
            {p.etiqueta}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ====== GRÁFICA 3: DONA ======
function GraficaDona({ datos }) {
  let acumulado = 0;
  return (
    <div className="admin-dona-contenedor">
      <svg viewBox="0 0 42 42" className="admin-dona" role="img" aria-label="Ventas por categoría">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="6" />
        {datos.map((d) => {
          const desfase = 25 - acumulado;
          acumulado += d.valor;
          return (
            <circle
              key={d.etiqueta}
              cx="21" cy="21" r="15.9155"
              fill="none" stroke={d.color} strokeWidth="6"
              strokeDasharray={`${d.valor} ${100 - d.valor}`}
              strokeDashoffset={desfase}
            />
          );
        })}
      </svg>
      <ul className="admin-leyenda">
        {datos.map((d) => (
          <li key={d.etiqueta}>
            <span className="admin-leyenda-color" style={{ backgroundColor: d.color }}></span>
            {d.etiqueta} <strong>{d.valor}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ====== PÁGINA ======
export default function AdminDashboardIsland() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMIN';

  const [datos, setDatos]       = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!esAdmin) {
      setCargando(false);
      return;
    }
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerDashboardAdmin()
      .then((d) => { if (vigente) setDatos(d); })
      .catch((e) => { if (vigente) setError(e.message || 'No se pudo cargar el panel'); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [esAdmin]);

  if (!esAdmin) {
    return (
      <div className="main-container">
        <main className="content">
          <div className="empty-cart" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <Lock size={32} color="#64748b" />
            <p>Esta sección es solo para administradores.</p>
            <a href="/" className="primary-btn-sm" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Volver a la tienda
            </a>
          </div>
        </main>
      </div>
    );
  }

  // KPIs armados a partir de la respuesta del backend
  const kpis = datos ? [
    {
      icono: 'fa-sack-dollar',
      etiqueta: 'Ventas del mes',
      valor: fmtMXN(datos.kpis.ventas_mes),
      cambio: datos.kpis.cambio_ventas,
    },
    {
      icono: 'fa-box-open',
      etiqueta: 'Pedidos',
      valor: String(datos.kpis.pedidos_mes),
      cambio: datos.kpis.cambio_pedidos,
    },
    {
      icono: 'fa-users',
      etiqueta: 'Clientes',
      valor: String(datos.kpis.clientes_total),
      cambio: null,
    },
    {
      icono: 'fa-heart',
      etiqueta: 'Peluches en catálogo',
      valor: String(datos.kpis.peluches_catalogo),
      cambio: null,
    },
  ] : [];

  return (
    <div className="main-container">
      <main className="content admin-content">
        <AdminNav activa="dashboard" />
        <h3 className="section-title">
          <i className="fa-solid fa-chart-line" style={{ marginRight: '8px' }}></i>
          Panel de administración
        </h3>

        {cargando && <p className="admin-aviso">Cargando datos…</p>}

        {error && (
          <p className="admin-aviso" style={{ color: '#dc2626' }}>
            Error: {error}
          </p>
        )}

        {datos && (
          <>
            <section className="admin-kpis">
              {kpis.map((k) => (
                <div key={k.etiqueta} className="admin-kpi">
                  <i className={`fa-solid ${k.icono} admin-kpi-icono`}></i>
                  <div>
                    <div className="admin-kpi-valor">{k.valor}</div>
                    <div className="admin-kpi-etiqueta">{k.etiqueta}</div>
                  </div>
                  {k.cambio != null && (
                    <span
                      className="admin-kpi-cambio"
                      style={{ color: k.cambio >= 0 ? '#16a34a' : '#dc2626' }}
                    >
                      {k.cambio >= 0 ? '+' : ''}{k.cambio.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </section>

            <section className="admin-graficas">
              <div className="cart-box">
                <h4 className="admin-grafica-titulo">Ventas por mes (MXN)</h4>
                <GraficaBarras datos={datos.ventas_por_mes} />
              </div>

              <div className="cart-box">
                <h4 className="admin-grafica-titulo">Pedidos por día (últimos 7 días)</h4>
                <GraficaLinea datos={datos.pedidos_por_dia} />
              </div>

              <div className="cart-box admin-grafica-ancha">
                <h4 className="admin-grafica-titulo">Ventas por categoría (mes actual)</h4>
                {datos.ventas_por_categoria.length > 0
                  ? <GraficaDona datos={datos.ventas_por_categoria} />
                  : <p className="admin-aviso">Sin ventas registradas este mes.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}