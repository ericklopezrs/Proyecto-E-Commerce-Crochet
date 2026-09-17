export default function Sidebar({ categorias, selectedCategoria, onSelectCategoria, currentView }) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">
        <i className="fa-solid fa-list-ul" style={{ marginRight: '8px' }}></i> Categorías
      </h3>
      <ul className="category-list">
        <li
          className={`category-item ${selectedCategoria === 'TODAS' && currentView === 'DETALLE_CATEGORIA' ? 'active' : ''}`}
          onClick={() => onSelectCategoria('TODAS')}
        >
          Todas las Categorías
        </li>
        {categorias.map((cat) => (
          <li
            key={cat.id}
            className={`category-item ${selectedCategoria === String(cat.id) && currentView === 'DETALLE_CATEGORIA' ? 'active' : ''}`}
            onClick={() => onSelectCategoria(String(cat.id))}
          >
            {cat.nombre}
          </li>
        ))}
      </ul>
    </aside>
  );
}