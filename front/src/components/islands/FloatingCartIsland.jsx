import { useCartStore } from '../../store/useCartStore.js';

export default function FloatingCartIsland() {
  const cart = useCartStore((s) => s.cart);
  const totalItemsCount = cart.reduce((acc, i) => acc + i.cantidad, 0);

  return (
<a
  className="floating-cart-button"
  href="/carrito"
  style={{ textDecoration: 'none' }}
  data-astro-reload
>
  <i className="fa-solid fa-basket-shopping"></i>
  {totalItemsCount > 0 && (
    <span className="floating-cart-badge">{totalItemsCount}</span>
  )}
</a>
  );
}