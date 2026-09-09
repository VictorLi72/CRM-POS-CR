import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

const ACCESOS = [
  { to: '/pos',          icon: '🧾', label: 'Punto de Venta',     desc: 'Registrar ventas',         color: '#1e6f5c', roles: ['administrador','supervisor','cajero'] },
  { to: '/inventory',    icon: '📦', label: 'Inventario',          desc: 'Productos y stock',        color: '#2563eb', roles: ['administrador','supervisor'] },
  { to: '/customers',    icon: '👥', label: 'Clientes',            desc: 'Base de clientes',         color: '#7c3aed', roles: ['administrador','supervisor','cajero'] },
  { to: '/reports',      icon: '📊', label: 'Reportes',            desc: 'Ventas y estadísticas',    color: '#b45309', roles: ['administrador','supervisor'] },
  { to: '/promotions',   icon: '🏷️', label: 'Promociones',         desc: 'Rebajas automáticas',      color: '#0f766e', roles: ['administrador','supervisor'] },
  { to: '/cash-register',icon: '🗄️', label: 'Cierre de caja',     desc: 'Turno y corte',            color: '#6b7280', roles: ['administrador','supervisor','cajero'] },
  { to: '/sales-history',icon: '📜', label: 'Historial de ventas', desc: 'Consultar tiquetes',       color: '#0369a1', roles: ['administrador','supervisor'] },
  { to: '/returns',      icon: '↩️', label: 'Devoluciones',        desc: 'Anular o revertir',        color: '#c2410c', roles: ['administrador','supervisor'] },
];

function saludo(nombre) {
  const h = new Date().getHours();
  const turno = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  return `${turno}, ${nombre.split(' ')[0]}`;
}

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ahora = useReloj();

  const [resumen, setResumen] = useState(null);
  const [stockBajo, setStockBajo] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [rResumen, rStock] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/products', { params: { lowStock: true } }),
        ]);
        setResumen(rResumen.data);
        setStockBajo(rStock.data.length);
      } catch {
        // no bloquea la pantalla si falla
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const accesosVisibles = ACCESOS.filter(a => a.roles.includes(user?.rol));

  const fecha = ahora.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora  = ahora.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout title="Inicio">
      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #14202b 0%, #1e3a2f 60%, #1e6f5c 100%)',
        borderRadius: 12,
        padding: '28px 32px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decoración geométrica */}
        <div style={{ position:'absolute', right:0, top:0, width:220, height:'100%', opacity:0.06,
          background:'radial-gradient(circle at 80% 50%, #fff 0%, transparent 70%)' }} />
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'capitalize' }}>
            {fecha}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {saludo(user?.nombre_completo || 'Usuario')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            {user?.rol?.charAt(0).toUpperCase() + user?.rol?.slice(1)} · CRM Super CR
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 36, fontWeight: 300, lineHeight: 1, letterSpacing: '-1px' }}>{hora}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>hora local</div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Ventas hoy"
          value={cargando ? '…' : formatCurrency(resumen?.ventas_hoy ?? 0)}
          sub={cargando ? '' : `${resumen?.tiquetes_hoy ?? 0} tiquete${resumen?.tiquetes_hoy !== 1 ? 's' : ''}`}
          accentColor="#1e6f5c"
          icon="💰"
        />
        <StatCard
          label="Ventas del mes"
          value={cargando ? '…' : formatCurrency(resumen?.ventas_mes ?? 0)}
          sub={cargando ? '' : `${resumen?.tiquetes_mes ?? 0} tiquete${resumen?.tiquetes_mes !== 1 ? 's' : ''}`}
          accentColor="#2563eb"
          icon="📈"
        />
        <StatCard
          label="Stock bajo"
          value={cargando ? '…' : stockBajo}
          sub={stockBajo > 0 ? 'requiere atención' : 'todo en orden'}
          accentColor={stockBajo > 0 ? '#d64545' : '#1e8e5a'}
          icon={stockBajo > 0 ? '⚠️' : '✅'}
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          label="Fiado pendiente"
          value={cargando ? '…' : formatCurrency(resumen?.fiado_pendiente ?? 0)}
          sub="por cobrar"
          accentColor="#b45309"
          icon="📋"
          onClick={() => navigate('/customers')}
        />
      </div>

      {/* ── Accesos rápidos ── */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesos rápidos
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {accesosVisibles.map(a => (
            <AccesoCard key={a.to} {...a} onClick={() => navigate(a.to)} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub, accentColor, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(16,24,32,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.12s, transform 0.12s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow='0 4px 14px rgba(16,24,32,0.1)'; e.currentTarget.style.transform='translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 3px rgba(16,24,32,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}
    >
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background: accentColor, borderRadius:'10px 0 0 10px' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
          {label}
        </span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color:'var(--color-text-muted)' }}>{sub}</div>
    </div>
  );
}

function AccesoCard({ icon, label, desc, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        padding: '18px 16px',
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.12s ease',
        boxShadow: '0 1px 3px rgba(16,24,32,0.05)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 4px 14px rgba(16,24,32,0.10)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,24,32,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>{desc}</div>
      </div>
    </button>
  );
}
