import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api, { getPrinterName } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { buildReceiptHtml } from '../utils/receiptHtml';

const METODO_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  sinpe: 'SINPE Móvil',
  fiado: 'Fiado',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function SalesHistory() {
  const [from, setFrom] = useState(daysAgoISO(7));
  const [to, setTo] = useState(todayISO());
  const [estado, setEstado] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folioSearch, setFolioSearch] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, estado]);

  async function loadSales() {
    setLoading(true);
    setError('');
    try {
      const params = { from, to: `${to} 23:59:59` };
      if (estado) params.status = estado;
      const res = await api.get('/sales', { params });
      setSales(res.data);
    } catch (err) {
      setError('No se pudo cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  }

  async function buscarFolio(e) {
    e.preventDefault();
    if (!folioSearch.trim()) return;
    setError('');
    try {
      const res = await api.get(`/sales/by-folio/${encodeURIComponent(folioSearch.trim())}`);
      setSelected(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró una venta con ese folio');
    }
  }

  async function verVenta(id) {
    setError('');
    try {
      const res = await api.get(`/sales/${id}`);
      setSelected(res.data);
    } catch (err) {
      setError('No se pudo cargar el detalle de la venta');
    }
  }

  return (
    <Layout title="Historial de ventas">
      <div className="toolbar">
        <div className="flex gap-8 items-center">
          <label className="text-muted">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <label className="text-muted">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todas</option>
            <option value="completada">Completadas</option>
            <option value="anulada">Anuladas</option>
          </select>
        </div>
        <form onSubmit={buscarFolio} className="flex gap-8">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Buscar por folio..."
            value={folioSearch}
            onChange={(e) => setFolioSearch(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn btn-secondary" type="submit">Buscar</button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Cajero</th>
              <th>Cliente</th>
              <th>Método</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((v) => (
              <tr key={v.id}>
                <td>#{v.folio}</td>
                <td>{formatDate(v.creado_en)}</td>
                <td>{v.cajero_nombre}</td>
                <td>{v.cliente_nombre || '—'}</td>
                <td>{METODO_LABELS[v.metodo_pago] || v.metodo_pago}</td>
                <td className="text-right">{formatCurrency(v.total)}</td>
                <td>
                  <span className={'badge ' + (v.estado === 'anulada' ? 'badge-danger' : 'badge-success')}>
                    {v.estado === 'anulada' ? 'Anulada' : 'Completada'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => verVenta(v.id)}>
                    Ver / Reimprimir
                  </button>
                </td>
              </tr>
            ))}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">No hay ventas en el período seleccionado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />}
    </Layout>
  );
}

function SaleDetailModal({ sale, onClose }) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState('');
  const tieneAPIImpresion = typeof window !== 'undefined' && !!window.electronAPI;

  async function imprimir() {
    setErrorImpresion('');
    setImprimiendo(true);
    try {
      const html = buildReceiptHtml(sale, sale.cajero_nombre);
      await window.electronAPI.imprimirTiquete(html, getPrinterName());
    } catch (err) {
      setErrorImpresion('No se pudo imprimir. Revisá la impresora en Configuración.');
    } finally {
      setImprimiendo(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2>Tiquete #{sale.folio}</h2>
          {sale.estado === 'anulada' && <span className="badge badge-danger">Anulada</span>}
        </div>
        <p className="text-muted">
          {formatDate(sale.creado_en)} · {sale.cliente_nombre || 'Sin cliente'} · Cajero: {sale.cajero_nombre}
        </p>
        <table>
          <tbody>
            {sale.items.map((it) => (
              <tr key={it.id}>
                <td>
                  {it.producto_nombre}
                  <div className="text-muted">
                    {it.cantidad} x {formatCurrency(it.precio_unitario)}
                    {it.descuento > 0 && <> · desc. {formatCurrency(it.descuento)}</>}
                  </div>
                </td>
                <td className="text-right">{formatCurrency(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">IVA</span><span>{formatCurrency(sale.iva_total)}</span></div>
          <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 18 }}>
            <span>Total</span><span>{formatCurrency(sale.total)}</span>
          </div>
          {sale.metodo_pago === 'efectivo' && (
            <div className="flex justify-between"><span className="text-muted">Vuelto</span><span>{formatCurrency(sale.vuelto)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted">Pago</span><span>{METODO_LABELS[sale.metodo_pago] || sale.metodo_pago}</span></div>
        </div>
        {errorImpresion && <div className="alert alert-danger" style={{ marginTop: 12 }}>{errorImpresion}</div>}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {tieneAPIImpresion && (
            <button className="btn" onClick={imprimir} disabled={imprimiendo}>
              {imprimiendo ? 'Imprimiendo...' : '🖨️ Reimprimir tiquete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
