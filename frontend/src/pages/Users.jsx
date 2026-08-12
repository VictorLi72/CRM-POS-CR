import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_USER = { id: null, username: '', password: '', nombre_completo: '', rol: 'cajero', activo: true };
const ROLE_LABELS = { administrador: 'Administrador', supervisor: 'Supervisor', cajero: 'Cajero' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [modalUser, setModalUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await api.get('/users');
    setUsers(res.data);
  }

  async function saveUser(u) {
    setError('');
    try {
      if (u.id) {
        const payload = { nombre_completo: u.nombre_completo, rol: u.rol, activo: u.activo };
        if (u.password) payload.password = u.password;
        await api.put(`/users/${u.id}`, payload);
      } else {
        await api.post('/users', {
          username: u.username,
          password: u.password,
          nombre_completo: u.nombre_completo,
          rol: u.rol,
        });
      }
      setModalUser(null);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el usuario');
    }
  }

  async function deactivateUser(id) {
    if (!confirm('¿Desactivar este usuario? No podrá iniciar sesión.')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo desactivar');
    }
  }

  return (
    <Layout title="Usuarios">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="toolbar">
        <div />
        <button className="btn" onClick={() => setModalUser({ ...EMPTY_USER })}>
          + Nuevo usuario
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.usuario}</td>
                <td>{u.nombre_completo}</td>
                <td>{ROLE_LABELS[u.rol] || u.rol}</td>
                <td>
                  {u.activo ? (
                    <span className="badge badge-success">Activo</span>
                  ) : (
                    <span className="badge badge-muted">Inactivo</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalUser({ ...u, username: u.usuario, password: '' })}>
                      Editar
                    </button>
                    {u.id !== currentUser.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => deactivateUser(u.id)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <UserModal user={modalUser} onClose={() => setModalUser(null)} onSave={saveUser} />
      )}
    </Layout>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user);
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        {!form.id && (
          <div className="form-group">
            <label>Usuario (para iniciar sesión)</label>
            <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)} autoFocus />
          </div>
        )}
        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" value={form.nombre_completo} onChange={(e) => set('nombre_completo', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Nivel de usuario</label>
            <select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
              <option value="cajero">Cajero (solo punto de venta y clientes)</option>
              <option value="supervisor">Supervisor (+ inventario y reportes)</option>
              <option value="administrador">Administrador (acceso total)</option>
            </select>
          </div>
          {form.id && (
            <div className="form-group">
              <label>Estado</label>
              <select value={form.activo ? '1' : '0'} onChange={(e) => set('activo', e.target.value === '1')}>
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
          )}
        </div>
        <div className="form-group">
          <label>{form.id ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</label>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
