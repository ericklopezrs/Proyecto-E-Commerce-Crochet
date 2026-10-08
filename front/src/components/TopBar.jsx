import { useState, useRef } from 'react';
import logo from '../assets/logo.png';

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
            <img src={logo.src} alt="Logo" className="brand-logo-img" />
            <h1 className="brand-title">Peluches Crochet</h1>
          </div>
        </div>

        {}
        <div className={`search-expand ${isSearchOpen ? 'open' : ''}`}>
          <button className="search-toggle" onClick={toggleSearch} title="Buscar">
            <i className="fa-solid fa-magnifying-glass"></i>
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
          />
        </div>

        {/* Derecha: sesión + carrito */}
        <div className="header-side header-side-right">
          {usuario ? (
            <div className="header-user">
              <span className="header-user-name">
                Hola, {usuario.nombre.split(' ')[0]}
              </span>
              <button
                className="header-logout-btn"
                onClick={onLogout}
                title="Cerrar sesión"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <a href="/login" className="header-login-btn">
              <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i>
              Iniciar Sesión
            </a>
          )}

          <button className="header-cart-button" onClick={onGoCart}>
            <i className="fa-solid fa-cart-shopping"></i>
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
          <i className="fa-solid fa-border-all" style={{ marginRight: '6px' }}></i>
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