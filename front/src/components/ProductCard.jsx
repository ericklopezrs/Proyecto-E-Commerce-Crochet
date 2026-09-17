export default function ProductCard({ producto, qty, availableStock, onView, onAdd }) {
  return (
    <div 
      className="product-card"
      style={{ cursor: 'pointer' }}
      onClick={() => onView(producto)}
    >
      <img src={producto.imagen || 'https://via.placeholder.com/250'} alt={producto.nombre} className="product-image" />
      <div className="product-info">
        <div>
          <h4 className="product-name">{producto.nombre}</h4>
          <p className="product-desc">{producto.descripcion}</p>
          <div className="product-stock">Stock: <span>{availableStock} uds</span></div>
        </div>
        <div className="product-footer-col" onClick={(e) => e.stopPropagation()}>
          <span className="product-price">${producto.precio} MXN</span>
          <div className="card-actions">
            <button className="action-btn" onClick={() => onView(producto)}>
              <i className="fa-solid fa-eye"></i>
            </button>
            <button className="primary-btn-sm" onClick={() => onAdd(producto, qty)} disabled={availableStock === 0}>
              <i className="fa-solid fa-cart-plus"></i> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}