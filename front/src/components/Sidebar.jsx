export default function Sidebar({ filters, onFilterChange, onResetFilters }) {
  const ordenes = [
    { value: 'default',    label: 'Destacados' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc',label: 'Precio: mayor a menor' },
    { value: 'nombre-asc', label: 'Nombre: A → Z' },
    { value: 'nombre-desc',label: 'Nombre: Z → A' }
  ];

  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">
        <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i>
        Filtros
      </h3>

      {/* ORDEN */}
      <div className="filter-group">
        <h4 className="filter-subtitle">Ordenar por</h4>

        {ordenes.map((opt) => (
          <label key={opt.value} className="sort-option">
            <input
              type="radio"
              name="sortBy"
              checked={filters.sortBy === opt.value}
              onChange={() => onFilterChange('sortBy', opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* PRECIO */}
      <div className="filter-group">
        <h4 className="filter-subtitle">Precio (MXN)</h4>

        <div className="price-inputs">
          <input
            type="number"
            placeholder="Mín"
            min="0"
            value={filters.precioMin}
            onChange={(e) => onFilterChange('precioMin', e.target.value)}
          />
          <span className="price-sep">–</span>
          <input
            type="number"
            placeholder="Máx"
            min="0"
            value={filters.precioMax}
            onChange={(e) => onFilterChange('precioMax', e.target.value)}
          />
        </div>
      </div>

      {/* DISPONIBILIDAD */}
      <div className="filter-group">
        <h4 className="filter-subtitle">Disponibilidad</h4>

        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(e) => onFilterChange('onlyAvailable', e.target.checked)}
          />
          Solo productos con stock
        </label>
      </div>

      <button className="filter-reset-btn" onClick={onResetFilters}>
        <i className="fa-solid fa-rotate-left" style={{ marginRight: '8px' }}></i>
        Limpiar filtros
      </button>
    </aside>
  );
}