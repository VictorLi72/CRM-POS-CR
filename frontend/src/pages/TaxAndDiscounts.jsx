import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency } from '../utils/format';

export default function TaxAndDiscounts() {
  const [tarifas, setTarifas] = useState([]);
  const [descuentos, setDescuentos] = useState([]);
  const [error, setError] = useState('');
  const [modalTarifa, setModalTarifa] = useState(null);
  const [modalDescuento, setModalDescuento] = useState(null);

  useEffect(() => {
    loadTarifas();
    loadDescuentos();
  }, []);

  async function loadTarifas() {
    const res = await api.get('/tax-rates', { params: { all: true } });
    setTarifas(res.data);
  }

  async function loadDescuentos() {
    const res = await api.get('/discounts', { params: { all: true } });
    setDescuentos(res.data);
  }

  async function guardarTarifa(tarifa) {
    setError('');
    try {
      if (tarifa.id) {
        await api.put(`/tax-rates/${tarifa.id}`, tarifa);
      } else {
        await api.post('/tax-rates', tarifa);
      }
      setModalTarifa(null);
      loadTarifas();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la tarifa');
    }
  }

  async function alternarTarifa(tarifa) {
    await api.put(`/tax-rates/${tarifa.id}`, { activo: tarifa.activo ? 0 : 1 });
    loadTarifas();
  }

  async function guardarDescuento(descuento) {
    setError('');
    try {
      if (descuento.id) {
        await api.put(`/discounts/${descuento.id}`, descuento);
      } else {
        await api.post('/discounts', descuento);
      }
      setModalDescuento(null);
      loadDescuentos();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el descuento');
    }
  }

  async function alternarDescuento(descuento) {
    await api.put(`/discounts/${descuento.id}`, { activo: descuento.activo ? 0 : 1 });
    loadDescuentos();
  }

  return (
    <Layout title="IVA y Descuentos">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="toolbar">
        <h3 className="mt-0" style={{ margin: 0 }}>Tarifas de IVA</h3>
        <button className="btn" onClick={() => setModalTarifa({ id: null, porcentaje: '', nombre: '', activo: true })}>
          + Nueva tarifa
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Porcentaje</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tarifas.map((t) => (
              <tr key={t.id}>
                <td>{t.porcentaje}%</td>
                <td>{t.nombre || '—'}</td>
                <td>
                  <span className={'badge ' + (t.activo ? 'badge-success' : 'badge-muted')}>
                    {t.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalTarifa(t)}>Editar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => alternarTarifa(t)}>
                      {t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tarifas.length === 0 && (
              <tr><td colSpan={4} className="empty-state">No hay tarifas de IVA creadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <h3 className="mt-0" style={{ margin: 0 }}>Descuentos</h3>
        <button className="btn" onClick={() => setModalDescuento({ id: null, nombre: '', tipo: 'porcentaje', valor: '', activo: true })}>
          + Nuevo descuento
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {descuentos.map((d) => (
              <tr key={d.id}>
                <td>{d.nombre}</td>
                <td>{d.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}</td>
                <td>{d.tipo === 'porcentaje' ? `${d.valor}%` : formatCurrency(d.valor)}</td>
                <td>
                  <span className={'badge ' + (d.activo ? 'badge-success' : 'badge-muted')}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalDescuento(d)}>Editar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => alternarDescuento(d)}>
                      {d.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {descuentos.length === 0 && (
              <tr><td colSpan={5} className="empty-state">No hay descuentos creados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalTarifa && (
        <TarifaModal tarifa={modalTarifa} onClose={() => setModalTarifa(null)} onSave={guardarTarifa} />
      )}
      {modalDescuento && (
        <DescuentoModal descuento={modalDescuento} onClose={() => setModalDescuento(null)} onSave={guardarDescuento} />
      )}
    </Layout>
  );
}

function TarifaModal({ tarifa, onClose, onSave }) {
  const [form, setForm] = useState(tarifa);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar tarifa de IVA' : 'Nueva tarifa de IVA'}</h2>
        <div className="form-group">
          <label>Porcentaje</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={form.porcentaje}
            onChange={(e) => set('porcentaje', Number(e.target.value))}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Nombre (opcional)</label>
          <input
            type="text"
            value={form.nombre || ''}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej: Tarifa reducida"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function DescuentoModal({ descuento, onClose, onSave }) {
  const [form, setForm] = useState(descuento);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar descuento' : 'Nuevo descuento'}</h2>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej: Empleado"
            autoFocus
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto">Monto fijo (₡)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Valor</label>
            <input
              type="number"
              step="1"
              min="0"
              max={form.tipo === 'porcentaje' ? 100 : undefined}
              value={form.valor}
              onChange={(e) => set('valor', Number(e.target.value))}
            />
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
