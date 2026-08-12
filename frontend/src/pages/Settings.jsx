import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getServerUrl, setServerUrl } from '../api/client';
import api from '../api/client';

export default function Settings() {
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

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
    </Layout>
  );
}
