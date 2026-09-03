import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';

const EMPTY_PROMO = {
  id: null,
  producto_id: '',
  tipo: 'porcentaje',
  valor: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: new Date().toISOString().slice(0, 10),
};

export default function Promotions() {
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [modalPromo, setModalPromo] = useState(null);

  useEffect(() => {
    loadPromos();
    loadProducts();
  }, []);

  async function loadPromos() {
    const res = await api.get('/promotions');
    setPromos(res.data);
  }

  async function loadProducts() {
    const res = await api.get('/products');
    setProducts(res.data);
  }

  async function savePromo(promo) {
    setError('');
    try {
      const payload = { ...promo, producto_id: Number(promo.producto_id), valor: Number(promo.valor) };
      if (promo.id) {
        await api.put(`/promotions/${promo.id}`, payload);
      } else {
        await api.post('/promotions', payload);
      }
      setModalPromo(null);
      loadPromos();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la promoción');
    }
  }

  async function togglePromo(promo) {
    await api.put(`/promotions/${promo.id}`, { activo: promo.activo ? 0 : 1 });
    loadPromos();
  }

  async function deletePromo(id) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await api.delete(`/promotions/${id}`);
    loadPromos();
  }

  function estadoPromo(p) {
    const hoy = new Date().toISOString().slice(0, 10);
    if (!p.activo) return { label: 'Inactiva', className: 'badge-muted' };
    if (p.vigente_hoy) return { label: 'Vigente hoy', className: 'badge-success' };
    if (p.fecha_fin < hoy) return { label: 'Vencida', className: 'badge-muted' };
    return { label: 'Programada', className: 'badge-warning' };
  }

  return (
    <Layout title="Promociones">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="toolbar">
        <p className="text-muted" style={{ margin: 0 }}>
          Rebajas automáticas por producto: se aplican solas en el POS mientras estén vigentes.
        </p>
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setModalPromo({ ...EMPTY_PROMO })}>
          + Nueva promoción
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Rebaja</th>
              <th>Precio con promo</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => {
              const estado = estadoPromo(p);
              const precioPromo = p.tipo === 'precio_fijo'
                ? p.valor
                : Math.round(p.precio_venta * (1 - p.valor / 100) * 100) / 100;
              return (
                <tr key={p.id}>
                  <td>{p.producto_nombre}</td>
                  <td>{p.tipo === 'porcentaje' ? `${p.valor}%` : `Precio fijo ${formatCurrency(p.valor)}`}</td>
                  <td>
                    {formatCurrency(precioPromo)}{' '}
                    <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                      {formatCurrency(p.precio_venta)}
                    </span>
                  </td>
                  <td>{p.fecha_inicio} a {p.fecha_fin}</td>
                  <td>
                    <span className={'badge ' + estado.className}>{estado.label}</span>
                  </td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModalPromo(p)}>Editar</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => togglePromo(p)}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deletePromo(p.id)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {promos.length === 0 && (
              <tr><td colSpan={6} className="empty-state">No hay promociones creadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalPromo && (
        <PromoModal promo={modalPromo} products={products} onClose={() => setModalPromo(null)} onSave={savePromo} />
      )}
    </Layout>
  );
}

function PromoModal({ promo, products, onClose, onSave }) {
  const [form, setForm] = useState(promo);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const productoSeleccionado = products.find((p) => String(p.id) === String(form.producto_id));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar promoción' : 'Nueva promoción'}</h2>
        <div className="form-group">
          <label>Producto</label>
          <select value={form.producto_id} onChange={(e) => set('producto_id', e.target.value)} autoFocus disabled={!!form.id}>
            <option value="">Elegí un producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} ({formatCurrency(p.precio_venta)})</option>
            ))}
          </select>
          {productoSeleccionado && (
            <small className="text-muted">Precio normal: {formatCurrency(productoSeleccionado.precio_venta)}</small>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de rebaja</label>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="precio_fijo">Precio fijo (₡)</option>
            </select>
          </div>
          <div className="form-group">
            <label>{form.tipo === 'porcentaje' ? 'Porcentaje de descuento' : 'Precio promocional'}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={form.tipo === 'porcentaje' ? 99 : undefined}
              value={form.valor}
              onChange={(e) => set('valor', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha de inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Fecha de fin</label>
            <input type="date" value={form.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
