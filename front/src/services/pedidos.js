import { fetchAuth } from '../graphql/clienteAuth.js';

export async function registrarPedido({ usuarioId, total, items, direccion }) {
  return fetchAuth(
    `
    mutation Registrar(
      $usuario_id: ID!,
      $total: Float!,
      $items: [ItemPedidoInput!]!,
      $direccion_envio: String
    ) {
      registrarPedido(
        usuario_id: $usuario_id,
        total: $total,
        items: $items,
        direccion_envio: $direccion_envio
      ) {
        id
        total
      }
    }
    `,
    { usuario_id: usuarioId, total, items, direccion_envio: direccion }
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
export async function obtenerMisPedidos() {
  const data = await fetchAuth(
    `
    query MisPedidos {
      misPedidos {
        id
        fecha
        total
        status
        detalles {
          id
          cantidad
          precio_unitario
          producto {
            id
            nombre
            imagen
          }
        }
      }
    }
    `
  );
  return data.misPedidos;
}