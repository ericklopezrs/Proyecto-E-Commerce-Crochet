import { fetchAuth } from '../graphql/clienteAuth.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { refrescarToken } from './auth.js';

const GRAPHQL_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
// /admin/upload es una ruta REST, así que se quita el /graphql final
const API_BASE = GRAPHQL_URL.replace(/\/graphql\/?$/, '');

const CAMPOS_PRODUCTO = `
  id
  nombre
  descripcion
  precio
  stock
  imagen
  activo
  categoria { id nombre }
`;

export async function obtenerProductosAdmin() {
  const data = await fetchAuth(`
    query ProductosAdmin {
      productosAdmin { ${CAMPOS_PRODUCTO} }
    }
  `);
  return data.productosAdmin;
}

export async function crearProducto({ nombre, precio, stock, categoriaId, descripcion, imagen }) {
  const data = await fetchAuth(
    `
    mutation Crear(
      $nombre: String!, $precio: Float!, $stock: Int!, $categoria_id: ID!,
      $descripcion: String, $imagen: String
    ) {
      crearProducto(
        nombre: $nombre, precio: $precio, stock: $stock, categoria_id: $categoria_id,
        descripcion: $descripcion, imagen: $imagen
      ) { ${CAMPOS_PRODUCTO} }
    }
    `,
    { nombre, precio, stock, categoria_id: categoriaId, descripcion, imagen }
  );
  return data.crearProducto;
}

// Solo se modifican los campos que lleguen con valor; null o undefined = "no cambiar"
export async function actualizarProducto(id, { nombre, precio, stock, categoriaId, descripcion, imagen }) {
  const data = await fetchAuth(
    `
    mutation Actualizar(
      $id: ID!, $nombre: String, $precio: Float, $stock: Int,
      $categoria_id: ID, $descripcion: String, $imagen: String
    ) {
      actualizarProducto(
        id: $id, nombre: $nombre, precio: $precio, stock: $stock,
        categoria_id: $categoria_id, descripcion: $descripcion, imagen: $imagen
      ) { ${CAMPOS_PRODUCTO} }
    }
    `,
    { id, nombre, precio, stock, categoria_id: categoriaId, descripcion, imagen }
  );
  return data.actualizarProducto;
}

export async function eliminarProducto(id) {
  const data = await fetchAuth(
    `mutation Eliminar($id: ID!) { eliminarProducto(id: $id) }`,
    { id }
  );
  return data.eliminarProducto;
}

export async function restaurarProducto(id) {
  const data = await fetchAuth(
    `
    mutation Restaurar($id: ID!) {
      restaurarProducto(id: $id) { ${CAMPOS_PRODUCTO} }
    }
    `,
    { id }
  );
  return data.restaurarProducto;
}

// ===== Subida de imagen (REST, no GraphQL) =====
function postUpload(archivo, token) {
  const form = new FormData();
  form.append('archivo', archivo);
  // No se pone Content-Type: el navegador lo agrega con el boundary correcto
  return fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

export async function subirImagen(archivo) {
  const { access_token, refresh_token } = useAuthStore.getState();
  let respuesta = await postUpload(archivo, access_token);

  // Mismo manejo de token expirado que fetchAuth
  if (respuesta.status === 401 && refresh_token) {
    try {
      const nuevos = await refrescarToken(refresh_token);
      useAuthStore.getState().setTokens(nuevos.access_token, nuevos.refresh_token);
      respuesta = await postUpload(archivo, nuevos.access_token);
    } catch {
      useAuthStore.getState().limpiarSesion();
      throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
    }
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.detail ?? 'No se pudo subir la imagen');
  return cuerpo.url;
}