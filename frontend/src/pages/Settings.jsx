import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getServerUrl, setServerUrl, getPrinterName, setPrinterName } from '../api/client';
import api from '../api/client';

export default function Settings() {
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const [impresoras, setImpresoras] = useState([]);
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState(getPrinterName());
  const [impresoraGuardada, setImpresoraGuardada] = useState(false);
  const tieneAPIImpresion = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (tieneAPIImpresion) {
      window.electronAPI.listarImpresoras().then(setImpresoras).catch(() => setImpresoras([]));
    }
  }, [tieneAPIImpresion]);

  async function testConnection() {
    setTesting(true);
    setStatus(null);
    try {
      setServerUrl(serverInput);
      const res = await api.get('/health');
      setStatus({ ok: true, message: `Conectado correctamente (${res.data.service})` });
    } catch (err) {
      setStatus({ ok: false, message: 'No se pudo conectar con el servidor en esa dirección' });
    } finally {
      setTesting(false);
    }
  }

  function guardarImpresora() {
    setPrinterName(impresoraSeleccionada);
    setImpresoraGuardada(true);
    setTimeout(() => setImpresoraGuardada(false), 2000);
  }

  return (
    <Layout title="Configuración">
      <div className="card" style={{ maxWidth: 480 }}>
        <h3 className="mt-0">Servidor central</h3>
        <p className="text-muted">
          Esta caja se conecta al servidor central del super a través de la red local.
          Ingresá la IP de la PC donde corre el backend (por ejemplo <code>http://192.168.1.10:4000</code>).
        </p>
        <div className="form-group">
          <label>Dirección del servidor</label>
          <input type="text" value={serverInput} onChange={(e) => setServerInput(e.target.value)} />
        </div>
        {status && (
          <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'}`}>{status.message}</div>
        )}
        <button className="btn" onClick={testConnection} disabled={testing}>
          {testing ? 'Probando...' : 'Guardar y probar conexión'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h3 className="mt-0">Impresora de tiquetes</h3>
        {!tieneAPIImpresion ? (
          <p className="text-muted">
            La impresión solo está disponible en la app de escritorio (Electron), no en el navegador.
          </p>
        ) : (
          <>
            <p className="text-muted">
              Elegí la impresora térmica conectada a esta caja. Debe estar instalada en Windows como
              cualquier otra impresora (con su driver normal).
            </p>
            <div className="form-group">
              <label>Impresora</label>
              <select value={impresoraSeleccionada} onChange={(e) => setImpresoraSeleccionada(e.target.value)}>
                <option value="">Usar impresora predeterminada de Windows</option>
                {impresoras.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.displayName || p.name}{p.isDefault ? ' (predeterminada)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {impresoras.length === 0 && (
              <div className="alert alert-warning">
                No se detectó ninguna impresora instalada en esta PC.
              </div>
            )}
            {impresoraGuardada && <div className="alert alert-success">Impresora guardada.</div>}
            <button className="btn" onClick={guardarImpresora}>Guardar impresora</button>
          </>
        )}
      </div>
    </Layout>
  );
}
