export default function ErrorView({ error }) {
  return (
    <div className="error-container">
      <i className="fa-solid fa-triangle-exclamation"
         style={{ marginRight: '8px', fontSize: '24px' }}></i>
      <p>Error de conexión: {error}</p>
      <button className="primary-btn-sm" onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  );
}