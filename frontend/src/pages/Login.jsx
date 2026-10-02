import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getServerUrl, setServerUrl } from '../api/client';

const SAVED_USERS_KEY = 'crm_saved_users';

function getSavedUsers() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUser(username) {
  const prev = getSavedUsers().filter((u) => u !== username);
  localStorage.setItem(SAVED_USERS_KEY, JSON.stringify([username, ...prev].slice(0, 5)));
}

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#1e6f5c', '#2563eb', '#7c3aed', '#b45309', '#0369a1'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const savedUsers = getSavedUsers();

  const [selectedUser, setSelectedUser] = useState(savedUsers[0] || '');
  const [manualMode, setManualMode] = useState(savedUsers.length === 0);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverInput, setServerInput] = useState(getServerUrl());

  const passwordRef = useRef(null);
  const codeRef = useRef(null);

  const username = manualMode ? selectedUser : selectedUser;

  function pickUser(u) {
    setSelectedUser(u);
    setManualMode(false);
    setError('');
    setTimeout(() => passwordRef.current?.focus(), 0);
  }

  function switchToManual() {
    setSelectedUser('');
    setManualMode(true);
    setError('');
    setTimeout(() => codeRef.current?.focus(), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      saveUser(username.trim());
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
          {/* ── Tarjetas de usuarios guardados ── */}
          {!manualMode && savedUsers.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Seleccioná tu usuario:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {savedUsers.map((u, i) => {
                  const active = u === selectedUser;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => pickUser(u)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        border: `2px solid ${active ? '#1e6f5c' : 'var(--color-border)'}`,
                        borderRadius: 10,
                        background: active ? 'rgba(30,111,92,0.07)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.12s, background 0.12s',
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        color: '#fff', fontWeight: 700, fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {initials(u)}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: active ? 700 : 400, color: 'var(--color-text)' }}>
                        {u}
                      </span>
                      {active && (
                        <span style={{ marginLeft: 'auto', color: '#1e6f5c', fontSize: 18 }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={switchToManual}
                style={{
                  width: '100%', padding: '8px 0', marginBottom: 14,
                  background: 'none', border: '1px dashed var(--color-border)',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  color: 'var(--color-text-muted)',
                  transition: 'border-color 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1e6f5c'; e.currentTarget.style.color = '#1e6f5c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
              >
                + Usar otro usuario
              </button>
            </>
          )}

          {/* ── Input manual ── */}
          {manualMode && (
            <div className="form-group">
              <label>Código</label>
              <input
                ref={codeRef}
                type="text"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                autoComplete="off"
                autoFocus
                required
              />
              {savedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedUser(savedUsers[0]); setManualMode(false); }}
                  style={{
                    marginTop: 6, background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)',
                    padding: 0, textDecoration: 'underline',
                  }}
                >
                  ← Volver a usuarios guardados
                </button>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Contraseña</label>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading || !username.trim()}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {!showServerConfig ? (
          <p className="text-muted" style={{ marginTop: 16, fontSize: 12 }}>
            ¿Esta caja no encuentra el servidor?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setShowServerConfig(true); }}>
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
              onClick={() => { setServerUrl(serverInput); setShowServerConfig(false); }}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
