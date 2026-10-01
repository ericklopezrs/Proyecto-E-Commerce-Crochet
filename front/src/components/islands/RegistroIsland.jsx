import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function RegistroIsland() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones
    if (!nombre.trim() || !email.trim() || !password || !confirm) {
      setError('Completa todos los campos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Escribe un correo válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setLoading(true);

    // 🔌 AQUÍ va la llamada al backend (mutation registro) cuando exista
    setTimeout(() => {
      console.log('Registro:', { nombre, email, password });
      alert('¡Registro simulado! Backend pendiente 🧸');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="main-container">
      <main className="content">
        <div className="login-page">
          <div className="login-card">

            <div className="login-header">
              <span className="login-title-icon"><UserPlus size={22} /></span>
              <h2 className="login-title">Crear Cuenta</h2>
              <p className="login-subtitle">Únete a nuestra familia</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="nombre">Nombre</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><User size={16} /></span>
                  <input
                    id="nombre"
                    type="text"
                    className="login-input"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
              </div>

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
                    placeholder="Mínimo 6 caracteres"
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

              <div className="login-field">
                <label className="login-label" htmlFor="confirm">Confirmar contraseña</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input with-toggle"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Crear Cuenta
                  </>
                )}
              </button>
            </form>

            <p className="login-footer">
              ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
            </p>

          </div>
        </div>
      </main>
    </div>
  );
}