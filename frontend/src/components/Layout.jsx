import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client';
import { getA11y, setA11y } from '../utils/a11y.js';
import AppLogo from './AppLogo.jsx';
import {
  IconHome, IconPOS, IconPackage, IconUsers, IconClipboard,
  IconCart, IconRotateCCW, IconClock, IconWallet, IconBarChart,
  IconTag, IconPercent, IconKey, IconSettings, IconBell, IconLogOut,
  IconSmartphone, IconMenu, IconX, IconA11y,
} from './Icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio',            Icon: IconHome,      roles: ['administrador', 'supervisor', 'cajero'], end: true },
  { to: '/pos', label: 'Punto de Venta', Icon: IconPOS,       roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/inventory', label: 'Inventario', Icon: IconPackage,  roles: ['administrador', 'supervisor'] },
  { to: '/customers', label: 'Clientes',   Icon: IconUsers,    roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/orders', label: 'Pedidos',       Icon: IconClipboard,roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/purchase-orders', label: 'Órdenes de compra', Icon: IconCart, roles: ['administrador', 'supervisor'] },
  { to: '/returns', label: 'Devoluciones', Icon: IconRotateCCW,roles: ['administrador', 'supervisor'] },
  { to: '/sales-history', label: 'Historial de ventas', Icon: IconClock, roles: ['administrador', 'supervisor'] },
  { to: '/cash-register', label: 'Cierre de caja', Icon: IconWallet, roles: ['administrador', 'supervisor', 'cajero'] },
  { to: '/reports', label: 'Reportes',    Icon: IconBarChart,  roles: ['administrador', 'supervisor'] },
  { to: '/promotions', label: 'Promociones', Icon: IconTag,    roles: ['administrador', 'supervisor'] },
  { to: '/tax-discounts', label: 'IVA y Descuentos', Icon: IconPercent, roles: ['administrador'] },
  { to: '/users', label: 'Usuarios',      Icon: IconKey,       roles: ['administrador'] },
  { to: '/mobile-access', label: 'Acceso móvil', Icon: IconSmartphone, roles: ['administrador', 'supervisor'] },
  { to: '/settings', label: 'Configuración', Icon: IconSettings, roles: ['administrador', 'supervisor', 'cajero'] },
];

const ROLE_LABELS = { administrador: 'Administrador', supervisor: 'Supervisor', cajero: 'Cajero' };

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
        background: checked ? 'var(--color-primary)' : 'var(--color-border)',
        position: 'relative', transition: 'background var(--transition)',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 19 : 3,
        transition: 'left var(--transition)',
        boxShadow: '0 1px 3px rgba(0,0,0,.18)',
      }} />
    </div>
  );
}

function AccessibilityButton() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(getA11y);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function set(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setA11y(next);
  }

  const TEMAS = [
    { val: 'light', label: '☀ Claro' },
    { val: 'system', label: '⊙ Auto' },
    { val: 'dark', label: '☾ Oscuro' },
  ];
  const FUENTES = [
    { val: 'sm', size: 10 },
    { val: 'md', size: 13 },
    { val: 'lg', size: 16 },
    { val: 'xl', size: 19 },
  ];

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={() => setOpen((v) => !v)}
        aria-label="Accesibilidad"
        title="Accesibilidad"
      >
        <IconA11y size={16} />
      </button>
      {open && (
        <div className="notif-dropdown" style={{ width: 232, padding: '12px 14px' }}>
          <div className="notif-dropdown-header">Accesibilidad</div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Tema</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {TEMAS.map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('tema', val)}
                  style={{
                    flex: 1, padding: '5px 2px', fontSize: 11,
                    border: '1.5px solid',
                    borderColor: prefs.tema === val ? 'var(--color-primary)' : 'var(--color-border)',
                    borderRadius: 6,
                    background: prefs.tema === val ? 'var(--color-primary-light)' : 'transparent',
                    color: prefs.tema === val ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', fontWeight: prefs.tema === val ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Tamaño de texto</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {FUENTES.map(({ val, size }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('fuente', val)}
                  style={{
                    flex: 1, padding: '6px 0', fontSize: size, fontWeight: 700, lineHeight: 1,
                    border: '1.5px solid',
                    borderColor: prefs.fuente === val ? 'var(--color-primary)' : 'var(--color-border)',
                    borderRadius: 6,
                    background: prefs.fuente === val ? 'var(--color-primary-light)' : 'transparent',
                    color: prefs.fuente === val ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  A
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Alto contraste</span>
              <ToggleSwitch checked={prefs.contraste} onChange={(v) => set('contraste', v)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Animaciones</span>
              <ToggleSwitch checked={prefs.movimiento} onChange={(v) => set('movimiento', v)} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ title, topbarExtra, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeMenu() { setMenuOpen(false); }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.rol));

  return (
    <div className="app-shell">
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AppLogo size={34} />
            <div>
              <div className="sidebar-brand-name">CRM Super CR</div>
              <span className="sidebar-brand-subtitle">Punto de Venta &amp; Gestión</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
              title={item.label}
              onClick={closeMenu}
            >
              <span className="sidebar-link-icon">
                <item.Icon size={16} />
              </span>
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
            <span className="logout-btn-icon"><IconLogOut size={15} /></span>
          </button>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
              {menuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
            <h1>{title}</h1>
          </div>
          <div className="topbar-right">
            {topbarExtra}
            <AccessibilityButton />
            {(user?.rol === 'administrador' || user?.rol === 'supervisor') && <LowStockBell />}
          </div>
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
    } catch {
      // silencioso: la campana es informativa
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
        aria-label={`Notificaciones de stock bajo${count > 0 ? ` (${count})` : ''}`}
      >
        <IconBell size={16} />
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
