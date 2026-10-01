import { fetchAuth } from '../graphql/clienteAuth.js';

export async function registrarPedido({ total, items }) {
  return fetchAuth(
    `
    mutation Registrar(
      $total: Float!,
      $items: [ItemPedidoInput!]!
    ) {
      registrarPedido(
        total: $total,
        items: $items
      ) {
        id
        total
      }
    }
    `,
    { total, items }
  );
}