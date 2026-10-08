import TopBar from '../TopBar.jsx';
import { useCartStore } from '../../store/useCartStore.js';
import { useUiStore } from '../../store/useUiStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { hacerLogout } from '../../services/auth.js';

export default function TopBarIsland({ categorias }) {
  const cart = useCartStore((s) => s.cart);
<<<<<<< HEAD
=======
  const clearCart = useCartStore((s) => s.clearCart);   
>>>>>>> main
  const searchTerm = useUiStore((s) => s.searchTerm);
  const setSearchTerm = useUiStore((s) => s.setSearchTerm);
  const selectedCategoria = useUiStore((s) => s.selectedCategoria);
  const setSelectedCategoria = useUiStore((s) => s.setSelectedCategoria);

  const usuario = useAuthStore((s) => s.usuario);
  const refresh_token = useAuthStore((s) => s.refresh_token);
  const limpiarSesion = useAuthStore((s) => s.limpiarSesion);

  const totalItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const handleLogout = async () => {
    try {
<<<<<<< HEAD
      // El logout DEBE llamar la mutation — desactiva el token en la BD
      if (refresh_token) await hacerLogout(refresh_token);
    } catch {
      // Si truena (token ya vencido, etc.), igual cerramos local — no nos estancamos
    }
    limpiarSesion();
=======
      if (refresh_token) await hacerLogout(refresh_token); 
    } catch {
    }
    limpiarSesion();
    clearCart();   
>>>>>>> main
    window.location.href = '/';
  };

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
      usuario={usuario}
      onLogout={handleLogout}
    />
  );
}