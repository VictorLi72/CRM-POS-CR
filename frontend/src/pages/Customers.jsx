import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY_CUSTOMER = { id: null, nombre: '', identificacion: '', telefono: '', correo: '', direccion: '', limite_credito: 0 };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadCustomers() {
    const res = await api.get('/customers', { params: { search } });
    setCustomers(res.data);
  }

  async function saveCustomer(customer) {
    setError('');
    try {
      if (customer.id) {
        await api.put(`/customers/${customer.id}`, customer);
      } else {
        await api.post('/customers', customer);
      }
      setModalCustomer(null);
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el cliente');
    }
  }

  async function deleteCustomer(id) {
    if (!confirm('¿Desactivar este cliente?')) return;
    await api.delete(`/customers/${id}`);
    if (selected?.id === id) setSelected(null);
    loadCustomers();
  }

  return (
    <Layout title="Clientes">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="toolbar">
        <input
          className="toolbar-search"
          type="search"
          placeholder="Buscar por nombre, cédula o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" onClick={() => setModalCustomer({ ...EMPTY_CUSTOMER })}>
          + Nuevo cliente
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Saldo fiado</th>
                <th>Puntos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                  <td>{c.nombre}</td>
                  <td className="text-muted">{c.identificacion || '—'}</td>
                  <td className="text-muted">{c.telefono || '—'}</td>
                  <td>
                    {c.saldo_credito > 0 ? (
                      <span className="badge badge-warning">{formatCurrency(c.saldo_credito)}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>{c.puntos_lealtad}</td>
                  <td>
                    <div className="flex gap-8">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalCustomer(c);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomer(c.id);
                        }}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No hay clientes que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <CustomerDetail
            customer={selected}
            onClose={() => setSelected(null)}
            onChanged={() => {
              loadCustomers();
              api.get(`/customers/${selected.id}`).then((res) => setSelected(res.data));
            }}
          />
        )}
      </div>

      {modalCustomer && (
        <CustomerModal
          customer={modalCustomer}
          onClose={() => setModalCustomer(null)}
          onSave={saveCustomer}
        />
      )}
    </Layout>
  );
}

function CustomerDetail({ customer, onClose, onChanged }) {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/customers/${customer.id}/sales`).then((res) => setSales(res.data));
    api.get(`/customers/${customer.id}/payments`).then((res) => setPayments(res.data));
  }, [customer.id]);

  async function registerPayment() {
    if (!paymentAmount) return;
    setError('');
    try {
      await api.post(`/customers/${customer.id}/payments`, { monto: Number(paymentAmount) });
      setPaymentAmount('');
      onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago');
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center">
        <h3 className="mt-0">{customer.nombre}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
      </div>
      <p className="text-muted">
        {customer.identificacion && <>Cédula: {customer.identificacion} · </>}
        {customer.telefono && <>Tel: {customer.telefono}</>}
      </p>

      {customer.saldo_credito > 0 && (
        <div className="card" style={{ background: 'var(--color-warning-light)', border: 'none', marginBottom: 16 }}>
          <div className="flex justify-between items-center">
            <div>
              <strong>Saldo pendiente (fiado):</strong> {formatCurrency(customer.saldo_credito)}
            </div>
          </div>
          {error && <div className="alert alert-danger" style={{ marginTop: 10 }}>{error}</div>}
          <div className="flex gap-8" style={{ marginTop: 10 }}>
            <input
              type="number"
              placeholder="Monto a abonar"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <button className="btn btn-sm" onClick={registerPayment}>Registrar abono</button>
          </div>
        </div>
      )}

      <h4>Historial de compras</h4>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Folio</th><th>Pago</th><th className="text-right">Total</th></tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{formatDate(s.creado_en)}</td>
              <td>#{s.folio}</td>
              <td>{s.metodo_pago}{s.estado === 'anulada' && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Anulada</span>}</td>
              <td className="text-right">{formatCurrency(s.total)}</td>
            </tr>
          ))}
          {sales.length === 0 && <tr><td colSpan={4} className="empty-state">Sin compras registradas.</td></tr>}
        </tbody>
      </table>

      {payments.length > 0 && (
        <>
          <h4>Abonos registrados</h4>
          <table>
            <thead><tr><th>Fecha</th><th className="text-right">Monto</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}><td>{formatDate(p.creado_en)}</td><td className="text-right">{formatCurrency(p.monto)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(customer);
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div className="form-group">
          <label>Nombre completo</label>
          <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Cédula</label>
            <input type="text" value={form.identificacion || ''} onChange={(e) => set('identificacion', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" value={form.telefono || ''} onChange={(e) => set('telefono', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Correo</label>
          <input type="email" value={form.correo || ''} onChange={(e) => set('correo', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={form.direccion || ''} onChange={(e) => set('direccion', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Límite de crédito (fiado). 0 = sin límite</label>
          <input type="number" step="0.01" value={form.limite_credito} onChange={(e) => set('limite_credito', Number(e.target.value))} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
