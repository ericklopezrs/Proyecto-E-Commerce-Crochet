import { Fragment, useEffect, useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { obtenerPedidosAdmin } from '../../services/adminPedidos.js';
import { showToast } from '../../utils/toast.js';
import AdminNav from '../AdminNav.jsx';

const IMAGEN_RESPALDO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<text x="50%" y="54%" font-size="14" text-anchor="middle" ' +
      'fill="#94a3b8" font-family="sans-serif">Sin foto</text></svg>'
  );

const ESTADOS = {
  PENDIENTE: { texto: 'Pendiente', icono: 'fa-clock' },
  PAGADO: { texto: 'Pagado', icono: 'fa-circle-check' },
  RECHAZADO: { texto: 'Rechazado', icono: 'fa-circle-xmark' },
  CANCELADO: { texto: 'Cancelado', icono: 'fa-ban' },
};

const FILTROS = [
  { id: 'TODOS', texto: 'Todos' },
  { id: 'PENDIENTE', texto: 'Pendientes' },
  { id: 'PAGADO', texto: 'Pagados' },
  { id: 'RECHAZADO', texto: 'Rechazados' },
  { id: 'CANCELADO', texto: 'Cancelados' },
];

const mxn = (n) =>
  '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';

const formatearFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function AdminPedidosIsland() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMIN';

  const [pedidos, setPedidos] = useState(null);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async (avisar = false) => {
    setCargando(true);
    try {
      const datos = await obtenerPedidosAdmin();
      setPedidos(datos);
      setError('');
      if (avisar) showToast('Pedidos actualizados', 'success', 2000);
    } catch (err) {
      if (avisar) showToast(err.message, 'error', 5000);
      else setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esAdmin) cargar();
  }, [esAdmin]);

  const conteos = useMemo(() => {
    const c = { TODOS: 0, PENDIENTE: 0, PAGADO: 0, RECHAZADO: 0, CANCELADO: 0 };
    let cobrado = 0;
    (pedidos ?? []).forEach((p) => {
      c.TODOS += 1;
      if (c[p.status] !== undefined) c[p.status] += 1;
      if (p.status === 'PAGADO') cobrado += p.total;
    });
    return { ...c, cobrado };
  }, [pedidos]);

  const filtrados = useMemo(() => {
    if (!pedidos) return [];
    const q = busqueda.trim().toLowerCase().replace(/^#/, '');
    return pedidos.filter((p) => {
      if (filtro !== 'TODOS' && p.status !== filtro) return false;
      if (!q) return true;
      return (
        String(p.id) === q ||
        (p.usuario?.nombre ?? '').toLowerCase().includes(q) ||
        (p.usuario?.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [pedidos, filtro, busqueda]);

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

  let contenido;
  if (error) {
    contenido = <div className="empty-cart">{error}</div>;
  } else if (pedidos === null) {
    contenido = <div className="empty-cart">Cargando pedidos...</div>;
  } else if (filtrados.length === 0) {
    contenido = <div className="empty-cart">No hay pedidos que coincidan con tu búsqueda.</div>;
  } else {
    contenido = (
      <div className="cart-box adm-tabla-contenedor">
        <table className="adm-tabla">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Piezas</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const estado = ESTADOS[p.status] ?? { texto: p.status, icono: 'fa-circle-info' };
              const piezas = p.detalles.reduce((t, d) => t + d.cantidad, 0);
              const abierta = abierto === p.id;

              return (
                <Fragment key={p.id}>
                  <tr>
                    <td><strong>#{p.id}</strong></td>
                    <td>{formatearFecha(p.fecha)}</td>
                    <td>
                      {p.usuario ? (
                        <div className="adm-cliente">
                          <span>{p.usuario.nombre}</span>
                          <small>{p.usuario.email}</small>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{piezas}</td>
                    <td>{mxn(p.total)}</td>
                    <td>
                      <span className={`adm-status adm-status-${p.status.toLowerCase()}`}>
                        <i className={`fa-solid ${estado.icono}`}></i> {estado.texto}
                      </span>
                    </td>
                    <td className="adm-acciones">
                      <button
                        type="button"
                        className="adm-btn-secundario"
                        aria-expanded={abierta}
                        onClick={() => setAbierto(abierta ? null : p.id)}
                      >
                        <i className={`fa-solid fa-chevron-${abierta ? 'up' : 'down'}`}></i>{' '}
                        {abierta ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>

                  {abierta && (
                    <tr className="adm-detalle-fila">
                      <td colSpan={7}>
                        <div className="adm-detalle">
                          <div className="adm-detalle-datos">
                            <div>
                              <span className="adm-detalle-etiqueta">Fecha de pago</span>
                              <span>{formatearFecha(p.fecha_pago)}</span>
                            </div>
                            <div>
                              <span className="adm-detalle-etiqueta">Dirección de envío</span>
                              <span>{p.direccion_envio || 'Sin dirección registrada'}</span>
                            </div>
                          </div>

                          <div className="adm-detalle-items">
                            {p.detalles.map((d) => (
                              <div key={d.id} className="adm-detalle-item">
                                <img
                                  className="ml-thumb ml-thumb-sm"
                                  src={d.producto?.imagen || IMAGEN_RESPALDO}
                                  alt={d.producto?.nombre ?? 'Producto no disponible'}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = IMAGEN_RESPALDO;
                                  }}
                                />
                                <span className="adm-detalle-nombre">
                                  {d.producto?.nombre ?? 'Producto no disponible'}
                                </span>
                                <span className="adm-detalle-cant">
                                  {d.cantidad} × {mxn(d.precio_unitario)}
                                </span>
                                <strong>{mxn(d.cantidad * d.precio_unitario)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="main-container">
      <main className="content admin-content">
        <AdminNav activa="pedidos" />

        <h3 className="section-title">
          <i className="fa-solid fa-receipt" style={{ marginRight: '8px' }}></i>
          Pedidos
          {pedidos && ` (${conteos.TODOS})`}
        </h3>

        {pedidos && (
          <p className="adm-resumen-texto">
            Cobrado en pedidos pagados: <strong>{mxn(conteos.cobrado)}</strong>
          </p>
        )}

        <div className="adm-chips">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`adm-chip ${filtro === f.id ? 'activo' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.texto} <span className="adm-chip-num">{conteos[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="adm-barra">
          <div className="adm-buscador">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar por número, cliente o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="adm-btn-secundario"
            onClick={() => cargar(true)}
            disabled={cargando}
          >
            <i className="fa-solid fa-rotate"></i> {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {contenido}
      </main>
    </div>
  );
}