# Frontend — Peluches Crochet (P2-6)

App React (Vite) que consume el backend GraphQL del e-commerce.

## Requisitos
- Node.js 18+
- Backend corriendo en `http://localhost:4000/graphql` (ver `back/README.md`)

## Instalación

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173` (o el puerto que indique Vite).

## Configuración

El endpoint del backend está definido en `src/graphql/cliente.js`:

```javascript
const GRAPHQL_URL = 'http://localhost:4000/graphql';
```

Si tu backend corre en otro host o puerto, ajusta esa constante.

## Flujo de la app

Home → Detalle de categoría → Detalle de producto → Carrito → Checkout,
controlado por estado (`currentView`) — sin rutas de URL.

## Estado global

El carrito se maneja con **Zustand** (`src/store/useCartStore.js`), compartido
entre el TopBar, el catálogo y el checkout.