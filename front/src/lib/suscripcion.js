const GRAPHQL_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
// http -> ws, https -> wss
const WS_URL = GRAPHQL_URL.replace(/^http/, 'ws');

const QUERY = `
  subscription {
    productoCambiado {
      id nombre precio stock activo descripcion imagen categoria_id
    }
  }
`;

export function suscribirseAProductos({ onProducto, onReconectar }) {
  let ws;
  let cerrado = false;
  let intentos = 0;
  let timer;
  let yaConecto = false;

  const conectar = () => {
    ws = new WebSocket(WS_URL, 'graphql-transport-ws');

    ws.onopen = () => ws.send(JSON.stringify({ type: 'connection_init' }));

    ws.onmessage = (evento) => {
      const msg = JSON.parse(evento.data);

      if (msg.type === 'connection_ack') {
        // Si hubo caída o reintentos, pudimos perdernos cambios: se recarga la lista completa
        const fueReconexion = yaConecto || intentos > 0;
        intentos = 0;
        yaConecto = true;
        ws.send(JSON.stringify({ id: '1', type: 'subscribe', payload: { query: QUERY } }));
        if (fueReconexion) onReconectar?.();
      } else if (msg.type === 'next') {
        const producto = msg.payload?.data?.productoCambiado;
        if (producto) onProducto(producto);
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (cerrado) return;
      const espera = Math.min(1000 * 2 ** intentos, 30000);
      intentos += 1;
      timer = setTimeout(conectar, espera);
    };
  };

  conectar();

  return () => {
    cerrado = true;
    clearTimeout(timer);
    ws?.close();
  };
}