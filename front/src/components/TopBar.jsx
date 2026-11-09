import { LayoutGrid, LogIn, LogOut, Package, Search, ShoppingCart, Wrench } from 'lucide-react';
import logo from '../assets/logo.png';
import { useState, useRef } from 'react';

export default function TopBar({
  searchTerm,
  onSearchChange,
  totalItemsCount,
  onGoHome,
  onGoCart,
  categorias,
  selectedCategoria,
  onSelectCategoria,
  usuario,
  onLogout
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef(null);

  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      if (searchTerm) onSearchChange('');
    } else {
      setIsSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') toggleSearch();
  };

  return (
    <header className="header">

      {}
      <div className="header-main">

        {}
        <div className="header-side header-side-left">
          <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
            <img src={logo.src} alt="" width="70" height="70" className="brand-logo-img" />
            <h1 className="brand-title">Peluches Crochet</h1>
          </div>
        </div>

        {}
        <div className={`search-expand ${isSearchOpen ? 'open' : ''}`}>
          <button className="search-toggle" onClick={toggleSearch} title="Buscar" aria-label="Buscar productos">
            <Search size="1em" className="icono" />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar amigurumis, accesorios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
            className="search-input"
            aria-label="Buscar productos"
          />
        </div>

        {/* Derecha: sesión + carrito */}
        <div className="header-side header-side-right">
          {usuario ? (
            <div className="header-user">
              <span className="header-user-name">
                Hola, {usuario.nombre.split(' ')[0]}
              </span>
              <a href="/mis-pedidos" className="header-login-btn" title="Mis pedidos" aria-label="Mis pedidos">
                <Package size="1em" className="icono" />
              </a>
                {usuario.rol === 'ADMIN' && (
                  <a href="/admin/productos" className="header-login-btn" title="Backoffice" aria-label="Backoffice">
                    <Wrench size="1em" className="icono" />
                  </a>
                )}
              <button
                className="header-logout-btn"
                onClick={onLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size="1em" className="icono" />
              </button>
            </div>
          ) : (
            <a href="/login" className="header-login-btn">
              <LogIn size="1em" className="icono" style={{ marginRight: '6px' }} />
              Iniciar Sesión
            </a>
          )}

          <button
            className="header-cart-button"
            onClick={onGoCart}
            aria-label={`Ver carrito (${totalItemsCount} artículos)`}
          >
            <ShoppingCart size="1em" className="icono" />
            {totalItemsCount > 0 && (
              <span className="floating-cart-badge">{totalItemsCount}</span>
            )}
          </button>
        </div>
      </div>

      {}
      <nav className="category-bar">
        <button
          className={`category-chip ${selectedCategoria === 'TODAS' ? 'active' : ''}`}
          onClick={() => onSelectCategoria('TODAS')}
        >
          <LayoutGrid size="1em" className="icono" style={{ marginRight: '6px' }} />
          Todo
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${
              String(selectedCategoria) === String(cat.id) ? 'active' : ''
            }`}
            onClick={() => onSelectCategoria(cat.id)}
          >
            {cat.nombre}
          </button>
        ))}
      </nav>
    </header>
  );
}