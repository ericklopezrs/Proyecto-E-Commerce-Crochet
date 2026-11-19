import { useAuthStore } from '../store/useAuthStore.js';
import { refrescarToken } from '../services/auth.js';

const GRAPHQL_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
// http -> ws, https -> wss
const WS_URL = GRAPHQL_URL.replace(/^http/, 'ws');

const Q_PRODUCTOS = `
  subscription {
    productoCambiado {
      id nombre precio stock activo descripcion imagen categoria_id
    }
  }
`;

const Q_PEDIDOS = `
  subscription {
    pedidoCambiado {
      id fecha fecha_pago total status direccion_envio
      usuario { id nombre email }
      detalles {
        id cantidad precio_unitario
        producto { id nombre imagen }
      }
    }
  }
`;

// ===== Token vigente para el connection_init =====
function porExpirar(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

async function tokenVigente() {
  const { access_token, refresh_token } = useAuthStore.getState();
  if (access_token && !porExpirar(access_token)) return access_token;
  if (!refresh_token) return null;

  const nuevos = await refrescarToken(refresh_token);
  useAuthStore.getState().setTokens(nuevos.access_token, nuevos.refresh_token);
  return nuevos.access_token;
}

// ===== Conexión genérica con reconexión automática =====
function crearSuscripcion({ query, campo, onEvento, onReconectar, onEstado, onError, conToken }) {
  let ws;
  let cerrado = false;
  let intentos = 0;
  let timer;
  let latido;
  let yaConecto = false;

  const reintentar = () => {
    if (cerrado) return;
    const espera = Math.min(1000 * 2 ** intentos, 30000);
    intentos += 1;
    timer = setTimeout(conectar, espera);
  };

  const conectar = async () => {
    let params = {};
    if (conToken) {
      try {
        const token = await tokenVigente();
        if (token) params = { Authorization: `Bearer ${token}` };
      } catch {
        onEstado?.(false);
        reintentar();
        return;
      }
    }
    if (cerrado) return;

    ws = new WebSocket(WS_URL, 'graphql-transport-ws');

    ws.onopen = () => ws.send(JSON.stringify({ type: 'connection_init', payload: params }));

    ws.onmessage = (evento) => {
      const msg = JSON.parse(evento.data);

      if (msg.type === 'connection_ack') {
        // Si hubo caída o reintentos, pudimos perdernos cambios: se recarga la lista completa
        const fueReconexion = yaConecto || intentos > 0;
        intentos = 0;
        yaConecto = true;
        ws.send(JSON.stringify({ id: '1', type: 'subscribe', payload: { query } }));
        onEstado?.(true);
        if (fueReconexion) onReconectar?.();

        clearInterval(latido);
        latido = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 25000);
      } else if (msg.type === 'next') {
        const dato = msg.payload?.data?.[campo];
        if (dato) onEvento(dato);
      } else if (msg.type === 'error') {
        const texto = msg.payload?.[0]?.message ?? 'Error en la conexión en vivo';
        onError?.(texto);
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      clearInterval(latido);
      onEstado?.(false);
      reintentar();
    };
  };

  conectar();

  return () => {
    cerrado = true;
    clearTimeout(timer);
    clearInterval(latido);
    ws?.close();
  };
}

export function suscribirseAProductos({ onProducto, onReconectar }) {
  return crearSuscripcion({
    query: Q_PRODUCTOS,
    campo: 'productoCambiado',
    onEvento: onProducto,
    onReconectar,
  });
}

export function suscribirseAPedidos({ onPedido, onReconectar, onEstado, onError }) {
  return crearSuscripcion({
    query: Q_PEDIDOS,
    campo: 'pedidoCambiado',
    onEvento: onPedido,
    onReconectar,
    onEstado,
    onError,
    conToken: true,
  });
}