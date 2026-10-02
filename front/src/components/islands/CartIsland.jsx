import { useCartStore } from '../../store/useCartStore.js';

export default function CartIsland() {
  const { cart, getTotal, removeFromCart } = useCartStore();

  return (
    <div className="main-container">
      <main className="content">
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <a href="/" className="back-button" style={{ textDecoration: 'none' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>
            Volver al catálogo
          </a>

          <h3 className="section-title">
            <i className="fa-solid fa-basket-shopping" style={{ marginRight: '8px' }}></i>
            Tu Carrito
          </h3>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <i
                className="fa-solid fa-cart-flatbed"
                style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}
              ></i>
              El carrito está vacío.
            </div>
          ) : (
            <div className="cart-box">
              {cart.map((item) => (
<div key={item.producto.id} className="cart-row">
  <div style={{ minWidth: 0, flex: 1 }}>
    <strong style={{ color: '#0f172a' }}>{item.producto.nombre}</strong>
    <div style={{ color: '#64748b', fontSize: '13px' }}>
      Cantidad: {item.cantidad}
    </div>
  </div>

  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
    <span className="product-price" style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>
      ${item.producto.precio * item.cantidad} MXN
    </span>
    <button
      className="cart-remove-btn"
      title="Quitar del carrito"
      onClick={() => removeFromCart(item.producto.id)}
    >
      <i className="fa-solid fa-trash-can"></i>
    </button>
  </div>
</div>
              ))}

              <div className="cart-total-row">
                <span>Total Estimado:</span>
                <span style={{ fontSize: '22px' }}>${getTotal()} MXN</span>
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
                Continuar al Checkout
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}