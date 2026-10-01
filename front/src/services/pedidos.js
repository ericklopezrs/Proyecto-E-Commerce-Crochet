import { fetchGraphQL } from '../graphql/cliente';

export async function registrarPedido({ usuarioId, total, items }) {
  return fetchGraphQL(
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