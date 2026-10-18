import { useEffect, useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import {
  obtenerProductosAdmin,
  eliminarProducto,
  restaurarProducto,
} from '../../services/productos.js';
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

const mxn = (n) =>
  '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';

export default function AdminProductosIsland() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMIN';

  const [productos, setProductos] = useState(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [porDesactivar, setPorDesactivar] = useState(null);
  const [trabajando, setTrabajando] = useState(null);

  useEffect(() => {
    if (!esAdmin) return;
    obtenerProductosAdmin()
      .then(setProductos)
      .catch((err) => setError(err.message));
  }, [esAdmin]);

  const filtrados = useMemo(() => {
    if (!productos) return [];
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (filtro === 'activos' && !p.activo) return false;
      if (filtro === 'inactivos' && p.activo) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria?.nombre ?? '').toLowerCase().includes(q)
      );
    });
  }, [productos, busqueda, filtro]);

  const cambiarEstado = async (producto, activar) => {
    setTrabajando(producto.id);
    try {
      if (activar) await restaurarProducto(producto.id);
      else await eliminarProducto(producto.id);

      setProductos((prev) =>
        prev.map((p) => (p.id === producto.id ? { ...p, activo: activar } : p))
      );
      showToast(
        activar ? `"${producto.nombre}" restaurado` : `"${producto.nombre}" desactivado`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error', 5000);
    } finally {
      setTrabajando(null);
      setPorDesactivar(null);
    }
  };

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
  } else if (productos === null) {
    contenido = <div className="empty-cart">Cargando productos...</div>;
  } else if (filtrados.length === 0) {
    contenido = <div className="empty-cart">No hay productos que coincidan con tu búsqueda.</div>;
  } else {
    contenido = (
      <div className="cart-box adm-tabla-contenedor">
        <table className="adm-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className={p.activo ? '' : 'adm-fila-inactiva'}>
                <td>
                  <div className="adm-producto">
                    <img
                      className="ml-thumb ml-thumb-sm"
                      src={p.imagen || IMAGEN_RESPALDO}
                      alt={p.nombre}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = IMAGEN_RESPALDO;
                      }}
                    />
                    <span>{p.nombre}</span>
                  </div>
                </td>
                <td>{p.categoria?.nombre ?? '—'}</td>
                <td>{mxn(p.precio)}</td>
                <td className={p.stock <= 3 ? 'adm-stock-bajo' : ''}>{p.stock}</td>
                <td>
                  <span className={`adm-badge ${p.activo ? 'activo' : 'inactivo'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="adm-acciones">
                  {p.activo ? (
                    <button
                      type="button"
                      className="adm-btn-peligro-suave"
                      onClick={() => setPorDesactivar(p)}
                      disabled={trabajando === p.id}
                    >
                      <i className="fa-solid fa-eye-slash"></i> Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="adm-btn-suave"
                      onClick={() => cambiarEstado(p, true)}
                      disabled={trabajando === p.id}
                    >
                      <i className="fa-solid fa-rotate-left"></i>{' '}
                      {trabajando === p.id ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="main-container">
      <main className="content admin-content">
        <AdminNav activa="productos" />

        <h3 className="section-title">
          <i className="fa-solid fa-box-open" style={{ marginRight: '8px' }}></i>
          Productos
          {productos && ` (${productos.filter((p) => p.activo).length} activos de ${productos.length})`}
        </h3>

        <div className="adm-barra">
          <div className="adm-buscador">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar por nombre o categoría"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </div>

        {contenido}
      </main>

      {porDesactivar && (
        <div className="adm-modal-fondo" onClick={() => setPorDesactivar(null)}>
          <div
            className="adm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>¿Desactivar producto?</h4>
            <p>
              <strong>{porDesactivar.nombre}</strong> dejará de mostrarse en la tienda. Los pedidos
              anteriores no se afectan y puedes restaurarlo cuando quieras.
            </p>
            <div className="adm-modal-acciones">
              <button type="button" className="adm-btn-secundario" onClick={() => setPorDesactivar(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="adm-btn-peligro"
                onClick={() => cambiarEstado(porDesactivar, false)}
                disabled={trabajando === porDesactivar.id}
              >
                {trabajando === porDesactivar.id ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}