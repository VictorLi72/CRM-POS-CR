import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: '🏠', roles: ['administrador', 'supervisor', 'cajero'], end: true },
  { to: '/pos', label: 'Punto de Venta', icon: '🧾', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/inventory', label: 'Inventario', icon: '📦', roles: ['administrador', 'supervisor'] },
  { to: '/customers', label: 'Clientes', icon: '👥', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/returns', label: 'Devoluciones', icon: '↩️', roles: ['administrador', 'supervisor'] },
  { to: '/sales-history', label: 'Historial de ventas', icon: '📜', roles: ['administrador', 'supervisor'] },
  { to: '/cash-register', label: 'Cierre de caja', icon: '🗄️', roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/reports', label: 'Reportes', icon: '📊', roles: ['administrador', 'supervisor'] },
  { to: '/promotions', label: 'Promociones', icon: '🏷️', roles: ['administrador', 'supervisor'] },
  { to: '/tax-discounts', label: 'IVA y Descuentos', icon: '💲', roles: ['administrador'] },
  { to: '/users', label: 'Usuarios', icon: '🔑', roles: ['administrador'] },
  { to: '/settings', label: 'Configuración', icon: '⚙️', roles: ['administrador', 'supervisor', 'cajero'] },
];

const ROLE_LABELS = { administrador: 'Administrador', supervisor: 'Supervisor', cajero: 'Cajero' };

export default function Layout({ title, topbarExtra, children }) {
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
          <span className="sidebar-brand-subtitle">Punto de Venta &amp; Gestión</span>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              title={item.label}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            <div className="sidebar-user">{user?.nombre_completo}</div>
            <div className="sidebar-role">{ROLE_LABELS[user?.rol] || user?.rol}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <span className="logout-btn-label">Cerrar sesión</span>
            <span className="logout-btn-icon">⏻</span>
          </button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <h1>{title}</h1>
          {topbarExtra}
          {(user?.rol === 'administrador' || user?.rol === 'supervisor') && <LowStockBell />}
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

const LOW_STOCK_POLL_MS = 90000;

function LowStockBell() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
    const interval = setInterval(load, LOW_STOCK_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function load() {
    try {
      const res = await api.get('/products', { params: { lowStock: true } });
      setProducts(res.data);
    } catch (err) {
      // silencioso: la campana es informativa, no bloquea el resto de la app
    }
  }

  function verInventario() {
    setOpen(false);
    navigate('/inventory', { state: { lowStockOnly: true } });
  }

  const count = products.length;

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones de stock bajo"
      >
        🔔
        {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Stock bajo</div>
          {count === 0 ? (
            <div className="notif-dropdown-empty">Todo el inventario está en niveles normales.</div>
          ) : (
            <>
              <ul className="notif-dropdown-list">
                {products.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <span>{p.nombre}</span>
                    <span className="text-muted">{p.existencia} / {p.existencia_minima} {p.unidad_medida}</span>
                  </li>
                ))}
              </ul>
              {count > 6 && <div className="notif-dropdown-more">y {count - 6} más...</div>}
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={verInventario}>
                Ver todo en inventario
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
