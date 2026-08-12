import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/pos', label: 'Punto de Venta', icon: '🧾', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/inventory', label: 'Inventario', icon: '📦', roles: ['administrador', 'supervisor'] },
  { to: '/customers', label: 'Clientes', icon: '👥', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/returns', label: 'Devoluciones', icon: '↩️', roles: ['administrador', 'supervisor'] },
  { to: '/cash-register', label: 'Cierre de caja', icon: '🗄️', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/reports', label: 'Reportes', icon: '📊', roles: ['administrador', 'supervisor'] },
  { to: '/users', label: 'Usuarios', icon: '🔑', roles: ['administrador'] },
  { to: '/settings', label: 'Configuración', icon: '⚙️', roles: ['administrador', 'supervisor', 'cajero'] },
];

const ROLE_LABELS = { administrador: 'Administrador', supervisor: 'Supervisor', cajero: 'Cajero' };

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          CRM Super CR
          <span>Punto de Venta &amp; Gestión</span>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.nombre_completo}</div>
          <div className="sidebar-role">{ROLE_LABELS[user?.rol] || user?.rol}</div>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <h1>{title}</h1>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
