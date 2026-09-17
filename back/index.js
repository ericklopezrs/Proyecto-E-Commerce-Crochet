import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { typeDefs } from './schema.js';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  user: String(process.env.DB_USER || 'postgres'),
  host: String(process.env.DB_HOST || 'localhost'),
  database: String(process.env.DB_NAME || 'postgres'),
  password: String(process.env.DB_PASSWORD || ''),
  port: Number(process.env.DB_PORT) || 5432,
});

const resolvers = {
  Query: {
    categorias: async () => {
      const res = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
      return res.rows;
    },
    categoria: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM categorias WHERE id = $1', [id]);
      return res.rows[0];
    },
    productos: async (_, { limit = 10, offset = 0 }) => {
      const res = await pool.query('SELECT * FROM productos LIMIT $1 OFFSET $2', [limit, offset]);
      return res.rows;
    },
    producto: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
      return res.rows[0];
    },
    pedidos: async () => {
      const res = await pool.query('SELECT * FROM pedidos ORDER BY fecha DESC');
      return res.rows;
    }
  },

  Categoria: {
    productos: async (parent) => {
      const res = await pool.query('SELECT * FROM productos WHERE categoria_id = $1', [parent.id]);
      return res.rows;
    }
  },
  Producto: {
    categoria: async (parent) => {
      if (!parent.categoria_id) return null;
      const res = await pool.query('SELECT * FROM categorias WHERE id = $1', [parent.categoria_id]);
      return res.rows[0];
    }
  },
  Pedido: {
  detalles: async (parent) => {
    const res = await pool.query('SELECT * FROM pedido_detalles WHERE pedido_id = $1', [parent.id]);
    return res.rows;
  },
  usuario: async (parent) => {
    if (!parent.usuario_id) return null;
    const res = await pool.query('SELECT * FROM usuarios WHERE id = $1', [parent.usuario_id]);
    return res.rows[0];
  }
},
  DetallePedido: {
    producto: async (parent) => {
      const res = await pool.query('SELECT * FROM productos WHERE id = $1', [parent.producto_id]);
      return res.rows[0];
    }
  },

  Mutation: {
    crearProducto: async (_, { nombre, descripcion, precio, imagen, stock, categoria_id }) => {
  const catId = parseInt(categoria_id, 10);
  const res = await pool.query(
    `INSERT INTO productos (nombre, descripcion, precio, imagen, stock, categoria_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nombre, descripcion ?? null, precio, imagen ?? null, stock, catId]
  );
  return res.rows[0];
},

actualizarProducto: async (_, { id, nombre, precio, stock }) => {
  const pid = parseInt(id, 10);
  const campos = [];
  const valores = [];
  let i = 1;

  if (nombre !== undefined) { campos.push(`nombre = $${i++}`); valores.push(nombre); }
  if (precio !== undefined) { campos.push(`precio = $${i++}`); valores.push(precio); }
  if (stock  !== undefined) { campos.push(`stock = $${i++}`);  valores.push(stock); }

  if (campos.length === 0) {
    const actual = await pool.query('SELECT * FROM productos WHERE id = $1', [pid]);
    return actual.rows[0];
  }

  valores.push(pid);
  const res = await pool.query(
    `UPDATE productos SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
    valores
  );
  return res.rows[0];
},

eliminarProducto: async (_, { id }) => {
  const pid = parseInt(id, 10);
  try {
    const res = await pool.query('DELETE FROM productos WHERE id = $1', [pid]);
    return res.rowCount > 0;
  } catch (e) {
    console.error("❌ No se pudo eliminar el producto:", e.message);
    return false;
  }
},

    registrarPedido: async (_, { usuario_id, total, items }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const uid = parseInt(usuario_id, 10);
    const totalNum = parseFloat(total);

    const pedidoRes = await client.query(
      "INSERT INTO pedidos (usuario_id, total, status) VALUES ($1, $2, 'PENDIENTE') RETURNING *",
      [uid, totalNum]
    );
    const nuevoPedido = pedidoRes.rows[0];

    for (const item of items) {
      const pid = parseInt(item.producto_id, 10);
      const cant = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);

      await client.query(
        'INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [nuevoPedido.id, pid, cant, precio]
      );

      // Descuenta stock, validando que no quede negativo
      const stockRes = await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock',
        [cant, pid]
      );

      if (stockRes.rowCount === 0) {
        throw new Error(`Stock insuficiente para el producto ${pid}`);
      }
    }

    await client.query('COMMIT');
    return nuevoPedido;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("❌ Error en la transacción de registrarPedido:", e.message);
    throw new Error("No se pudo guardar el pedido: " + e.message);
  } finally {
    client.release();
  }
}
  }
};

// --- INICIALIZACIÓN DE EXPRESS + APOLLO SERVER ---
const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

// 1. Servir imágenes locales en la ruta '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Endpoint GraphQL
app.use(
  '/graphql',
  cors(),
  bodyParser.json(),
  expressMiddleware(server)
);

// 3. Encender servidor en el puerto 4000
const PORT = process.env.PORT || 4000;
await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Servidor listo en: http://localhost:${PORT}/graphql`);
console.log(`🖼️ Imágenes accesibles en: http://localhost:${PORT}/uploads/nombre_imagen.jpg`);