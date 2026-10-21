import { useEffect, useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import {
  obtenerUsuariosAdmin,
  cambiarRolUsuario,
  cambiarEstadoUsuario,
} from '../../services/usuarios.js';
import { showToast } from '../../utils/toast.js';
import AdminNav from '../AdminNav.jsx';

function textosConfirmacion(accion) {
  const { tipo, usuario, valor } = accion;
  const nombre = <strong>{usuario.nombre}</strong>;

  if (tipo === 'rol' && valor === 'ADMIN') {
    return {
      titulo: '¿Dar permisos de administrador?',
      cuerpo: <>{nombre} podrá gestionar productos y usuarios.</>,
      boton: 'Hacer administrador',
      peligro: false,
    };
  }
  if (tipo === 'rol') {
    return {
      titulo: '¿Quitar permisos de administrador?',
      cuerpo: <>{nombre} volverá a ser cliente y perderá el acceso al backoffice.</>,
      boton: 'Quitar permisos',
      peligro: true,
    };
  }
  if (valor === false) {
    return {
      titulo: '¿Desactivar cuenta?',
      cuerpo: (
        <>
          {nombre} no podrá iniciar sesión ni comprar. Sus pedidos se conservan y puedes
          reactivarla cuando quieras.
        </>
      ),
      boton: 'Desactivar',
      peligro: true,
    };
  }
  return {
    titulo: '¿Reactivar cuenta?',
    cuerpo: <>{nombre} podrá volver a iniciar sesión.</>,
    boton: 'Reactivar',
    peligro: false,
  };
}

export default function AdminUsuariosIsland() {
  const yo = useAuthStore((s) => s.usuario);
  const esAdmin = yo?.rol === 'ADMIN';

  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  // { tipo: 'rol' | 'estado', usuario, valor }
  const [accion, setAccion] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (!esAdmin) return;
    obtenerUsuariosAdmin()
      .then(setUsuarios)
      .catch((err) => setError(err.message));
  }, [esAdmin]);

  const filtrados = useMemo(() => {
    if (!usuarios) return [];
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
      if (filtroEstado === 'activos' && !u.activo) return false;
      if (filtroEstado === 'inactivos' && u.activo) return false;
      if (!q) return true;
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const confirmar = async () => {
    const { tipo, usuario, valor } = accion;
    setTrabajando(true);
    try {
      const actualizado =
        tipo === 'rol'
          ? await cambiarRolUsuario(usuario.id, valor)
          : await cambiarEstadoUsuario(usuario.id, valor);

      setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));

      const mensaje =
        tipo === 'rol'
          ? valor === 'ADMIN'
            ? `${usuario.nombre} ahora es administrador`
            : `${usuario.nombre} ya no es administrador`
          : valor
          ? `Cuenta de ${usuario.nombre} reactivada`
          : `Cuenta de ${usuario.nombre} desactivada`;
      showToast(mensaje, 'success');
    } catch (err) {
      showToast(err.message, 'error', 5000);
    } finally {
      setTrabajando(false);
      setAccion(null);
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
  } else if (usuarios === null) {
    contenido = <div className="empty-cart">Cargando usuarios...</div>;
  } else if (filtrados.length === 0) {
    contenido = <div className="empty-cart">No hay usuarios que coincidan con tu búsqueda.</div>;
  } else {
    contenido = (
      <div className="cart-box adm-tabla-contenedor">
        <table className="adm-tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => {
              const esYo = String(u.id) === String(yo.id);
              const esAdminFila = u.rol === 'ADMIN';
              return (
                <tr key={u.id} className={u.activo ? '' : 'adm-fila-inactiva'}>
                  <td>
                    <span className="adm-producto">
                      {u.nombre}
                      {esYo && <span className="adm-tu">tú</span>}
                    </span>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`adm-badge ${esAdminFila ? 'rol-admin' : 'rol-cliente'}`}>
                      {esAdminFila ? 'Administrador' : 'Cliente'}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${u.activo ? 'activo' : 'inactivo'}`}>
                      {u.activo ? 'Activa' : 'Desactivada'}
                    </span>
                  </td>
                  <td className="adm-acciones">
                    <div className="adm-acciones-fila">
                      <button
                        type="button"
                        className="adm-btn-secundario"
                        disabled={esYo}
                        title={esYo ? 'No puedes cambiar tu propio rol' : undefined}
                        onClick={() =>
                          setAccion({
                            tipo: 'rol',
                            usuario: u,
                            valor: esAdminFila ? 'CLIENTE' : 'ADMIN',
                          })
                        }
                      >
                        <i className="fa-solid fa-user-shield"></i>{' '}
                        {esAdminFila ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                      {u.activo ? (
                        <button
                          type="button"
                          className="adm-btn-peligro-suave"
                          disabled={esYo}
                          title={esYo ? 'No puedes desactivar tu propia cuenta' : undefined}
                          onClick={() => setAccion({ tipo: 'estado', usuario: u, valor: false })}
                        >
                          <i className="fa-solid fa-user-slash"></i> Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="adm-btn-suave"
                          onClick={() => setAccion({ tipo: 'estado', usuario: u, valor: true })}
                        >
                          <i className="fa-solid fa-user-check"></i> Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const textos = accion ? textosConfirmacion(accion) : null;

  return (
    <div className="main-container">
      <main className="content admin-content">
        <AdminNav activa="usuarios" />

        <h3 className="section-title">
          <i className="fa-solid fa-users" style={{ marginRight: '8px' }}></i>
          Usuarios
          {usuarios &&
            ` (${usuarios.length} en total, ${usuarios.filter((u) => u.rol === 'ADMIN').length} administradores)`}
        </h3>

        <div className="adm-barra">
          <div className="adm-buscador">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar por nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por rol">
            <option value="todos">Todos los roles</option>
            <option value="ADMIN">Administradores</option>
            <option value="CLIENTE">Clientes</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activas</option>
            <option value="inactivos">Solo desactivadas</option>
          </select>
        </div>

        {contenido}
      </main>

      {accion && (
        <div className="adm-modal-fondo" onClick={() => !trabajando && setAccion(null)}>
          <div className="adm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h4>{textos.titulo}</h4>
            <p>{textos.cuerpo}</p>
            <div className="adm-modal-acciones">
              <button
                type="button"
                className="adm-btn-secundario"
                onClick={() => setAccion(null)}
                disabled={trabajando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={textos.peligro ? 'adm-btn-peligro' : 'adm-btn-primario'}
                onClick={confirmar}
                disabled={trabajando}
              >
                {trabajando ? 'Guardando...' : textos.boton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}