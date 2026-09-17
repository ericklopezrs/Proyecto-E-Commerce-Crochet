import logo from '../assets/logo.png'; // Ajusta la ruta si es necesario

export default function TopBar({ 
  searchTerm, 
  onSearchChange, 
  totalItemsCount, 
  onGoHome, 
  onGoCart 
}) {
  return (
    <header className="header" style={{ alignItems: 'center', gap: '20px' }}>

      {/* LADO IZQUIERDO: mitad del espacio restante */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <div className="brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Logo" className="brand-logo-img" />
          <h1 className="brand-title">Peluches Crochet</h1>
        </div>
      </div>

      {/* CENTRO EXACTO: barra de búsqueda */}
      <div 
        className="search-bar" 
        style={{ 
          flex: '0 1 600px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          position: 'relative' 
        }}
      >
        <i 
          className="fa-solid fa-magnifying-glass" 
          style={{ position: 'absolute', left: '12px', color: '#64748b', fontSize: '14px' }}
        ></i>

        <input
          type="text"
          placeholder="Buscar amigurumis, accesorios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px 16px 8px 36px', 
            borderRadius: '20px', 
            border: '1px solid #94a3b8', 
            outline: 'none', 
            fontSize: '14px' 
          }}
        />
      </div>

      {/* LADO DERECHO: la otra mitad, contenido pegado a la derecha */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="header-cart-button"
          onClick={onGoCart}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '22px', 
            color: '#0f172a', 
            position: 'relative', 
            padding: '8px' 
          }}
        >
          <i className="fa-solid fa-cart-shopping"></i>

          {totalItemsCount > 0 && (
            <span className="floating-cart-badge" style={{ top: '-2px', right: '-6px' }}>
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}