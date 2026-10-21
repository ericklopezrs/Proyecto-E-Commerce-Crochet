import { useEffect, useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import {
  obtenerProductosAdmin,
  obtenerCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  restaurarProducto,
  subirImagen,
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

const TIPOS_OK = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

const mxn = (n) =>
  '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';

// ====== FORMULARIO (crear y editar) ======
function FormularioProducto({ producto, categorias, onCancelar, onGuardado }) {
  const editando = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoria?.id ?? '');
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : '');
  const [stock, setStock] = useState(producto ? String(producto.stock) : '');
  const [archivo, setArchivo] = useState(null);
  const [previa, setPrevia] = useState(producto?.imagen ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Libera la vista previa local (blob) cuando se reemplaza o se cierra el formulario
  useEffect(() => {
    return () => {
      if (previa.startsWith('blob:')) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!TIPOS_OK.includes(f.type)) {
      setError('La imagen debe ser JPG, PNG o WebP.');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('La imagen no puede pasar de 2 MB.');
      e.target.value = '';
      return;
    }
    setError('');
    setArchivo(f);
    setPrevia(URL.createObjectURL(f));
  };

  const validar = () => {
    if (!nombre.trim()) return 'El nombre es obligatorio.';
    if (nombre.trim().length > 100) return 'El nombre no puede pasar de 100 caracteres.';
    if (!categoriaId) return 'Elige una categoría.';
    const p = Number(precio);
    if (precio === '' || !Number.isFinite(p) || p <= 0) return 'El precio debe ser mayor a 0.';
    const s = Number(stock);
    if (stock === '' || !Number.isInteger(s) || s < 0) {
      return 'El stock debe ser un número entero de 0 o más.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }

    setError('');
    setGuardando(true);
    try {
      let imagen;
      if (archivo) imagen = await subirImagen(archivo);

      const datos = {
        nombre: nombre.trim(),
        // Al editar, "" limpia la descripción; al crear, se omite si está vacía
        descripcion: editando ? descripcion.trim() : descripcion.trim() || undefined,
        precio: Number(precio),
        stock: Number(stock),
        categoriaId,
        imagen,
      };

      const guardado = editando
        ? await actualizarProducto(producto.id, datos)
        : await crearProducto(datos);

      onGuardado(guardado, editando);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <div className="adm-modal-fondo" onClick={() => !guardando && onCancelar()}>
      <div
        className="adm-modal adm-modal-ancho"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-form-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="adm-form-titulo">{editando ? 'Editar producto' : 'Nuevo producto'}</h4>

        <form className="adm-form" onSubmit={handleSubmit} noValidate>
          <div className="adm-campo">
            <label htmlFor="pf-nombre">Nombre</label>
            <input
              id="pf-nombre"
              className="adm-input"
              type="text"
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="adm-campo">
            <label htmlFor="pf-descripcion">Descripción</label>
            <textarea
              id="pf-descripcion"
              className="adm-input"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="adm-campo">
            <label htmlFor="pf-categoria">Categoría</label>
            <select
              id="pf-categoria"
              className="adm-input"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              disabled={guardando}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-fila-campos">
            <div className="adm-campo">
              <label htmlFor="pf-precio">Precio (MXN)</label>
              <input
                id="pf-precio"
                className="adm-input"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                disabled={guardando}
              />
            </div>
            <div className="adm-campo">
              <label htmlFor="pf-stock">Stock</label>
              <input
                id="pf-stock"
                className="adm-input"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={guardando}
              />
            </div>
          </div>

          <div className="adm-campo">
            <label htmlFor="pf-imagen">Imagen (JPG, PNG o WebP, máx. 2 MB)</label>
            <div className="adm-imagen">
              <img
                className="adm-imagen-previa"
                src={previa || IMAGEN_RESPALDO}
                alt="Vista previa"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = IMAGEN_RESPALDO;
                }}
              />
              <input
                id="pf-imagen"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={elegirArchivo}
                disabled={guardando}
              />
            </div>
          </div>

          {error && (
            <div className="adm-form-error" role="alert">
              {error}
            </div>
          )}

          <div className="adm-modal-acciones">
            <button
              type="button"
              className="adm-btn-secundario"
              onClick={onCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="adm-btn-primario" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====== PÁGINA ======
export default function AdminProductosIsland() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMIN';

  const [productos, setProductos] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [porDesactivar, setPorDesactivar] = useState(null);
  const [trabajando, setTrabajando] = useState(null);
  // null = cerrado, { producto: null } = crear, { producto } = editar
  const [formulario, setFormulario] = useState(null);

  useEffect(() => {
    if (!esAdmin) return;
    Promise.all([obtenerProductosAdmin(), obtenerCategorias()])
      .then(([prods, cats]) => {
        setProductos(prods);
        setCategorias(cats);
      })
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

  const alGuardar = (guardado, editando) => {
    setProductos((prev) =>
      editando ? prev.map((p) => (p.id === guardado.id ? guardado : p)) : [...prev, guardado]
    );
    showToast(
      editando ? `"${guardado.nombre}" actualizado` : `"${guardado.nombre}" creado`,
      'success'
    );
    setFormulario(null);
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
                  <div className="adm-acciones-fila">
                    <button
                      type="button"
                      className="adm-btn-secundario"
                      onClick={() => setFormulario({ producto: p })}
                      disabled={trabajando === p.id}
                    >
                      <i className="fa-solid fa-pen"></i> Editar
                    </button>
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
                  </div>
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
          <button
            type="button"
            className="adm-btn-primario"
            onClick={() => setFormulario({ producto: null })}
            disabled={productos === null}
          >
            <i className="fa-solid fa-plus"></i> Nuevo producto
          </button>
        </div>

        {contenido}
      </main>

      {formulario && (
        <FormularioProducto
          producto={formulario.producto}
          categorias={categorias}
          onCancelar={() => setFormulario(null)}
          onGuardado={alGuardar}
        />
      )}

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