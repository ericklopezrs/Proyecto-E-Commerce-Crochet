import { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginIsland() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones (mientras no hay backend)
    if (!email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }

    setError('');
    setLoading(true);

    // 🔌 AQUÍ va la llamada al backend (mutation login) cuando exista
    setTimeout(() => {
      console.log('Login:', { email, password });
      alert('¡Login simulado! Backend pendiente 🧸');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="main-container">
      <main className="content">
        <div className="login-page">
          <div className="login-card">

            <div className="login-header">
              <span className="login-title-icon"><LogIn size={22} /></span>
              <h2 className="login-title">Inicia Sesión</h2>
              <p className="login-subtitle">Bienvenido de vuelta</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Correo</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Mail size={16} /></span>
                  <input
                    id="email"
                    type="email"
                    className="login-input"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">Contraseña</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input with-toggle"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar contraseña"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="login-spinner" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            <p className="login-footer">
              ¿No tienes cuenta? <a href="/registro">Regístrate</a>
            </p>

          </div>
        </div>
      </main>
    </div>
  );
}