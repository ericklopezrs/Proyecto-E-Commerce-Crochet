import { fetchAuth } from '../graphql/clienteAuth.js';

export async function obtenerDashboardAdmin() {
  const data = await fetchAuth(`
    query DashboardAdmin {
      dashboardAdmin {
        kpis {
          ventas_mes
          pedidos_mes
          clientes_total
          peluches_catalogo
          cambio_ventas
          cambio_pedidos
        }
        ventas_por_mes { etiqueta valor }
        pedidos_por_dia { etiqueta valor }
        ventas_por_categoria { etiqueta valor color }
      }
    }
  `);
  return data.dashboardAdmin;
}