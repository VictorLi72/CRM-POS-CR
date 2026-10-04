import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api, { getPrinterName, getReceiptHeader, getReceiptOptions, setReceiptOptions } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { buildReceiptHtml, descargarRecibo, elegirImpresion } from '../utils/receiptHtml';

const METODO_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  sinpe: 'SINPE Móvil',
  fiado: 'Fiado',
  mixto: 'Mixto',
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
                  {v.estado === 'anulada' ? (
                    <span className="badge badge-danger">Anulada</span>
                  ) : v.tiene_devolucion ? (
                    <span className="badge badge-warning">Con devolución</span>
                  ) : (
                    <span className="badge badge-success">Completada</span>
                  )}
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

      {selected && (
        <SaleDetailModal
          sale={selected}
          onClose={() => setSelected(null)}
          onAnulada={(id) => {
            setSales((prev) => prev.map((s) => s.id === id ? { ...s, estado: 'anulada', tiene_devolucion: false } : s));
          }}
        />
      )}
    </Layout>
  );
}

function SaleDetailModal({ sale, onClose, onAnulada }) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [confirmAnular, setConfirmAnular] = useState(false);
  const [errorAnular, setErrorAnular] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [opts, setOptsState] = useState(getReceiptOptions);

  function setOpt(campo, valor) {
    const next = { ...opts, [campo]: valor };
    setOptsState(next);
    setReceiptOptions(next);
  }

  const receiptHtml = buildReceiptHtml(sale, sale.cajero_nombre, getReceiptHeader(), opts);

  async function imprimir() {
    setErrorImpresion('');
    setImprimiendo(true);
    try {
      const html = buildReceiptHtml(sale, sale.cajero_nombre, getReceiptHeader(), opts);
      if (window.electronAPI) {
        try {
          await window.electronAPI.imprimirTiquete(html, getPrinterName());
        } catch {
          descargarRecibo(html, sale.folio);
        }
      } else {
        const choice = await elegirImpresion(html, sale.folio);
        if (choice === 'print') {
          const win = window.open('', '_blank', 'width=420,height=650');
          if (!win) {
            descargarRecibo(html, sale.folio);
          } else {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 400);
          }
        } else if (choice === 'download') {
          descargarRecibo(html, sale.folio);
        }
      }
    } catch {
      setErrorImpresion('No se pudo procesar el tiquete.');
    } finally {
      setImprimiendo(false);
    }
  }

  async function handleAnular() {
    setAnulando(true);
    setErrorAnular('');
    try {
      await api.post(`/sales/${sale.id}/cancel`);
      onAnulada(sale.id);
      onClose();
    } catch (err) {
      setErrorAnular(err.response?.data?.error || 'No se pudo anular la venta');
      setConfirmAnular(false);
    } finally {
      setAnulando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2>Tiquete #{sale.folio}</h2>
          {sale.estado === 'anulada' ? (
            <span className="badge badge-danger">Anulada</span>
          ) : sale.tiene_devolucion ? (
            <span className="badge badge-warning">Con devolución</span>
          ) : null}
        </div>
        <p className="text-muted">
          {formatDate(sale.creado_en)} · {sale.cliente_nombre || 'Sin cliente'} · Cajero: {sale.cajero_nombre}
        </p>
        <div className="tab-group">
          <button className={`tab-btn${!vistaPrevia ? ' active' : ''}`} onClick={() => setVistaPrevia(false)}>Detalles</button>
          <button className={`tab-btn${vistaPrevia ? ' active' : ''}`} onClick={() => setVistaPrevia(true)}>Tiquete</button>
        </div>
        {vistaPrevia ? (
          <div>
            <iframe
              srcDoc={receiptHtml}
              title="Vista previa tiquete"
              style={{ width: '100%', height: 420, border: '1px solid var(--color-border)', borderRadius: 6, background: '#fff', display: 'block' }}
              sandbox="allow-same-origin"
            />
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Opciones del tiquete</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                {[
                  { campo: 'mostrarFolio',      label: 'Nº tiquete' },
                  { campo: 'mostrarTotalItems', label: 'Total artículos' },
                  { campo: 'mostrarSubtotal',   label: 'Subtotal' },
                  { campo: 'mostrarIva',        label: 'IVA' },
                  { campo: 'mostrarCajero',     label: 'Cajero' },
                  { campo: 'mostrarCodigo',     label: 'Código de barras' },
                ].map(({ campo, label }) => (
                  <label key={campo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={opts[campo]} onChange={(e) => setOpt(campo, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
              {opts.mostrarCodigo && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="text"
                    value={opts.mensajeCodigo}
                    onChange={(e) => setOpt('mensajeCodigo', e.target.value)}
                    placeholder="Mensaje bajo el código..."
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Tamaño:</span>
                    <input
                      type="range" min="1" max="4" step="1"
                      value={opts.escalaCodigo ?? 2}
                      onChange={(e) => setOpt('escalaCodigo', Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 60 }}>
                      {['', 'Pequeño', 'Normal', 'Grande', 'Muy grande'][opts.escalaCodigo ?? 2]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Margen código:</span>
                    <input
                      type="range" min="0" max="40" step="2"
                      value={opts.margenCodigo ?? 10}
                      onChange={(e) => setOpt('margenCodigo', Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 40 }}>
                      {opts.margenCodigo ?? 10}px
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Margen tiquete:</span>
                    <input
                      type="range" min="0" max="20" step="1"
                      value={opts.margenTiquete ?? 5}
                      onChange={(e) => setOpt('margenTiquete', Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: 40 }}>
                      {opts.margenTiquete ?? 5}px
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
              {sale.metodo_pago === 'mixto' && sale.pagos ? (
                sale.pagos.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted">{METODO_LABELS[p.metodo] || p.metodo}</span>
                    <span>{formatCurrency(p.monto)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between"><span className="text-muted">Pago</span><span>{METODO_LABELS[sale.metodo_pago] || sale.metodo_pago}</span></div>
              )}
              {(sale.metodo_pago === 'efectivo' || sale.metodo_pago === 'mixto') && sale.vuelto > 0 && (
                <div className="flex justify-between"><span className="text-muted">Vuelto</span><span>{formatCurrency(sale.vuelto)}</span></div>
              )}
            </div>
          </>
        )}
        {errorImpresion && <div className="alert alert-danger" style={{ marginTop: 12 }}>{errorImpresion}</div>}
        {errorAnular && <div className="alert alert-danger" style={{ marginTop: 12 }}>{errorAnular}</div>}
        {confirmAnular && (
          <div className="alert alert-danger" style={{ marginTop: 12 }}>
            <strong>¿Anular esta venta?</strong> Se revertirá el stock y no se puede deshacer.
            <div className="flex gap-8" style={{ marginTop: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={handleAnular} disabled={anulando}>
                {anulando ? 'Anulando...' : 'Sí, anular'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmAnular(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {sale.estado !== 'anulada' && !confirmAnular && (
            <button className="btn btn-danger" onClick={() => setConfirmAnular(true)}>
              Anular venta
            </button>
          )}
          <button className="btn" onClick={imprimir} disabled={imprimiendo}>
            {imprimiendo ? 'Imprimiendo...' : '🖨️ Reimprimir tiquete'}
          </button>
        </div>
      </div>
    </div>
  );
}
