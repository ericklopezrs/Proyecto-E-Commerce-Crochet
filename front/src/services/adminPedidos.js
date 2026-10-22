import { fetchAuth } from '../graphql/clienteAuth.js';

export async function obtenerPedidosAdmin() {
  const data = await fetchAuth(`
    query PedidosAdmin {
      pedidosAdmin {
        id
        fecha
        fecha_pago
        total
        status
        direccion_envio
        usuario { id nombre email }
        detalles {
          id
          cantidad
          precio_unitario
          producto { id nombre imagen }
        }
      }
    }
  `);
  return data.pedidosAdmin;
}