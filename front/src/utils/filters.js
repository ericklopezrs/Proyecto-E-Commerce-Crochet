export const DEFAULT_FILTERS = {
  precioMin: '',
  precioMax: '',
  sortBy: 'default',
  onlyAvailable: false
};

export function filtrarProductos(productos, { searchTerm, filters }) {
  let result = [...productos];

  // 1. Búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter((p) => p.nombre.toLowerCase().includes(term));
  }

  // 2. Rango de precio
  const min = parseFloat(filters.precioMin);
  const max = parseFloat(filters.precioMax);
  if (!isNaN(min)) result = result.filter((p) => parseFloat(p.precio) >= min);
  if (!isNaN(max)) result = result.filter((p) => parseFloat(p.precio) <= max);

  // 3. Solo disponibles
  if (filters.onlyAvailable) {
    result = result.filter((p) => (p.stock ?? 0) > 0);
  }

  // 4. Ordenamiento
  switch (filters.sortBy) {
    case 'precio-asc':  result.sort((a, b) => a.precio - b.precio); break;
    case 'precio-desc': result.sort((a, b) => b.precio - a.precio); break;
    case 'nombre-asc':  result.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
    case 'nombre-desc': result.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
    default: break;
  }

  return result;
}