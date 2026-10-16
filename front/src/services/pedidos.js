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
export async function iniciarPago(pedidoId) {
  const data = await fetchAuth(
    `
    mutation Pago($pedido_id: ID!) {
      iniciarPago(pedido_id: $pedido_id) {
        checkout_url
        orden_id
      }
    }
    `,
    { pedido_id: pedidoId }
  );
  return data.iniciarPago;
}

export async function obtenerMiPedido(id) {
  const data = await fetchAuth(
    `
    query MiPedido($id: ID!) {
      miPedido(id: $id) {
        id
        total
        status
      }
    }
    `,
    { id }
  );
  return data.miPedido;
}