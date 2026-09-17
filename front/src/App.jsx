import { useState, useEffect } from 'react';
import { fetchGraphQL } from './graphql/cliente';
import { useCartStore } from './store/useCartStore';
import './App.css';

// Componentes extraídos
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
import ContextPanel from './components/ContextPanel';

// --- COMPONENTE SKELETON LOADER ---
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
      <div className="skeleton-line short"></div>
    </div>
  );
}

export default function App() {
  // --- ESTADOS Y MÁQUINA DE NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState('HOME');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [selectedProducto, setSelectedProducto] = useState(null);

  // --- STORE GLOBAL (ZUSTAND) ---
  const {
    cart,
    addToCart,
    clearCart,
    getTotal
  } = useCartStore();

  // --- DATOS BACKEND ---
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FILTROS Y CANTIDADES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});

  // --- CAMBIAR CANTIDAD ---
  const handleQuantityChange = (prodId, delta, maxStock = 10) => {
    setQuantities((prev) => {
      const current = prev[prodId] || 1;
      const next = Math.min(
        Math.max(1, current + delta),
        maxStock
      );

      return {
        ...prev,
        [prodId]: next
      };
    });
  };

  // --- CONSULTA GRAPHQL ---
  useEffect(() => {
    fetchGraphQL(`
      query {
        categorias {
          id
          nombre
          descripcion
          productos {
            id
            nombre
            precio
            imagen
            descripcion
            stock
          }
        }
      }
    `)
      .then((data) => {
        setCategorias(data.categorias || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // --- SELECCIONAR CATEGORÍA ---
  const handleSelectCategoria = (catId) => {
    setSelectedCategoria(catId);
    setCurrentView('DETALLE_CATEGORIA');
  };

  // --- SELECCIONAR PRODUCTO ---
  const handleSelectProducto = (prod) => {
    setSelectedProducto(prod);
    setCurrentView('PRODUCTO');
  };

  // --- REGISTRAR PEDIDO ---
  const handleRegistrarPedido = async () => {
    const total = getTotal();

    const items = cart.map((item) => ({
      producto_id: String(item.producto.id),
      cantidad: parseInt(item.cantidad, 10),
      precio_unitario: parseFloat(item.producto.precio)
    }));

    try {
      await fetchGraphQL(
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
        {
          usuario_id: "1",
          total: parseFloat(total),
          items
        }
      );

      alert('¡Pedido guardado exitosamente!');

      clearCart();
      setCurrentView('HOME');

    } catch (err) {
      alert('Error al registrar pedido: ' + err.message);
    }
  };

  // --- ERROR DE CONEXIÓN ---
  if (error) {
    return (
      <div className="error-container">
        <i
          className="fa-solid fa-triangle-exclamation"
          style={{
            marginRight: '8px',
            fontSize: '24px'
          }}
        ></i>

        <p>Error de conexión: {error}</p>

        <button
          className="primary-btn-sm"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // --- TODOS LOS PRODUCTOS ---
  const allProductos = categorias.flatMap(
    (cat) => cat.productos || []
  );

  // --- PRODUCTOS DEL HOME ---
  const homeProductos = allProductos.filter((p) =>
    p.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // --- PRODUCTOS DE LA CATEGORÍA ---
  const baseCategoriaProductos =
    selectedCategoria === 'TODAS'
      ? allProductos
      : categorias.find(
          (c) =>
            String(c.id) === String(selectedCategoria)
        )?.productos || [];

  const displayedCategoriaProductos =
    baseCategoriaProductos.filter((p) =>
      p.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  // --- TOTAL DE PRODUCTOS EN EL CARRITO ---
  const totalItemsCount = cart.reduce(
    (acc, item) => acc + item.cantidad,
    0
  );

  return (
    <div className="app-wrapper">

      {/* HEADER */}
      <TopBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalItemsCount={totalItemsCount}
        onGoHome={() => {
          setSelectedCategoria('TODAS');
          setCurrentView('HOME');
        }}
        onGoCart={() => setCurrentView('CARRITO')}
      />

      {/* BOTÓN FLOTANTE DEL CARRITO */}
      <button
        className="floating-cart-button"
        onClick={() => setCurrentView('CARRITO')}
      >
        <i className="fa-solid fa-basket-shopping"></i>

        {totalItemsCount > 0 && (
          <span className="floating-cart-badge">
            {totalItemsCount}
          </span>
        )}
      </button>

      <div className="main-container">

        {/* SIDEBAR */}
        <Sidebar
          categorias={categorias}
          selectedCategoria={selectedCategoria}
          onSelectCategoria={handleSelectCategoria}
          currentView={currentView}
        />

        <main className="content">

          {/* =====================================================
              VISTA 1: CATÁLOGO PRINCIPAL
          ====================================================== */}
         {currentView === 'HOME' && (
  <div>
    <div className="ml-promo-banner-container">
      <img
        src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80"
        alt="Banner Promocional"
        className="ml-promo-banner-img"
      />
    </div>

    {/* VISTA RÁPIDA DEL CARRITO */}
    <ContextPanel
      cart={cart}
      getTotal={getTotal}
      onGoCart={() => setCurrentView('CARRITO')}
    />

    <h3 className="section-title">
      <i
        className="fa-solid fa-store"
        style={{ marginRight: '8px' }}
      ></i>
      Catálogo Completo
    </h3>

    <div className="grid-productos">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))
      ) : (
        homeProductos.map((prod) => (
          <ProductCard
            key={prod.id}
            producto={prod}
            qty={quantities[prod.id] || 1}
            availableStock={prod.stock ?? 10}
            onView={handleSelectProducto}
            onAdd={addToCart}
          />
        ))
      )}
    </div>
  </div>
)}

          {/* =====================================================
              VISTA 2: DETALLE DE CATEGORÍA
          ====================================================== */}
          {currentView === 'DETALLE_CATEGORIA' && (
            <div>

              <button
                className="back-button"
                onClick={() => {
                  setSelectedCategoria('TODAS');
                  setCurrentView('HOME');
                }}
              >
                <i
                  className="fa-solid fa-arrow-left"
                  style={{ marginRight: '6px' }}
                ></i>

                Volver al inicio
              </button>

              <h3 className="section-title">

                <i
                  className="fa-solid fa-tags"
                  style={{ marginRight: '8px' }}
                ></i>

                {selectedCategoria === 'TODAS'
                  ? 'Todas las Categorías'
                  : categorias.find(
                      (c) =>
                        String(c.id) ===
                        String(selectedCategoria)
                    )?.nombre || 'Categoría'
                }

              </h3>

              <div className="grid-productos">

                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : (
                  displayedCategoriaProductos.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      producto={prod}
                      qty={quantities[prod.id] || 1}
                      availableStock={prod.stock ?? 10}
                      onView={handleSelectProducto}
                      onAdd={addToCart}
                    />
                  ))
                )}

              </div>
            </div>
          )}

          {/* =====================================================
              VISTA 3: DETALLE DE PRODUCTO
          ====================================================== */}
          {currentView === 'PRODUCTO' &&
            selectedProducto && (
              <div>

                <button
                  className="back-button"
                  onClick={() =>
                    setCurrentView('HOME')
                  }
                >
                  <i
                    className="fa-solid fa-arrow-left"
                    style={{ marginRight: '6px' }}
                  ></i>

                  Volver al catálogo
                </button>

                <div className="detail-container">

                  <img
                    src={
                      selectedProducto.imagen ||
                      'https://via.placeholder.com/280'
                    }
                    alt={selectedProducto.nombre}
                    className="detail-image"
                  />

                  <div className="detail-body">

                    <h2
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '26px',
                        color: '#0f172a'
                      }}
                    >
                      {selectedProducto.nombre}
                    </h2>

                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        marginBottom: '16px'
                      }}
                    >
                      {selectedProducto.descripcion}
                    </p>

                    <div
                      className="product-stock"
                      style={{
                        fontSize: '14px',
                        marginBottom: '16px'
                      }}
                    >
                      Stock disponible:{' '}
                      <span>
                        {selectedProducto.stock ?? 10}
                        {' '}piezas
                      </span>
                    </div>

                    <div
                      className="product-price"
                      style={{
                        fontSize: '28px',
                        marginBottom: '20px'
                      }}
                    >
                      ${selectedProducto.precio} MXN
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '20px'
                      }}
                    >

                      <label
                        style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          color: '#0f172a'
                        }}
                      >
                        Cantidad:
                      </label>

                      <div className="qty-picker">

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              selectedProducto.id,
                              -1,
                              selectedProducto.stock ?? 10
                            )
                          }
                        >
                          -
                        </button>

                        <span>
                          {quantities[
                            selectedProducto.id
                          ] || 1}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              selectedProducto.id,
                              1,
                              selectedProducto.stock ?? 10
                            )
                          }
                          disabled={
                            (quantities[
                              selectedProducto.id
                            ] || 1) >=
                            (selectedProducto.stock ?? 10)
                          }
                        >
                          +
                        </button>

                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >

                      <button
                        className="primary-btn"
                        style={{
                          flex: 2,
                          padding: '14px 20px',
                          fontSize: '15px'
                        }}
                        onClick={() =>
                          addToCart(
                            selectedProducto,
                            quantities[
                              selectedProducto.id
                            ] || 1
                          )
                        }
                      >
                        <i
                          className="fa-solid fa-cart-plus"
                          style={{ marginRight: '8px' }}
                        ></i>

                        Agregar al Carrito
                      </button>

                      <button
                        className="primary-btn-sm"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          fontSize: '13px'
                        }}
                        onClick={() => {
                          addToCart(
                            selectedProducto,
                            quantities[
                              selectedProducto.id
                            ] || 1
                          );

                          setCurrentView('CARRITO');
                        }}
                      >
                        <i
                          className="fa-solid fa-credit-card"
                          style={{ marginRight: '6px' }}
                        ></i>

                        Comprar Ahora
                      </button>

                    </div>

                  </div>
                </div>
              </div>
            )}

          {/* =====================================================
              VISTA 4: CARRITO
          ====================================================== */}
          {currentView === 'CARRITO' && (
            <div
              style={{
                maxWidth: '650px',
                margin: '0 auto'
              }}
            >

              <button
                className="back-button"
                onClick={() =>
                  setCurrentView('HOME')
                }
              >
                <i
                  className="fa-solid fa-arrow-left"
                  style={{ marginRight: '6px' }}
                ></i>

                Volver al catálogo
              </button>

              <h3 className="section-title">
                <i
                  className="fa-solid fa-basket-shopping"
                  style={{ marginRight: '8px' }}
                ></i>

                Tu Carrito
              </h3>

              {cart.length === 0 ? (

                <div className="empty-cart">

                  <i
                    className="fa-solid fa-cart-flatbed"
                    style={{
                      fontSize: '32px',
                      display: 'block',
                      marginBottom: '12px'
                    }}
                  ></i>

                  El carrito está vacío.

                </div>

              ) : (

                <div className="cart-box">

                  {cart.map((item) => (
                    <div
                      key={item.producto.id}
                      className="cart-row"
                    >

                      <div>

                        <strong
                          style={{ color: '#0f172a' }}
                        >
                          {item.producto.nombre}
                        </strong>

                        <div
                          style={{
                            color: '#64748b',
                            fontSize: '13px'
                          }}
                        >
                          Cantidad: {item.cantidad}
                        </div>

                      </div>

                      <span
                        className="product-price"
                        style={{ fontSize: '16px' }}
                      >
                        $
                        {item.producto.precio *
                          item.cantidad}{' '}
                        MXN
                      </span>

                    </div>
                  ))}

                  <div className="cart-total-row">

                    <span>
                      Total Estimado:
                    </span>

                    <span
                      style={{ fontSize: '22px' }}
                    >
                      ${getTotal()} MXN
                    </span>

                  </div>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      setCurrentView('CHECKOUT')
                    }
                  >
                    <i
                      className="fa-solid fa-credit-card"
                      style={{ marginRight: '8px' }}
                    ></i>

                    Continuar al Checkout
                  </button>

                </div>
              )}

            </div>
          )}

          {/* =====================================================
              VISTA 5: CHECKOUT
          ====================================================== */}
          {currentView === 'CHECKOUT' && (
            <div
              style={{
                maxWidth: '550px',
                margin: '0 auto'
              }}
            >

              <button
                className="back-button"
                onClick={() =>
                  setCurrentView('CARRITO')
                }
              >
                <i
                  className="fa-solid fa-arrow-left"
                  style={{ marginRight: '6px' }}
                ></i>

                Volver al carrito
              </button>

              <h3 className="section-title">

                <i
                  className="fa-solid fa-clipboard-check"
                  style={{ marginRight: '8px' }}
                ></i>

                Confirmar Pedido

              </h3>

              <div className="cart-box">

                <h4
                  style={{
                    margin: '0 0 16px 0',
                    color: '#64748b'
                  }}
                >
                  Resumen del Pedido
                </h4>

                {cart.map((item) => (
                  <div
                    key={item.producto.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '14px'
                    }}
                  >

                    <span>
                      {item.producto.nombre}{' '}
                      (x{item.cantidad})
                    </span>

                    <span
                      style={{ fontWeight: 'bold' }}
                    >
                      $
                      {item.producto.precio *
                        item.cantidad}{' '}
                      MXN
                    </span>

                  </div>
                ))}

                <hr
                  style={{
                    border: 'none',
                    borderTop:
                      '1px solid #cbd5e1',
                    margin: '16px 0'
                  }}
                />

                <div
                  className="cart-total-row"
                  style={{
                    paddingTop: '0'
                  }}
                >

                  <span>
                    Total a Pagar:
                  </span>

                  <span
                    style={{ fontSize: '22px' }}
                  >
                    ${getTotal()} MXN
                  </span>

                </div>

                <button
                  className="success-btn"
                  onClick={handleRegistrarPedido}
                >
                  <i
                    className="fa-solid fa-database"
                    style={{ marginRight: '8px' }}
                  ></i>

                  Confirmar y Guardar en BD
                </button>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}