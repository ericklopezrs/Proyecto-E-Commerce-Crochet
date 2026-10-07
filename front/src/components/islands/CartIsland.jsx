import { useCartStore } from '../../store/useCartStore.js';

// Imagen de respaldo (no depende de internet) por si la foto no carga
const IMAGEN_RESPALDO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<text x="50%" y="54%" font-size="14" text-anchor="middle" ' +
      'fill="#94a3b8" font-family="sans-serif">Sin foto</text></svg>'
  );

const mxn = (n) =>
  '$' +
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) +
  ' MXN';

export default function CartIsland() {
  const cart = useCartStore((s) => s.cart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const totalPiezas = cart.reduce((t, i) => t + i.cantidad, 0);
  const total = cart.reduce((t, i) => t + i.producto.precio * i.cantidad, 0);

  return (
    <div className="main-container">
      <main className="content">
        <div className="ml-cart">
          <a href="/" className="back-button" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
            Volver al catálogo
          </a>

          <h3 className="section-title">
            <i className="fa-solid fa-basket-shopping" style={{ marginRight: '8px' }}></i>
            Tu Carrito{cart.length > 0 && ` (${totalPiezas})`}
          </h3>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <i
                className="fa-solid fa-cart-flatbed"
                style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}
              ></i>
              El carrito está vacío.
              <div style={{ marginTop: '16px' }}>
                <a
                  href="/"
                  className="primary-btn"
                  style={{
                    display: 'inline-block',
                    width: 'auto',
                    textDecoration: 'none',
                  }}
                >
                  Ver productos
                </a>
              </div>
            </div>
          ) : (
            <div className="ml-cart-layout">
              {/* ===== Lista de productos ===== */}
              <section className="ml-list">
                {cart.map((item) => {
                  const { producto, cantidad } = item;
                  const stock = producto.stock ?? 10;
                  const enMaximo = cantidad >= stock;

                  return (
                    <article key={producto.id} className="ml-item">
                      <a href={`/producto/${producto.id}`} className="ml-thumb-link">
                        <img
                          className="ml-thumb"
                          src={producto.imagen || IMAGEN_RESPALDO}
                          alt={producto.nombre}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = IMAGEN_RESPALDO;
                          }}
                        />
                      </a>

                      <div className="ml-item-main">
                        <a href={`/producto/${producto.id}`} className="ml-item-name">
                          {producto.nombre}
                        </a>
                        <span className="ml-item-unit">{mxn(producto.precio)} c/u</span>

                        <div className="ml-item-actions">
                          <div className="ml-qty">
                            <button
                              type="button"
                              aria-label="Quitar una unidad"
                              onClick={() => updateQuantity(producto.id, cantidad - 1)}
                              disabled={cantidad <= 1}
                            >
                              −
                            </button>
                            <span>{cantidad}</span>
                            <button
                              type="button"
                              aria-label="Agregar una unidad"
                              onClick={() => updateQuantity(producto.id, cantidad + 1)}
                              disabled={enMaximo}
                            >
                              +
                            </button>
                          </div>

                          <span className={`ml-stock ${stock <= 1 || enMaximo ? 'alerta' : ''}`}>
                            {stock === 1
                              ? '¡Última disponible!'
                              : enMaximo
                              ? `Máximo disponible (${stock})`
                              : `${stock} disponibles`}
                          </span>

                          <button
                            type="button"
                            className="ml-remove"
                            onClick={() => removeFromCart(producto.id)}
                          >
                            <i className="fa-solid fa-trash-can" style={{ marginRight: '4px' }}></i>
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="ml-item-price">{mxn(producto.precio * cantidad)}</div>
                    </article>
                  );
                })}
              </section>

              {/* ===== Resumen de compra ===== */}
              <aside className="ml-summary">
                <h4 className="ml-summary-title">Resumen de compra</h4>

                <div className="ml-summary-row">
                  <span>
                    Productos ({totalPiezas})
                  </span>
                  <span>{mxn(total)}</span>
                </div>

                <div className="ml-summary-total">
                  <span>Total</span>
                  <span>{mxn(total)}</span>
                </div>

                <a
                  href="/checkout"
                  className="primary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <i className="fa-solid fa-credit-card" style={{ marginRight: '8px' }}></i>
                  Continuar compra
                </a>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}