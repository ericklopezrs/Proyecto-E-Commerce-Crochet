import TopBar from '../TopBar.jsx';
import { useCartStore } from '../../store/useCartStore.js';
import { useUiStore } from '../../store/useUiStore.js';

export default function TopBarIsland({ categorias }) {
  const cart = useCartStore((s) => s.cart);
  const searchTerm = useUiStore((s) => s.searchTerm);
  const setSearchTerm = useUiStore((s) => s.setSearchTerm);
  const selectedCategoria = useUiStore((s) => s.selectedCategoria);
  const setSelectedCategoria = useUiStore((s) => s.setSelectedCategoria);

  const totalItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <TopBar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      totalItemsCount={totalItemsCount}
      onGoHome={() => {
        setSelectedCategoria('TODAS');
        if (window.location.pathname !== '/') window.location.href = '/';
      }}
      onGoCart={() => (window.location.href = '/carrito')}
      categorias={categorias}
      selectedCategoria={selectedCategoria}
      onSelectCategoria={(catId) => {
        setSelectedCategoria(catId);
        if (window.location.pathname !== '/') window.location.href = '/';
      }}
    />
  );
}