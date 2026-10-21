import { fetchAuth } from '../graphql/clienteAuth.js';

const CAMPOS_USUARIO = `id nombre email rol activo`;

export async function obtenerUsuariosAdmin() {
  const data = await fetchAuth(`
    query UsuariosAdmin {
      usuariosAdmin { ${CAMPOS_USUARIO} }
    }
  `);
  return data.usuariosAdmin;
}

export async function cambiarRolUsuario(id, rol) {
  const data = await fetchAuth(
    `
    mutation CambiarRol($id: ID!, $rol: RolUsuario!) {
      cambiarRolUsuario(id: $id, rol: $rol) { ${CAMPOS_USUARIO} }
    }
    `,
    { id, rol }
  );
  return data.cambiarRolUsuario;
}

export async function cambiarEstadoUsuario(id, activo) {
  const data = await fetchAuth(
    `
    mutation CambiarEstado($id: ID!, $activo: Boolean!) {
      cambiarEstadoUsuario(id: $id, activo: $activo) { ${CAMPOS_USUARIO} }
    }
    `,
    { id, activo }
  );
  return data.cambiarEstadoUsuario;
}