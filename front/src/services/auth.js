import { fetchGraphQL } from '../graphql/cliente';

export async function hacerLogin(email, password) {
  const data = await fetchGraphQL(
    `
    mutation Login($datos: LoginInput!) {
      login(datos: $datos) {
        access_token
        refresh_token
        usuario { id nombre email rol }
      }
    }
    `,
    { datos: { email, password } }
  );
  return data.login;
}

export async function registrarUsuario(nombre, email, password) {
  const data = await fetchGraphQL(
    `
    mutation CrearUsuario($datos: UsuarioInput!) {
      crearUsuario(datos: $datos) {
        id
        nombre
        email
        rol
      }
    }
    `,
    { datos: { nombre, email, password } }
  );
  return data.crearUsuario;
}

export async function refrescarToken(refresh_token) {
  const data = await fetchGraphQL(
    `
    mutation Refrescar($refresh_token: String!) {
      refrescarToken(refresh_token: $refresh_token) {
        access_token
        refresh_token
      }
    }
    `,
    { refresh_token }
  );
  return data.refrescarToken;
}

export async function hacerLogout(refresh_token) {
  const data = await fetchGraphQL(
    `
    mutation Logout($refresh_token: String!) {
      logout(refresh_token: $refresh_token)
    }
    `,
    { refresh_token }
  );
  return data.logout;
}