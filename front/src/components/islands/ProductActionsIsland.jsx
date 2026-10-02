import { useState } from 'react';
import { useCartStore } from '../../store/useCartStore.js';

export default function ProductActionsIsland({ producto }) {
  const { addToCart } = useCartStore();
  const [qty, setQty] = useState(1);
  const maxStock = producto.stock ?? 10;

  const changeQty = (delta) =>
    setQty((q) => Math.min(Math.max(1, q + delta), maxStock));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
          Cantidad:
        </label>

        <div className="qty-picker">
          <button onClick={() => changeQty(-1)}>-</button>
          <span>{qty}</span>
          <button onClick={() => changeQty(1)} disabled={qty >= maxStock}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className="primary-btn"
          style={{ flex: 2, padding: '14px 20px', fontSize: '15px' }}
          onClick={() => addToCart(producto, qty)}
        >
          <i className="fa-solid fa-cart-plus" style={{ marginRight: '8px' }}></i>
          Agregar al Carrito
        </button>

        <button
          className="primary-btn-sm"
          style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
          onClick={() => {
            addToCart(producto, qty);
            window.location.href = '/carrito';
          }}
        >
          <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i>
          Comprar Ahora
        </button>
      </div>
    </div>
  );
}