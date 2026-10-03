//#region src/graphql/cliente.js
var GRAPHQL_URL = "http://localhost:4000/graphql";
async function fetchGraphQL(query, variables = {}) {
	const { data, errors } = await (await fetch(GRAPHQL_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query,
			variables
		})
	})).json();
	if (errors) throw new Error(errors[0].message);
	return data;
}
//#endregion
//#region src/services/auth.js
async function hacerLogin(email, password) {
	return (await fetchGraphQL(`
    mutation Login($datos: LoginInput!) {
      login(datos: $datos) {
        access_token
        refresh_token
        usuario { id nombre email rol }
      }
    }
    `, { datos: {
		email,
		password
	} })).login;
}
async function registrarUsuario(nombre, email, password) {
	return (await fetchGraphQL(`
    mutation CrearUsuario($datos: UsuarioInput!) {
      crearUsuario(datos: $datos) {
        id
        nombre
        email
        rol
      }
    }
    `, { datos: {
		nombre,
		email,
		password
	} })).crearUsuario;
}
async function refrescarToken(refresh_token) {
	return (await fetchGraphQL(`
    mutation Refrescar($refresh_token: String!) {
      refrescarToken(refresh_token: $refresh_token) {
        access_token
        refresh_token
      }
    }
    `, { refresh_token })).refrescarToken;
}
async function hacerLogout(refresh_token) {
	return (await fetchGraphQL(`
    mutation Logout($refresh_token: String!) {
      logout(refresh_token: $refresh_token)
    }
    `, { refresh_token })).logout;
}
//#endregion
export { fetchGraphQL as a, registrarUsuario as i, hacerLogout as n, refrescarToken as r, hacerLogin as t };
