import { useState } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
export default function Sidebar({ filters, onFilterChange, onResetFilters }) {
  const ordenes = [
    { value: 'default',    label: 'Destacados' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc',label: 'Precio: mayor a menor' },
    { value: 'nombre-asc', label: 'Nombre: A → Z' },
    { value: 'nombre-desc',label: 'Nombre: Z → A' }
  ];

  // En celular los filtros vienen cerrados para que el catálogo se vea primero
  const [abierto, setAbierto] = useState(false);

  return (
    <aside className={`sidebar ${abierto ? 'abierto' : ''}`}>
      <h2 className="sidebar-title">
        <SlidersHorizontal size="1em" className="icono" style={{ marginRight: '8px' }} />
        Filtros
      </h2>

      {/* Solo se ve en celular (responsive.css) */}
      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        <SlidersHorizontal size="1em" className="icono" />
        Filtros y orden
        <ChevronDown size="1em" className="icono sidebar-toggle-flecha" />
      </button>

      <div className="sidebar-body">

      {}
      <div className="filter-group">
        <h3 className="filter-subtitle">Ordenar por</h3>

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
        <h3 className="filter-subtitle">Precio (MXN)</h3>

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
        <h3 className="filter-subtitle">Disponibilidad</h3>

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
        <RotateCcw size="1em" className="icono" style={{ marginRight: '8px' }} />
        Limpiar filtros
      </button>
      </div>
    </aside>
  );
}