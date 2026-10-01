import { fetchAuth } from '../graphql/clienteAuth.js';

export async function registrarPedido({ usuarioId, total, items }) {
  return fetchAuth(
    `
    mutation Registrar(
      $usuario_id: ID!,
      $total: Float!,
      $items: [ItemPedidoInput!]!
    ) {
      registrarPedido(
        usuario_id: $usuario_id,
        total: $total,
        items: $items
      ) {
        id
        total
      }
    }
    `,
    { usuario_id: usuarioId, total, items }
  );
}