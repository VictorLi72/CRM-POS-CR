import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

const METODO_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', sinpe: 'SINPE Móvil', fiado: 'Fiado' };

export default function CashRegister() {
  const { user } = useAuth();
  const [turno, setTurno] = useState(undefined); // undefined = cargando, null = sin turno abierto
  const [montoApertura, setMontoApertura] = useState('');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [cerrado, setCerrado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const puedeVerHistorial = ['administrador', 'supervisor'].includes(user?.rol);

  useEffect(() => {
    loadTurnoActual();
    if (puedeVerHistorial) loadHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTurnoActual() {
    try {
      const res = await api.get('/turnos/actual');
      setTurno(res.data);
    } catch (err) {
      setTurno(null);
    }
  }

  async function loadHistorial() {
    try {
      const res = await api.get('/turnos');
      setHistorial(res.data);
    } catch (err) {
      // silencioso
    }
  }

  async function abrirTurno() {
    setError('');
    try {
      const res = await api.post('/turnos', { monto_apertura: Number(montoApertura) || 0 });
      setTurno(res.data);
      setMontoApertura('');
      loadTurnoActual();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo abrir el turno');
    }
  }

  async function cerrarTurno() {
    if (efectivoContado === '') {
      setError('Contá el efectivo en caja e indicá el monto');
      return;
    }
    setError('');
    try {
      const res = await api.post(`/turnos/${turno.id}/cerrar`, {
        efectivo_contado: Number(efectivoContado),
        notas,
      });
      setCerrado(res.data);
      setTurno(null);
      setEfectivoContado('');
      setNotas('');
      if (puedeVerHistorial) loadHistorial();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cerrar el turno');
    }
  }

  if (turno === undefined) {
    return (
      <Layout title="Cierre de Caja">
        <div className="card">Cargando...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Cierre de Caja">
      {error && <div className="alert alert-danger" style={{ maxWidth: 480 }}>{error}</div>}

      {cerrado && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 className="mt-0">Turno cerrado</h3>
          <div className="flex justify-between"><span className="text-muted">Efectivo esperado</span><span>{formatCurrency(cerrado.efectivo_esperado)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Efectivo contado</span><span>{formatCurrency(cerrado.efectivo_contado)}</span></div>
          <div className="flex justify-between" style={{ fontWeight: 700 }}>
            <span>Diferencia</span>
            <span style={{ color: cerrado.diferencia < 0 ? 'var(--color-danger)' : cerrado.diferencia > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {formatCurrency(cerrado.diferencia)}
            </span>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => setCerrado(null)}>Cerrar</button>
        </div>
      )}

      {!turno && !cerrado && (
        <div className="card" style={{ maxWidth: 420 }}>
          <h3 className="mt-0">Abrir turno</h3>
          <p className="text-muted">Contá el efectivo con el que arrancás la caja antes de empezar a vender.</p>
          <div className="form-group">
            <label>Monto inicial en caja</label>
            <input
              type="number"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <button className="btn" onClick={abrirTurno}>Abrir turno</button>
        </div>
      )}

      {turno && (
        <div className="grid grid-2">
          <div className="card">
            <h3 className="mt-0">Turno abierto</h3>
            <p className="text-muted">Desde {formatDate(turno.abierto_en)}</p>
            <div className="flex justify-between"><span className="text-muted">Monto de apertura</span><span>{formatCurrency(turno.monto_apertura)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Ventas en efectivo</span><span>{formatCurrency(turno.resumen.ventas_efectivo)} ({turno.resumen.ventas_efectivo_cantidad})</span></div>
            <div className="flex justify-between"><span className="text-muted">Abonos de fiado</span><span>{formatCurrency(turno.resumen.abonos_fiado)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Devoluciones en efectivo</span><span>-{formatCurrency(turno.resumen.devoluciones_efectivo)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 700, marginTop: 6 }}>
              <span>Efectivo esperado ahora</span>
              <span>
                {formatCurrency(
                  turno.monto_apertura + turno.resumen.ventas_efectivo + turno.resumen.abonos_fiado - turno.resumen.devoluciones_efectivo
                )}
              </span>
            </div>
            {turno.resumen.ventas_por_metodo.length > 0 && (
              <>
                <h4>Ventas por método</h4>
                <table>
                  <tbody>
                    {turno.resumen.ventas_por_metodo.map((m) => (
                      <tr key={m.metodo_pago}>
                        <td>{METODO_LABELS[m.metodo_pago] || m.metodo_pago}</td>
                        <td className="text-right">{formatCurrency(m.total)} ({m.cantidad})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="card">
            <h3 className="mt-0">Cerrar turno</h3>
            <div className="form-group">
              <label>Efectivo contado en caja</label>
              <input
                type="number"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Notas (opcional)</label>
              <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            <button className="btn" style={{ width: '100%' }} onClick={cerrarTurno}>
              Confirmar cierre
            </button>
          </div>
        </div>
      )}

      {puedeVerHistorial && historial.length > 0 && (
        <div className="card">
          <h3 className="mt-0">Historial de arqueos</h3>
          <table>
            <thead>
              <tr><th>Cajero</th><th>Apertura</th><th>Cierre</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr>
            </thead>
            <tbody>
              {historial.map((t) => (
                <tr key={t.id}>
                  <td>{t.usuario_nombre}</td>
                  <td>{formatDate(t.abierto_en)}</td>
                  <td>{t.estado === 'abierto' ? <span className="badge badge-warning">Abierto</span> : formatDate(t.cerrado_en)}</td>
                  <td>{t.efectivo_esperado != null ? formatCurrency(t.efectivo_esperado) : '—'}</td>
                  <td>{t.efectivo_contado != null ? formatCurrency(t.efectivo_contado) : '—'}</td>
                  <td style={{ color: t.diferencia < 0 ? 'var(--color-danger)' : t.diferencia > 0 ? 'var(--color-warning)' : undefined }}>
                    {t.diferencia != null ? formatCurrency(t.diferencia) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
