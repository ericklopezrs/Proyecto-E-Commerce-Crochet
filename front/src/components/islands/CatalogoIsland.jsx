import { useEffect, useState } from 'react';
import { useCartStore } from '../../store/useCartStore.js';
import { useUiStore } from '../../store/useUiStore.js';
import ContextPanel from '../ContextPanel.jsx';
import ProductCard from '../ProductCard.jsx';
import { suscribirseAProductos } from '../../lib/suscripcion.js';
import { fetchGraphQL } from '../../graphql/cliente.js';
import Sidebar from '../Sidebar.jsx';
import { filtrarProductos, DEFAULT_FILTERS } from '../../utils/filters.js';

const QUERY_CATEGORIAS = `
  query {
    categorias {
      id nombre descripcion
      productos { id nombre precio imagen descripcion stock }
    }
  }
`;

// Aplica un cambio de producto sin mutar el estado anterior
function aplicarCambio(categorias, p) {
  const mismoProducto = (x) => String(x.id) === String(p.id);

  // Desactivado: se quita de todas las categorías
  if (!p.activo) {
    return categorias.map((c) => ({
      ...c,
      productos: (c.productos || []).filter((x) => !mismoProducto(x)),
    }));
  }

  const producto = {
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    imagen: p.imagen,
    descripcion: p.descripcion,
    stock: p.stock,
  };

  return categorias.map((c) => {
    const lista = c.productos || [];
    const esDestino = String(c.id) === String(p.categoria_id);

    // Si cambió de categoría, se quita de las demás
    if (!esDestino) return { ...c, productos: lista.filter((x) => !mismoProducto(x)) };

    const idx = lista.findIndex(mismoProducto);
    if (idx >= 0) {
      const copia = [...lista];
      copia[idx] = producto;
      return { ...c, productos: copia };
    }
    return {
      ...c,
      productos: [...lista, producto].sort((a, b) => Number(a.id) - Number(b.id)),
    };
  });
}

export default function CatalogoIsland({ categorias: categoriasIniciales }) {
  const { cart, getTotal, addToCart } = useCartStore();
  const { searchTerm, setSearchTerm, selectedCategoria } = useUiStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [categorias, setCategorias] = useState(categoriasIniciales);

  useEffect(() => {
    const cerrar = suscribirseAProductos({
      onProducto: (p) => setCategorias((prev) => aplicarCambio(prev, p)),
      onReconectar: async () => {
        try {
          const data = await fetchGraphQL(QUERY_CATEGORIAS);
          if (data?.categorias) setCategorias(data.categorias);
        } catch {
          /* se intentará de nuevo en la siguiente reconexión */
        }
      },
    });
    return cerrar;
  }, []);

  const handleFilterChange = (name, value) =>
    setFilters((prev) => ({ ...prev, [name]: value }));

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const baseProductos =
    selectedCategoria === 'TODAS'
      ? categorias.flatMap((c) => c.productos || [])
      : categorias.find((c) => String(c.id) === String(selectedCategoria))
          ?.productos || [];

  const filteredProductos = filtrarProductos(baseProductos, { searchTerm, filters });

  const tituloCatalogo =
    selectedCategoria === 'TODAS'
      ? 'Catálogo Completo'
      : categorias.find((c) => String(c.id) === String(selectedCategoria))
          ?.nombre || 'Categoría';

  return (
    <div className="main-container">
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      <main className="content">
        <div className="ml-promo-banner-container">
          <img
            src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80"
            alt="Banner Promocional"
            className="ml-promo-banner-img"
          />
        </div>

        <ContextPanel
          cart={cart}
          getTotal={getTotal}
          onGoCart={() => (window.location.href = '/carrito')}
        />

        <h3 className="section-title">
          <i className="fa-solid fa-store" style={{ marginRight: '8px' }}></i>
          {tituloCatalogo}
        </h3>

        {filteredProductos.length === 0 ? (
          <div className="empty-cart">
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}
            ></i>
            No se encontraron productos {searchTerm && <> para "{searchTerm}"</>}.
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
              }}
            >
              <button className="primary-btn-sm" onClick={handleResetFilters}>
                Limpiar filtros
              </button>
              {searchTerm && (
                <button className="primary-btn-sm" onClick={() => setSearchTerm('')}>
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid-productos">
            {filteredProductos.map((prod) => (
              <ProductCard
                key={prod.id}
                producto={prod}
                qty={1}
                availableStock={prod.stock ?? 10}
                onView={(p) => (window.location.href = `/producto/${p.id}`)}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}