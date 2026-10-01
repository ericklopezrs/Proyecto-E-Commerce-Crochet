import { fetchGraphQL } from '../graphql/cliente';

export async function getCategorias() {
  const data = await fetchGraphQL(`
    query {
      categorias {
        id nombre descripcion
        productos { id nombre precio imagen descripcion stock }
      }
    }
  `);
  return data?.categorias ?? [];
}