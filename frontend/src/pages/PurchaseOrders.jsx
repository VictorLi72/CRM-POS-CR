import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';

const ESTADO_BADGE = {
  borrador:  'badge-muted',
  enviada:   'badge-accent',
  recibida:  'badge-success',
  cancelada: 'badge-danger',
};
const ESTADO_LABEL = {
  borrador:  'Borrador',
  enviada:   'Enviada',
  recibida:  'Recibida',
  cancelada: 'Cancelada',
};

export default function PurchaseOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitialItems, setFormInitialItems] = useState(null);
  const [showProveedores, setShowProveedores] = useState(false);

  useEffect(() => {
    load();
    if (location.state?.newOrder) {
      setFormInitialItems(location.state.items || null);
      setShowForm(true);
      window.history.replaceState({}, '');
    }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/ordenes-compra');
      setOrders(res.data);
    } catch {
      setError('No se pudo cargar las órdenes de compra');
    } finally {
      setLoading(false);
    }
  }

  function onSaved(orden) {
    setShowForm(false);
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === orden.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = orden; return next; }
      return [orden, ...prev];
    });
  }

  async function cambiarEstado(id, estado) {
    try {
      const res = await api.patch(`/ordenes-compra/${id}/estado`, null, { params: { estado } });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, estado: res.data.estado } : o));
      setSelected(null);
    } catch {
      alert('No se pudo actualizar el estado');
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar esta orden?')) return;
    try {
      await api.delete(`/ordenes-compra/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelected(null);
    } catch {
      alert('No se pudo eliminar la orden');
    }
  }

  return (
    <Layout title="Órdenes de compra">
      <div className="toolbar">
        <div />
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={() => setShowProveedores(true)}>
            🏭 Proveedores
          </button>
          <button className="btn" onClick={() => setShowForm(true)}>
            + Nueva orden
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Proveedor</th>
              <th>Items</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>OC-{String(o.id).padStart(4, '0')}</td>
                <td>{o.proveedor_nombre || <span className="text-muted">Sin proveedor</span>}</td>
                <td className="text-muted">—</td>
                <td className="text-right">{formatCurrency(o.total)}</td>
                <td>
                  <span className={`badge ${ESTADO_BADGE[o.estado] || 'badge-muted'}`}>
                    {ESTADO_LABEL[o.estado] || o.estado}
                  </span>
                </td>
                <td className="text-muted">{formatDate(o.creado_en)}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelected(o)}>Ver</button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No hay órdenes de compra. Creá una desde aquí o desde el inventario → Lista de compras.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailModal
          orderId={selected.id}
          onClose={() => setSelected(null)}
          onEstado={cambiarEstado}
          onEliminar={eliminar}
        />
      )}

      {showForm && (
        <OrderFormModal
          onClose={() => { setShowForm(false); setFormInitialItems(null); }}
          onSaved={onSaved}
          initialItems={formInitialItems}
        />
      )}

      {showProveedores && (
        <ProveedoresModal onClose={() => setShowProveedores(false)} />
      )}
    </Layout>
  );
}

function OrderDetailModal({ orderId, onClose, onEstado, onEliminar }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/ordenes-compra/${orderId}`).then((r) => setOrder(r.data)).catch(() => {});
  }, [orderId]);

  if (!order) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p className="text-muted">Cargando...</p>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 580 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 style={{ margin: 0 }}>OC-{String(order.id).padStart(4, '0')}</h2>
          <span className={`badge ${ESTADO_BADGE[order.estado]}`}>{ESTADO_LABEL[order.estado]}</span>
        </div>
        <p className="text-muted" style={{ marginTop: 4, marginBottom: 16 }}>
          {formatDate(order.creado_en)} · {order.cajero_nombre}
          {order.proveedor_nombre && ` · ${order.proveedor_nombre}`}
        </p>

        {order.notas && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>📝 {order.notas}</div>
        )}

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="text-right">Cantidad</th>
              <th className="text-right">Precio unit.</th>
              <th className="text-right">Total</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it) => (
              <tr key={it.id}>
                <td>{it.producto_nombre}</td>
                <td className="text-right">{it.cantidad}</td>
                <td className="text-right">{it.precio_unitario > 0 ? formatCurrency(it.precio_unitario) : '—'}</td>
                <td className="text-right">{it.total > 0 ? formatCurrency(it.total) : '—'}</td>
                <td className="text-muted" style={{ fontSize: 12 }}>{it.nota || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.total > 0 && (
          <div className="flex justify-between" style={{ marginTop: 12, fontWeight: 700, fontSize: 15 }}>
            <span>Total estimado</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {order.estado !== 'cancelada' && order.estado !== 'recibida' && (
            <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto', order: -1 }}
              onClick={() => cambiarYCerrar('cancelada')}>
              Cancelar orden
            </button>
          )}
          {order.estado === 'borrador' && (
            <button className="btn btn-secondary" onClick={() => onEliminar(order.id)}>Eliminar</button>
          )}
          {order.estado === 'borrador' && (
            <button className="btn" onClick={() => cambiarYCerrar('enviada')}>Marcar como enviada</button>
          )}
          {order.estado === 'enviada' && (
            <button className="btn" onClick={() => cambiarYCerrar('recibida')}>Marcar como recibida</button>
          )}
        </div>
      </div>
    </div>
  );

  function cambiarYCerrar(estado) {
    onEstado(order.id, estado);
  }
}

function OrderFormModal({ onClose, onSaved, initialItems }) {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState(
    initialItems || [{ productoNombre: '', cantidad: '1', precioUnitario: '', nota: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/proveedores').then((r) => setProveedores(r.data)).catch(() => {});
  }, []);

  function updateItem(i, field, value) {
    setItems((prev) => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  }
  function addItem() {
    setItems((prev) => [...prev, { productoNombre: '', cantidad: '1', precioUnitario: '', nota: '' }]);
  }
  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((acc, it) => acc + (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnitario) || 0), 0);

  async function handleSave(e) {
    e.preventDefault();
    if (items.some((it) => !it.productoNombre.trim())) {
      setError('Todos los ítems deben tener nombre');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        proveedorId: proveedorId ? Number(proveedorId) : null,
        notas: notas || null,
        items: items.map((it) => ({
          productoNombre: it.productoNombre,
          cantidad: parseFloat(it.cantidad) || 1,
          precioUnitario: parseFloat(it.precioUnitario) || 0,
          nota: it.nota || null,
        })),
      };
      const res = await api.post('/ordenes-compra', body);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la orden');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 680, maxWidth: '96vw' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Nueva orden de compra</h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Proveedor</label>
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Notas</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Entrega estimada, condiciones, etc." />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ítems a pedir
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  {idx === 0 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>Producto</div>}
                  <input type="text" value={it.productoNombre}
                    onChange={(e) => updateItem(idx, 'productoNombre', e.target.value)}
                    placeholder="Nombre del producto" />
                </div>
                <div>
                  {idx === 0 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>Cant.</div>}
                  <input type="number" min="0.001" step="any" value={it.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', e.target.value)} />
                </div>
                <div>
                  {idx === 0 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>Precio unit.</div>}
                  <input type="number" min="0" step="any" value={it.precioUnitario}
                    onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)} placeholder="0" />
                </div>
                <div>
                  {idx === 0 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>Nota</div>}
                  <input type="text" value={it.nota}
                    onChange={(e) => updateItem(idx, 'nota', e.target.value)} placeholder="Opcional" />
                </div>
                <button type="button" className="icon-btn" onClick={() => removeItem(idx)}
                  style={{ marginTop: idx === 0 ? 18 : 0 }}>✕</button>
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Agregar ítem</button>

          {total > 0 && (
            <div className="flex justify-between" style={{ marginTop: 12, fontWeight: 700 }}>
              <span>Total estimado</span><span>{formatCurrency(total)}</span>
            </div>
          )}

          {error && <div className="alert alert-danger" style={{ marginTop: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProveedoresModal({ onClose }) {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadProveedores(); }, []);

  async function loadProveedores() {
    const res = await api.get('/proveedores');
    setProveedores(res.data);
  }

  function startNew() {
    setForm({ nombre: '', contacto: '', telefono: '', email: '', notas: '' });
  }

  function startEdit(p) {
    setForm({ id: p.id, nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', notas: p.notas || '' });
  }

  async function save(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await api.put(`/proveedores/${form.id}`, form);
      } else {
        await api.post('/proveedores', form);
      }
      setForm(null);
      loadProveedores();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Desactivar este proveedor?')) return;
    await api.delete(`/proveedores/${id}`);
    loadProveedores();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Proveedores</h2>
          {!form && <button className="btn btn-sm" onClick={startNew}>+ Nuevo</button>}
        </div>

        {form && (
          <form onSubmit={save} style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} autoFocus />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Contacto</label>
                <input type="text" value={form.contacto} onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))} placeholder="Nombre del contacto" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Correo</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label>Notas</label>
                <input type="text" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="flex gap-8">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn btn-sm" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        )}

        {proveedores.length === 0 && !form && (
          <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No hay proveedores registrados.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {proveedores.map((p) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-alt)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {[p.contacto, p.telefono, p.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>Editar</button>
              <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)}>Borrar</button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

