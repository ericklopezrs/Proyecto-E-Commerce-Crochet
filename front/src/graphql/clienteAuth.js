import { useAuthStore } from '../store/useAuthStore.js';
import { refrescarToken } from '../services/auth.js';

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function hacerPeticion(query, variables, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

export async function fetchAuth(query, variables = {}) {
  const { access_token, refresh_token } = useAuthStore.getState();

  let { data, errors } = await hacerPeticion(query, variables, access_token);

  // 🔄 ¿El access token expiró? → refresh automático y reintento
  const expiro = errors?.some((e) => e.message === 'TOKEN_EXPIRADO');

  if (expiro && refresh_token) {
    try {
      const nuevos = await refrescarToken(refresh_token);
      // ⚠️ Reemplazamos AMBOS tokens (rotación) — usar el refresh viejo
      // después dispara la detección de robo y mata TODAS las sesiones
      useAuthStore.getState().setTokens(nuevos.access_token, nuevos.refresh_token);

      ({ data, errors } = await hacerPeticion(
        query,
        variables,
        nuevos.access_token
      ));
    } catch {
      useAuthStore.getState().limpiarSesion();
      throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
    }
  }

  if (errors) throw new Error(errors[0].message);
  return data;
}