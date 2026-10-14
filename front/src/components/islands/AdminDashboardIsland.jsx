import { Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';

// ====== DATOS DE MENTIRA (solo para que las gráficas tengan algo que dibujar) ======
const KPIS = [
    { icono: 'fa-sack-dollar', etiqueta: 'Ventas del mes', valor: '$12,480', cambio: '+8%' },
    { icono: 'fa-box-open', etiqueta: 'Pedidos', valor: '64', cambio: '+12%' },
    { icono: 'fa-users', etiqueta: 'Clientes', valor: '41', cambio: '+5%' },
    { icono: 'fa-heart', etiqueta: 'Peluches en catálogo', valor: '23', cambio: '' },
];

const VENTAS_POR_MES = [
    { etiqueta: 'May', valor: 4200 },
    { etiqueta: 'Jun', valor: 5100 },
    { etiqueta: 'Jul', valor: 4700 },
    { etiqueta: 'Ago', valor: 6900 },
    { etiqueta: 'Sep', valor: 8300 },
    { etiqueta: 'Oct', valor: 12480 },
];

const PEDIDOS_POR_DIA = [
    { etiqueta: 'Lun', valor: 4 },
    { etiqueta: 'Mar', valor: 7 },
    { etiqueta: 'Mié', valor: 5 },
    { etiqueta: 'Jue', valor: 9 },
    { etiqueta: 'Vie', valor: 12 },
    { etiqueta: 'Sáb', valor: 15 },
    { etiqueta: 'Dom', valor: 8 },
];

// Los valores de la dona suman 100 (son porcentajes)
const VENTAS_POR_CATEGORIA = [
    { etiqueta: 'Animales', valor: 45, color: '#8b5cf6' },
    { etiqueta: 'Superhéroes', valor: 30, color: '#baa2f3' },
    { etiqueta: 'Personajes', valor: 15, color: '#f9a8d4' },
    { etiqueta: 'Bebé', valor: 10, color: '#fcd34d' },
];

// ====== GRÁFICA 1: BARRAS ======
function GraficaBarras({ datos }) {
  const ancho = 320;
  const alto = 180;
  const base = 150;      // la "línea del suelo" de las barras
  const margen = 20;

  const maximo = Math.max(...datos.map((d) => d.valor));
  const paso = (ancho - margen * 2) / datos.length;
  const anchoBarra = paso * 0.6;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="admin-grafica" role="img" aria-label="Ventas por mes">
      <line x1={margen} x2={ancho - margen} y1={base} y2={base} stroke="#cbd5e1" />
      {datos.map((d, i) => {
        const h = (d.valor / maximo) * (base - 20);
        const x = margen + i * paso + (paso - anchoBarra) / 2;
        return (
          <g key={d.etiqueta}>
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
  const ancho = 320;
  const alto = 180;
  const base = 150;
  const margen = 20;

  const maximo = Math.max(...datos.map((d) => d.valor));
  const paso = (ancho - margen * 2) / (datos.length - 1);

  const puntos = datos.map((d, i) => ({
    x: margen + i * paso,
    y: base - (d.valor / maximo) * (base - 20),
    etiqueta: d.etiqueta,
  }));

  const linea = puntos.map((p) => `${p.x},${p.y}`).join(' ');
  // El área es la misma línea + dos esquinas abajo para "cerrar" la figura
  const area = `${margen},${base} ${linea} ${margen + (datos.length - 1) * paso},${base}`;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="admin-grafica" role="img" aria-label="Pedidos por día">
      <line x1={margen} x2={ancho - margen} y1={base} y2={base} stroke="#cbd5e1" />
      <polygon points={area} fill="#baa2f3" opacity="0.35" />
      <polyline points={linea} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinejoin="round" />
      {puntos.map((p) => (
        <g key={p.etiqueta}>
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
// Truco: un círculo de radio 15.9155 mide casi exactamente 100 de perímetro,
// así que "valor" se puede usar directo como porcentaje en strokeDasharray.
function GraficaDona({ datos }) {
  let acumulado = 0;

  return (
    <div className="admin-dona-contenedor">
      <svg viewBox="0 0 42 42" className="admin-dona" role="img" aria-label="Ventas por categoría">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="6" />
        {datos.map((d) => {
          const desfase = 25 - acumulado; // 25 = empezar arriba (las 12 en punto)
          acumulado += d.valor;
          return (
            <circle
              key={d.etiqueta}
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke={d.color}
              strokeWidth="6"
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

  if (usuario?.rol !== 'ADMIN') {
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

  return (
    <div className="main-container">
      <main className="content admin-content">
        <h3 className="section-title">
          <i className="fa-solid fa-chart-line" style={{ marginRight: '8px' }}></i>
          Panel de administración
        </h3>
        <p className="admin-aviso">Datos de ejemplo: las gráficas todavía no están conectadas a la base de datos.</p>

        <section className="admin-kpis">
          {KPIS.map((k) => (
            <div key={k.etiqueta} className="admin-kpi">
              <i className={`fa-solid ${k.icono} admin-kpi-icono`}></i>
              <div>
                <div className="admin-kpi-valor">{k.valor}</div>
                <div className="admin-kpi-etiqueta">{k.etiqueta}</div>
              </div>
              {k.cambio && <span className="admin-kpi-cambio">{k.cambio}</span>}
            </div>
          ))}
        </section>

        <section className="admin-graficas">
          <div className="cart-box">
            <h4 className="admin-grafica-titulo">Ventas por mes (MXN)</h4>
            <GraficaBarras datos={VENTAS_POR_MES} />
          </div>

          <div className="cart-box">
            <h4 className="admin-grafica-titulo">Pedidos por día</h4>
            <GraficaLinea datos={PEDIDOS_POR_DIA} />
          </div>

          <div className="cart-box admin-grafica-ancha">
            <h4 className="admin-grafica-titulo">Ventas por categoría</h4>
            <GraficaDona datos={VENTAS_POR_CATEGORIA} />
          </div>
        </section>
      </main>
    </div>
  );
}