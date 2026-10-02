import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function ListaCompras() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const d = params.get('d');
    const f = params.get('f');
    if (f) setFecha(decodeURIComponent(f));
    if (d) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(d))));
        setItems(decoded);
      } catch {
        // datos inválidos
      }
    }
  }, [location.search]);

  function toggle(idx) {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const pendientes = items.filter((_, i) => !checked[i]).length;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#f1f5f9',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        background: '#0f1923',
        padding: '20px 16px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 2 }}>CRM Super CR</div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 700 }}>Lista de compras</h1>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          {fecha && <span>{fecha} · </span>}
          {pendientes === 0 && items.length > 0
            ? <span style={{ color: '#10b981' }}>✓ Todo conseguido</span>
            : <span>{pendientes} de {items.length} pendiente{pendientes !== 1 ? 's' : ''}</span>
          }
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: 520, margin: '0 auto' }}>
        {items.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 14, padding: '40px 24px', textAlign: 'center',
            color: '#94a3b8', marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
            Lista vacía o enlace inválido.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((it, idx) => (
              <div
                key={idx}
                onClick={() => toggle(idx)}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  opacity: checked[idx] ? 0.45 : 1,
                  transition: 'opacity 0.2s',
                  userSelect: 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  border: checked[idx] ? 'none' : '2px solid #cbd5e1',
                  background: checked[idx] ? '#10b981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {checked[idx] && <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>✓</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 16, color: '#0f1923',
                    textDecoration: checked[idx] ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {it.n}
                  </div>
                  {it.nota && (
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                      {it.nota}
                    </div>
                  )}
                </div>

                {/* Cantidad */}
                <div style={{
                  flexShrink: 0,
                  background: checked[idx] ? '#f1f5f9' : '#f0fdf4',
                  color: checked[idx] ? '#94a3b8' : '#059669',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 14, fontWeight: 700,
                }}>
                  {it.c} <span style={{ fontWeight: 400, fontSize: 12 }}>{it.u}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && pendientes === 0 && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 14, padding: '16px', textAlign: 'center',
            color: '#059669', fontWeight: 600, marginTop: 16,
          }}>
            🎉 ¡Lista completada!
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
