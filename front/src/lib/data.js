import { fetchGraphQL } from '../graphql/cliente';

let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 60_000; // 60 segundos

export async function getCategorias() {
  const ahora = Date.now();

  // ¿Cache caliente? Ni tocamos la red
  if (cache.data && ahora - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  // Cache fría o vencida → un viaje a Virginia, guardamos y regresamos
  const data = await fetchGraphQL(`
    query {
      categorias {
        id nombre descripcion
        productos { id nombre precio imagen descripcion stock }
      }
    }
  `);
  cache = { data: data?.categorias ?? [], timestamp: ahora };
  return cache.data;
}