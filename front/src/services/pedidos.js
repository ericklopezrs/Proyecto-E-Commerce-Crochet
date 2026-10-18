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
export async function pagarPedido({
  pedidoId,
  token,
  paymentMethodId,
  paymentType,
  installments,
  email,
  identificationType,
  identificationNumber,
}) {
  const data = await fetchAuth(
    `
    mutation Pagar(
      $pedido_id: ID!,
      $token: String!,
      $payment_method_id: String!,
      $payment_type: String!,
      $installments: Int!,
      $email: String!,
      $identification_type: String,
      $identification_number: String
    ) {
      pagarPedido(
        pedido_id: $pedido_id,
        token: $token,
        payment_method_id: $payment_method_id,
        payment_type: $payment_type,
        installments: $installments,
        email: $email,
        identification_type: $identification_type,
        identification_number: $identification_number
      ) {
        pedido_status
        orden_id
        mp_status
        mp_status_detail
      }
    }
    `,
    {
      pedido_id: String(pedidoId),
      token,
      payment_method_id: paymentMethodId,
      payment_type: paymentType || 'credit_card',
      installments: Number(installments) || 1,
      email,
      identification_type: identificationType ?? null,
      identification_number: identificationNumber ?? null,
    }
  );
  return data.pagarPedido;
}

export async function obtenerMiPedido(id) {
  const data = await fetchAuth(
    `
    query MiPedido($id: ID!) {
      miPedido(id: $id) {
        id
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