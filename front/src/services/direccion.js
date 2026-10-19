import { fetchGraphQL } from '../graphql/cliente.js';

export async function buscarPorCP(cp) {
  const data = await fetchGraphQL(
    `query ($cp: String!) {
      direccionPorCP(cp: $cp) { cp estado municipio ciudad colonias }
    }`,
    { cp }
  );
  return data.direccionPorCP;
}