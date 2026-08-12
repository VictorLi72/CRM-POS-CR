import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';

export default function Returns() {
  const [folio, setFolio] = useState('');
  const [venta, setVenta] = useState(null);
  const [cantidades, setCantidades] = useState({}); // detalle_venta_id -> cantidad a devolver
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  async function buscarVenta(e) {
    e.preventDefault();
    if (!folio.trim()) return;
    setError('');
    setResultado(null);
    setVenta(null);
    setLoading(true);
    try {
      const res = await api.get(`/sales/by-folio/${encodeURIComponent(folio.trim())}`);
      setVenta(res.data);
      setCantidades({});
      setMotivo('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró la venta');
    } finally {
      setLoading(false);
    }
  }

  function setCantidad(detalleId, disponible, value) {
    const cantidad = Math.min(Math.max(0, Number(value) || 0), disponible);
    setCantidades((prev) => ({ ...prev, [detalleId]: cantidad }));
  }

  const totalADevolver = venta
    ? venta.items.reduce((sum, it) => {
        const cantidad = cantidades[it.id] || 0;
        return sum + (it.total / it.cantidad) * cantidad;
      }, 0)
    : 0;

  async function procesarDevolucion() {
    const items = Object.entries(cantidades)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([detalle_venta_id, cantidad]) => ({ detalle_venta_id: Number(detalle_venta_id), cantidad }));

    if (items.length === 0) {
      setError('Indicá la cantidad a devolver de al menos un producto');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/sales/${venta.id}/devolucion`, { items, motivo });
      setResultado(res.data);
      setVenta(null);
      setFolio('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo procesar la devolución');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Devoluciones">
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={buscarVenta}>
          <div className="form-group">
            <label>Número de tiquete (folio)</label>
            <div className="flex gap-8">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 42"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                autoFocus
              />
              <button className="btn" type="submit" disabled={loading}>Buscar</button>
            </div>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger" style={{ maxWidth: 480 }}>{error}</div>}

      {resultado && (
        <div className="alert alert-success" style={{ maxWidth: 480 }}>
          Devolución registrada por {formatCurrency(resultado.total)}.
        </div>
      )}

      {venta && (
        <div className="card">
          <div className="flex justify-between items-center">
            <h3 className="mt-0">Tiquete #{venta.folio}</h3>
            {venta.estado === 'anulada' && <span className="badge badge-danger">Anulada</span>}
          </div>
          <p className="text-muted">
            {formatDate(venta.creado_en)} · {venta.cliente_nombre || 'Sin cliente'} · Cajero: {venta.cajero_nombre}
          </p>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Vendido</th>
                <th>Ya devuelto</th>
                <th style={{ width: 110 }}>Devolver ahora</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it) => {
                const disponible = it.cantidad - it.cantidad_devuelta;
                return (
                  <tr key={it.id}>
                    <td>{it.producto_nombre}</td>
                    <td>{it.cantidad}</td>
                    <td className="text-muted">{it.cantidad_devuelta}</td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max={disponible}
                        disabled={disponible <= 0}
                        value={cantidades[it.id] || ''}
                        placeholder="0"
                        onChange={(e) => setCantidad(it.id, disponible, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>Motivo (opcional)</label>
            <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: producto dañado, cliente se arrepintió..." />
          </div>

          <div className="flex justify-between items-center" style={{ marginTop: 14 }}>
            <div>
              <span className="text-muted">Total a devolver: </span>
              <strong>{formatCurrency(totalADevolver)}</strong>
              {venta.metodo_pago === 'fiado' && (
                <div className="text-muted" style={{ fontSize: 12 }}>Se descuenta del saldo fiado del cliente.</div>
              )}
            </div>
            <button className="btn" onClick={procesarDevolucion} disabled={loading || totalADevolver <= 0}>
              Confirmar devolución
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
