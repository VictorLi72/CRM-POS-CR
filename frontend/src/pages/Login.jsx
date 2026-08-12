import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getServerUrl, setServerUrl } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverInput, setServerInput] = useState(getServerUrl());

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/pos');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>CRM Super CR</h1>
        <p className="subtitle">Servidor: {getServerUrl()}</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        {!showServerConfig ? (
          <p className="text-muted" style={{ marginTop: 16, fontSize: 12 }}>
            ¿Esta caja no encuentra el servidor?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowServerConfig(true);
              }}
            >
              Cambiar dirección del servidor
            </a>
          </p>
        ) : (
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Dirección del servidor (ej: http://192.168.1.10:4000)</label>
            <input
              type="text"
              value={serverInput}
              onChange={(e) => setServerInput(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => {
                setServerUrl(serverInput);
                setShowServerConfig(false);
              }}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
