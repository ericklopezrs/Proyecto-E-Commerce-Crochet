export default function ContextPanel({ cart, getTotal, onGoCart }) {
  if (cart.length === 0) {
    return (
      <div className="context-panel">
        <p>
          🧸 Aún no agregas nada a tu carrito. ¡Explora el catálogo!
        </p>
      </div>
    );
  }

  return (
    <div
      className="context-panel"
      onClick={onGoCart}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onGoCart();
        }
      }}
    >
      <p>
        <strong>{cart.length}</strong> producto(s) en tu carrito — Total:{' '}
        <strong>${getTotal()} MXN</strong>
      </p>

      <span className="context-cta">
        Ver carrito →
      </span>
    </div>
  );
}