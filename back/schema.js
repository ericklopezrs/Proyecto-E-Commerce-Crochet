export const typeDefs = `#graphql
  enum RolUsuario {
    CLIENTE
    ADMIN
  }

  type Categoria {
    id: ID!
    nombre: String!
    descripcion: String
    productos: [Producto!]!
  }

  type Producto {
    id: ID!
    nombre: String!
    descripcion: String
    precio: Float!
    imagen: String
    stock: Int!
    categoria: Categoria
  }

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: RolUsuario!
  }

  type DetallePedido {
    id: ID!
    producto: Producto!
    cantidad: Int!
    precio_unitario: Float!
  }

  type Pedido {
  id: ID!
  fecha: String!
  total: Float!
  status: String!
  usuario: Usuario
  detalles: [DetallePedido!]!
}

  input ItemPedidoInput {
    producto_id: ID!
    cantidad: Int!
    precio_unitario: Float!
  }

  type Query {
    categorias: [Categoria!]!
    categoria(id: ID!): Categoria
    productos(limit: Int, offset: Int): [Producto!]!
    producto(id: ID!): Producto
    pedidos: [Pedido!]!
  }

  type Mutation {
    crearProducto(nombre: String!, descripcion: String, precio: Float!, imagen: String, stock: Int!, categoria_id: ID!): Producto!
    actualizarProducto(id: ID!, nombre: String, precio: Float, stock: Int): Producto!
    eliminarProducto(id: ID!): Boolean!
    registrarPedido(usuario_id: ID!, total: Float!, items: [ItemPedidoInput!]!): Pedido!
  }
`;