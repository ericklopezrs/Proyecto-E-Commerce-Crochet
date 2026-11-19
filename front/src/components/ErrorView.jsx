import { TriangleAlert } from 'lucide-react';
export default function ErrorView({ error }) {
  return (
    <div className="error-container">
      <TriangleAlert size="1em" className="icono" style={{ marginRight: '8px', fontSize: '24px' }} />
      <p>Error de conexión: {error}</p>
      <button className="primary-btn-sm" onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  );
}