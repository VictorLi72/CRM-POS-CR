import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const ESTADO_BADGE = {
  pendiente: 'badge-warning',
  listo:     'badge-accent',
  entregado: 'badge-success',
  cancelado: 'badge-danger',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  listo:     'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [filtroEstado]);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const res = await api.get('/pedidos', { params });
      setOrders(res.data);
    } catch {
      setError('No se pudo cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }

  function openNew() { setEditOrder(null); setShowForm(true); }
  function openEdit(o) { setEditOrder(o); setShowForm(true); setSelected(null); }
  function openDetail(o) { setSelected(o); }

  function onSaved(order) {
    setShowForm(false);
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = order; return next; }
      return [order, ...prev];
    });
  }

  async function cambiarEstado(id, estado) {
    try {
      const res = await api.patch(`/pedidos/${id}/estado`, null, { params: { estado } });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, estado: res.data.estado } : o));
      if (selected?.id === id) setSelected((prev) => ({ ...prev, estado: res.data.estado }));
    } catch {
      alert('No se pudo actualizar el estado');
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este pedido?')) return;
    try {
      await api.delete(`/pedidos/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelected(null);
    } catch {
      alert('No se pudo eliminar el pedido');
    }
  }

  return (
    <Layout title="Pedidos">
      <div className="toolbar">
        <div className="flex gap-8 items-center">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              className={`btn btn-sm ${filtroEstado === e.value ? '' : 'btn-secondary'}`}
              onClick={() => setFiltroEstado(e.value)}
            >
              {e.label}
            </button>
          ))}
        </div>
        <button className="btn" onClick={openNew}>+ Nuevo pedido</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Teléfono</th>
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
                <td style={{ fontWeight: 600 }}>P-{String(o.id).padStart(4, '0')}</td>
                <td>{o.cliente_nombre || <span className="text-muted">Sin cliente</span>}</td>
                <td>{o.cliente_telefono || '—'}</td>
                <td className="text-muted">—</td>
                <td className="text-right">{formatCurrency(o.total)}</td>
                <td>
                  <span className={`badge ${ESTADO_BADGE[o.estado] || 'badge-muted'}`}>
                    {ESTADO_LABELS[o.estado] || o.estado}
                  </span>
                </td>
                <td className="text-muted">{formatDate(o.creado_en)}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetail(o)}>Ver</button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">No hay pedidos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailModal
          orderId={selected.id}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onEstado={cambiarEstado}
          onEliminar={eliminar}
        />
      )}

      {showForm && (
        <OrderFormModal
          order={editOrder}
          onClose={() => setShowForm(false)}
          onSaved={onSaved}
        />
      )}
    </Layout>
  );
}

function OrderDetailModal({ orderId, onClose, onEdit, onEstado, onEliminar }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pedidos/${orderId}`)
      .then((r) => setOrder(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading || !order) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <p className="text-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  const siguienteEstado = {
    pendiente: 'listo',
    listo: 'entregado',
  }[order.estado];

  const siguienteLabel = {
    pendiente: 'Marcar como listo',
    listo: 'Marcar como entregado',
  }[order.estado];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2>Pedido P-{String(order.id).padStart(4, '0')}</h2>
          <span className={`badge ${ESTADO_BADGE[order.estado] || 'badge-muted'}`}>
            {ESTADO_LABELS[order.estado] || order.estado}
          </span>
        </div>
        <p className="text-muted" style={{ marginTop: 0 }}>
          {formatDate(order.creado_en)} · Creado por: {order.cajero_nombre}
        </p>

        {(order.cliente_nombre || order.cliente_telefono) && (
          <div style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{order.cliente_nombre || 'Sin nombre'}</div>
            {order.cliente_telefono && <div className="text-muted">{order.cliente_telefono}</div>}
          </div>
        )}

        {order.notas && (
          <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
            📝 {order.notas}
          </div>
        )}

        {order.items && order.items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">Precio</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.producto_nombre}</td>
                  <td className="text-right">{it.cantidad}</td>
                  <td className="text-right">{formatCurrency(it.precio_unitario)}</td>
                  <td className="text-right">{formatCurrency(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-between" style={{ marginTop: 12, fontWeight: 700, fontSize: 16 }}>
          <span>Total estimado</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {order.estado !== 'entregado' && order.estado !== 'cancelado' && (
            <button className="btn btn-secondary" onClick={() => onEliminar(order.id)}>Eliminar</button>
          )}
          {order.estado !== 'entregado' && order.estado !== 'cancelado' && (
            <button className="btn btn-secondary" onClick={onEdit}>Editar</button>
          )}
          {order.estado !== 'cancelado' && order.estado !== 'entregado' && (
            <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto', order: -1 }}
              onClick={() => { onEstado(order.id, 'cancelado'); onClose(); }}>
              Cancelar pedido
            </button>
          )}
          {siguienteEstado && (
            <button className="btn" onClick={() => { onEstado(order.id, siguienteEstado); onClose(); }}>
              {siguienteLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderFormModal({ order, onClose, onSaved }) {
  const [clienteNombre, setClienteNombre] = useState(order?.cliente_nombre || '');
  const [clienteTelefono, setClienteTelefono] = useState(order?.cliente_telefono || '');
  const [notas, setNotas] = useState(order?.notas || '');
  const [items, setItems] = useState(
    order?.items?.map((i) => ({
      productoId: i.producto_id || '',
      productoNombre: i.producto_nombre || '',
      cantidad: String(i.cantidad),
      precioUnitario: String(i.precio_unitario),
    })) || [{ productoId: '', productoNombre: '', cantidad: '1', precioUnitario: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get('/products').then((r) => setProductos(r.data)).catch(() => {});
  }, []);

  function addItem() {
    setItems((prev) => [...prev, { productoId: '', productoNombre: '', cantidad: '1', precioUnitario: '' }]);
  }

  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'productoId' && value) {
        const p = productos.find((pr) => String(pr.id) === String(value));
        if (p) {
          next[i].productoNombre = p.nombre;
          next[i].precioUnitario = String(p.precio_venta || p.precio || '');
        }
      }
      return next;
    });
  }

  const total = items.reduce((acc, it) => {
    const cant = parseFloat(it.cantidad) || 0;
    const precio = parseFloat(it.precioUnitario) || 0;
    return acc + cant * precio;
  }, 0);

  async function handleSave(e) {
    e.preventDefault();
    if (items.some((it) => !it.productoNombre.trim())) {
      setError('Todos los items deben tener nombre'); return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        clienteNombre: clienteNombre || null,
        clienteTelefono: clienteTelefono || null,
        notas: notas || null,
        items: items.map((it) => ({
          productoId: it.productoId ? Number(it.productoId) : null,
          productoNombre: it.productoNombre,
          cantidad: parseFloat(it.cantidad) || 1,
          precioUnitario: parseFloat(it.precioUnitario) || 0,
        })),
      };
      let res;
      if (order?.id) {
        res = await api.put(`/pedidos/${order.id}`, body);
      } else {
        res = await api.post('/pedidos', body);
      }
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el pedido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 600 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{order ? 'Editar pedido' : 'Nuevo pedido'}</h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Nombre del cliente</label>
              <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Teléfono</label>
              <input type="tel" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="form-group">
            <label>Notas / observaciones</label>
            <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: entregar el miércoles, sin IVA, etc." />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Items del pedido
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  {idx === 0 && <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Producto</label>}
                  <select
                    value={it.productoId}
                    onChange={(e) => updateItem(idx, 'productoId', e.target.value)}
                    style={{ marginBottom: 4 }}
                  >
                    <option value="">— Seleccionar —</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={it.productoNombre}
                    onChange={(e) => updateItem(idx, 'productoNombre', e.target.value)}
                    placeholder="O escribir nombre"
                  />
                </div>
                <div>
                  {idx === 0 && <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Cantidad</label>}
                  <input type="number" min="0.001" step="any" value={it.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', e.target.value)} />
                </div>
                <div>
                  {idx === 0 && <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Precio</label>}
                  <input type="number" min="0" step="any" value={it.precioUnitario}
                    onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)} placeholder="0" />
                </div>
                <button type="button" className="icon-btn" onClick={() => removeItem(idx)}
                  style={{ marginTop: idx === 0 ? 18 : 0 }}>✕</button>
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Agregar item</button>

          {total > 0 && (
            <div className="flex justify-between" style={{ marginTop: 12, fontWeight: 700 }}>
              <span>Total estimado</span>
              <span>{formatCurrency(total)}</span>
            </div>
          )}

          {error && <div className="alert alert-danger" style={{ marginTop: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Guardando...' : (order ? 'Guardar cambios' : 'Crear pedido')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
