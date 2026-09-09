import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getServerUrl, setServerUrl, getPrinterName, setPrinterName, getAutoPrint, setAutoPrint, getReceiptHeader, setReceiptHeader } from '../api/client';
import api from '../api/client';

export default function Settings() {
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const [impresoras, setImpresoras] = useState([]);
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState(getPrinterName());
  const [impresoraGuardada, setImpresoraGuardada] = useState(false);
  const [autoPrint, setAutoPrintState] = useState(getAutoPrint());
  const tieneAPIImpresion = typeof window !== 'undefined' && !!window.electronAPI;

  const [header, setHeader] = useState(getReceiptHeader());
  const [headerGuardado, setHeaderGuardado] = useState(false);

  function campoHeader(campo) {
    return (e) => setHeader((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  function guardarHeader() {
    setReceiptHeader(header);
    setHeaderGuardado(true);
    setTimeout(() => setHeaderGuardado(false), 2000);
  }

  function toggleAutoPrint(checked) {
    setAutoPrint(checked);
    setAutoPrintState(checked);
  }

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
        <h3 className="mt-0">Encabezado del tiquete</h3>
        <p className="text-muted">
          Esta información aparece en la parte superior de cada tiquete impreso.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Nombre del negocio *</label>
            <input type="text" value={header.nombre} onChange={campoHeader('nombre')} placeholder="CRM Super CR" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Eslogan / subtítulo</label>
            <input type="text" value={header.slogan} onChange={campoHeader('slogan')} placeholder="Tu tienda de confianza" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Cédula jurídica</label>
            <input type="text" value={header.cedula} onChange={campoHeader('cedula')} placeholder="3-101-XXXXXX" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Teléfono</label>
            <input type="text" value={header.telefono} onChange={campoHeader('telefono')} placeholder="2XXX-XXXX" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Dirección</label>
            <input type="text" value={header.direccion} onChange={campoHeader('direccion')} placeholder="San José, Costa Rica" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Correo electrónico</label>
            <input type="email" value={header.email} onChange={campoHeader('email')} placeholder="info@minegocio.cr" />
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Leyenda al pie del tiquete</label>
            <input type="text" value={header.leyenda} onChange={campoHeader('leyenda')} placeholder="¡Gracias por su compra!" />
          </div>
        </div>

        {headerGuardado && <div className="alert alert-success" style={{ marginTop: 12 }}>Encabezado guardado.</div>}
        <button className="btn" style={{ marginTop: 16 }} onClick={guardarHeader}>Guardar encabezado</button>

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Vista previa
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace", fontSize: 11, background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)', borderRadius: 6, padding: '10px 14px',
            textAlign: 'center', lineHeight: 1.7,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{header.nombre || 'Nombre del negocio'}</div>
            {header.slogan && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{header.slogan}</div>}
            {header.cedula && <div>Cédula: {header.cedula}</div>}
            {header.telefono && <div>Tel: {header.telefono}</div>}
            {header.direccion && <div>{header.direccion}</div>}
            {header.email && <div>{header.email}</div>}
            <div style={{ borderTop: '1px dashed #aaa', margin: '6px 0' }} />
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Tiquete #0042 · 09/09/2026</div>
            <div style={{ borderTop: '1px dashed #aaa', margin: '6px 0' }} />
            <div style={{ fontSize: 10, marginTop: 6 }}>{header.leyenda || '¡Gracias por su compra!'}</div>
          </div>
        </div>
      </div>

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
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <label className="flex items-center gap-8" style={{ fontWeight: 400, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => toggleAutoPrint(e.target.checked)}
                />
                Imprimir el tiquete automáticamente al cobrar
              </label>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
