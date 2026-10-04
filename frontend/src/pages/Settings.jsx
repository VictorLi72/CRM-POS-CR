import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Layout from '../components/Layout.jsx';
import { getServerUrl, setServerUrl, getPrinterName, setPrinterName, getAutoPrint, setAutoPrint, getReceiptHeader, setReceiptHeader, getDatafono, setDatafono, getReceiptOptions, setReceiptOptions } from '../api/client';
import api from '../api/client';

const TABS = [
  { id: 'tiquete', label: 'Encabezado de tiquete', icon: '🧾' },
  { id: 'conexion', label: 'Servidor', icon: '🌐' },
  { id: 'impresora', label: 'Impresora', icon: '🖨️' },
  { id: 'datafono', label: 'Datáfono', icon: '💳' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('tiquete');

  return (
    <Layout title="Configuración">
      <div style={{ display: 'flex', gap: 0, maxWidth: 720 }}>
        <nav style={{
          width: 200, flexShrink: 0, borderRight: '1px solid var(--color-border)',
          paddingRight: 0, marginRight: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 16px',
                background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--color-text)',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: 14, textAlign: 'left', marginBottom: 2,
                transition: 'background 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, paddingLeft: 24 }}>
          {activeTab === 'tiquete' && <TabTiquete />}
          {activeTab === 'conexion' && <TabConexion />}
          {activeTab === 'impresora' && <TabImpresora />}
          {activeTab === 'datafono' && <TabDatafono />}
        </div>
      </div>
    </Layout>
  );
}

function TabTiquete() {
  const [header, setHeader] = useState(getReceiptHeader());
  const [opts, setOpts] = useState(getReceiptOptions());
  const [guardado, setGuardado] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function setOpt(campo, valor) {
    setOpts((prev) => ({ ...prev, [campo]: valor }));
  }

  function campoHeader(campo) {
    return (e) => setHeader((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  function guardar() {
    setReceiptHeader(header);
    setReceiptOptions(opts);
    setGuardado(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Encabezado del tiquete</h3>
      <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
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

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Contenido del tiquete</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { campo: 'mostrarFolio',      label: 'Mostrar número de tiquete (#XXXX)' },
            { campo: 'mostrarTotalItems', label: 'Mostrar total de artículos' },
            { campo: 'mostrarSubtotal',   label: 'Mostrar subtotal' },
            { campo: 'mostrarIva',        label: 'Mostrar IVA' },
            { campo: 'mostrarCajero',     label: 'Mostrar nombre del cajero' },
            { campo: 'mostrarCodigo',     label: 'Mostrar código de barras al pie' },
          ].map(({ campo, label }) => (
            <label key={campo} className="flex items-center gap-8" style={{ fontWeight: 400, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={opts[campo]}
                onChange={(e) => setOpt(campo, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        {opts.mostrarCodigo && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Mensaje bajo el código de barras</label>
              <input
                type="text"
                value={opts.mensajeCodigo}
                onChange={(e) => setOpt('mensajeCodigo', e.target.value)}
                placeholder="Escaneá este código en Devoluciones"
              />
              <p className="text-muted" style={{ margin: '5px 0 0', fontSize: 12 }}>
                Dejá vacío para no mostrar ningún mensaje.
              </p>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Tamaño del código de barras</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="1" max="4" step="1"
                  value={opts.escalaCodigo ?? 2}
                  onChange={(e) => setOpt('escalaCodigo', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 70 }}>
                  {['', 'Pequeño', 'Normal', 'Grande', 'Muy grande'][opts.escalaCodigo ?? 2]}
                </span>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Margen lateral del código</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="0" max="40" step="2"
                  value={opts.margenCodigo ?? 10}
                  onChange={(e) => setOpt('margenCodigo', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 70 }}>
                  {opts.margenCodigo ?? 10} px
                </span>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Margen lateral del tiquete</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="0" max="20" step="1"
                  value={opts.margenTiquete ?? 5}
                  onChange={(e) => setOpt('margenTiquete', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 70 }}>
                  {opts.margenTiquete ?? 5} px
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {guardado && <div className="alert alert-success" style={{ marginTop: 12 }}>Configuración guardada.</div>}
      <button className="btn" style={{ marginTop: 16 }} onClick={guardar}>Guardar</button>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Vista previa
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace", fontSize: 11, background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)', borderRadius: 6, padding: '12px 16px',
          textAlign: 'center', lineHeight: 1.8, maxWidth: 280,
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
          <div style={{ fontSize: 10, marginTop: 4 }}>{header.leyenda || '¡Gracias por su compra!'}</div>
        </div>
      </div>
    </div>
  );
}

function TabConexion() {
  const [serverInput, setServerInput] = useState(getServerUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [lanIps, setLanIps] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [selectedIp, setSelectedIp] = useState('');

  useEffect(() => {
    api.get('/health/network').then((res) => {
      const ips = res.data.ips || [];
      setLanIps(ips);
      if (ips.length > 0) setSelectedIp(ips[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedIp) return;
    const url = `http://${selectedIp}:5173`;
    QRCode.toDataURL(url, { width: 200, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [selectedIp]);

  async function testConnection() {
    setTesting(true);
    setStatus(null);
    try {
      setServerUrl(serverInput);
      const res = await api.get('/health');
      setStatus({ ok: true, message: `Conectado correctamente (${res.data.service})` });
    } catch {
      setStatus({ ok: false, message: 'No se pudo conectar con el servidor en esa dirección' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Servidor central</h3>
      <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
        Esta caja se conecta al servidor central a través de la red local.
        Ingresá la IP de la PC donde corre el backend.
      </p>

      <div className="form-group">
        <label>Dirección del servidor</label>
        <input
          type="text"
          value={serverInput}
          onChange={(e) => setServerInput(e.target.value)}
          placeholder="http://192.168.1.10:4000"
        />
      </div>

      {status && (
        <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 12 }}>
          {status.message}
        </div>
      )}

      <button className="btn" onClick={testConnection} disabled={testing}>
        {testing ? 'Probando...' : 'Guardar y probar conexión'}
      </button>

      {lanIps.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Acceso desde el teléfono</div>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 13 }}>
            Escaneá este QR desde el teléfono para abrir el inventario y gestión sin instalar nada. El teléfono debe estar en la misma red WiFi.
          </p>

          {lanIps.length > 1 && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>IP de la PC</label>
              <select value={selectedIp} onChange={(e) => setSelectedIp(e.target.value)}>
                {lanIps.map((ip) => <option key={ip} value={ip}>{ip}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR acceso móvil"
                style={{ width: 160, height: 160, border: '1px solid var(--color-border)', borderRadius: 8, flexShrink: 0 }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'var(--color-text)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 12px' }}>
                http://{selectedIp}:5173
              </div>
              <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
                Funciona con inventario, historial, clientes y reportes.<br />
                La impresión de tiquetes solo está disponible en la app de escritorio.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabImpresora() {
  const [impresoras, setImpresoras] = useState([]);
  const [impresoraSeleccionada, setImpresoraSeleccionada] = useState(getPrinterName());
  const [guardada, setGuardada] = useState(false);
  const [autoPrint, setAutoPrintState] = useState(getAutoPrint());
  const tieneAPIImpresion = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (tieneAPIImpresion) {
      window.electronAPI.listarImpresoras().then(setImpresoras).catch(() => setImpresoras([]));
    }
  }, [tieneAPIImpresion]);

  function guardarImpresora() {
    setPrinterName(impresoraSeleccionada);
    setGuardada(true);
    setTimeout(() => setGuardada(false), 2000);
  }

  function toggleAutoPrint(checked) {
    setAutoPrint(checked);
    setAutoPrintState(checked);
  }

  if (!tieneAPIImpresion) {
    return (
      <div>
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Impresora de tiquetes</h3>
        <div className="alert alert-warning" style={{ marginTop: 12 }}>
          La impresión solo está disponible en la app de escritorio, no en el navegador.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Impresora de tiquetes</h3>
      <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
        Elegí la impresora térmica conectada a esta caja. Debe estar instalada en Windows con su driver normal.
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
        <div className="alert alert-warning" style={{ marginBottom: 12 }}>
          No se detectó ninguna impresora instalada en esta PC.
        </div>
      )}

      {guardada && <div className="alert alert-success" style={{ marginBottom: 12 }}>Impresora guardada.</div>}
      <button className="btn" onClick={guardarImpresora}>Guardar impresora</button>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
        <label className="flex items-center gap-8" style={{ fontWeight: 400, color: 'var(--color-text)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={(e) => toggleAutoPrint(e.target.checked)}
          />
          Imprimir el tiquete automáticamente al cobrar
        </label>
      </div>
    </div>
  );
}

const MARCAS = ['', 'Ingenico', 'Verifone', 'PAX', 'Nurit', 'Otro'];
const COM_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8'];

function TabDatafono() {
  const [cfg, setCfg] = useState(getDatafono());
  const [guardado, setGuardado] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function set(campo, valor) {
    setCfg((prev) => ({ ...prev, [campo]: valor }));
  }

  function guardar() {
    setDatafono(cfg);
    setGuardado(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Datáfono / Terminal de tarjetas</h3>
      <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
        Configurá la conexión con el datáfono para enviar el monto automáticamente al cobrar con tarjeta.
      </p>

      <div className="form-group">
        <label>Tipo de conexión</label>
        <select value={cfg.tipo} onChange={(e) => set('tipo', e.target.value)}>
          <option value="none">Sin integración (manual)</option>
          <option value="serial">Puerto serie (COM)</option>
          <option value="network">Red local (IP)</option>
        </select>
      </div>

      {cfg.tipo !== 'none' && (
        <div className="form-group">
          <label>Marca / Modelo</label>
          <select value={cfg.marca} onChange={(e) => set('marca', e.target.value)}>
            {MARCAS.map((m) => <option key={m} value={m}>{m || 'Seleccioná la marca...'}</option>)}
          </select>
        </div>
      )}

      {cfg.tipo === 'serial' && (
        <div className="form-group">
          <label>Puerto COM</label>
          <select value={cfg.puerto_com} onChange={(e) => set('puerto_com', e.target.value)}>
            {COM_PORTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <p className="text-muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
            Verificá en el Administrador de dispositivos de Windows cuál puerto tiene asignado el datáfono.
          </p>
        </div>
      )}

      {cfg.tipo === 'network' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Dirección IP del datáfono</label>
            <input
              type="text"
              value={cfg.ip}
              onChange={(e) => set('ip', e.target.value)}
              placeholder="192.168.1.50"
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Puerto</label>
            <input
              type="text"
              value={cfg.puerto_red}
              onChange={(e) => set('puerto_red', e.target.value)}
              placeholder="8080"
              style={{ width: 90 }}
            />
          </div>
        </div>
      )}

      {cfg.tipo === 'none' && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          Con esta opción el cajero debe ingresar el monto en el datáfono manualmente. No hay integración automática.
        </div>
      )}

      {cfg.tipo !== 'none' && (
        <div className="alert alert-muted" style={{ marginBottom: 16, background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: 'var(--color-text-muted)' }}>
          La integración directa con datáfono requiere la app de escritorio y el driver correspondiente instalado en Windows.
        </div>
      )}

      {guardado && <div className="alert alert-success" style={{ marginBottom: 12 }}>Configuración guardada.</div>}
      <button className="btn" onClick={guardar}>Guardar configuración</button>
    </div>
  );
}
