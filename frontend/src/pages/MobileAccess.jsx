import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Layout from '../components/Layout.jsx';

function detectarIpsLocales() {
  return new Promise((resolve) => {
    // Si ya estamos en una IP de red (no localhost), usarla directamente
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      resolve([hostname]);
      return;
    }

    // WebRTC: obtener IPs locales desde el navegador sin backend
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const ips = new Set();
      pc.createDataChannel('');
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => {});
      pc.onicecandidate = (e) => {
        if (!e || !e.candidate) {
          pc.close();
          const lista = [...ips].filter(
            (ip) => !ip.startsWith('127.') && !ip.startsWith('169.254.')
          );
          resolve(lista.length > 0 ? lista : []);
          return;
        }
        const m = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/g);
        if (m) m.forEach((ip) => ips.add(ip));
      };
      setTimeout(() => {
        pc.close();
        const lista = [...ips].filter(
          (ip) => !ip.startsWith('127.') && !ip.startsWith('169.254.')
        );
        resolve(lista.length > 0 ? lista : []);
      }, 2000);
    } catch {
      resolve([]);
    }
  });
}

export default function MobileAccess() {
  const [ips, setIps] = useState([]);
  const [selectedIp, setSelectedIp] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectarIpsLocales()
      .then((lista) => {
        setIps(lista);
        if (lista.length > 0) setSelectedIp(lista[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeIp = selectedIp || manualIp;

  useEffect(() => {
    if (!activeIp) { setQrDataUrl(''); return; }
    const url = `http://${activeIp}:5173/#/inventory`;
    QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [activeIp]);

  const phoneUrl = activeIp ? `http://${activeIp}:5173/#/inventory` : '';

  return (
    <Layout title="Acceso desde teléfono">
      <div style={{ maxWidth: 520 }}>
        <div className="card">
          <h3 className="mt-0" style={{ marginBottom: 4 }}>Escaneá desde el teléfono</h3>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 20, fontSize: 13 }}>
            El teléfono debe estar en la misma red WiFi que esta PC.
            Podés ver y gestionar el inventario desde el navegador sin instalar nada.
          </p>

          {loading && <p className="text-muted" style={{ fontSize: 13 }}>Detectando IPs de red...</p>}

          {!loading && ips.length > 1 && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>IP detectada de la PC</label>
              <select value={selectedIp} onChange={(e) => { setSelectedIp(e.target.value); setManualIp(''); }}>
                {ips.map((ip) => <option key={ip} value={ip}>{ip}</option>)}
              </select>
            </div>
          )}

          {!loading && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>{ips.length > 0 ? 'O ingresá la IP manualmente' : 'IP de esta PC en la red WiFi'}</label>
              <input
                type="text"
                value={manualIp}
                onChange={(e) => { setManualIp(e.target.value); setSelectedIp(''); }}
                placeholder={ips[0] || '192.168.1.10'}
              />
              {ips.length === 0 && (
                <p className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
                  No se detectó automáticamente. Buscá la IP en: cmd → <code>ipconfig</code> → "Dirección IPv4"
                </p>
              )}
            </div>
          )}

          {qrDataUrl && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                padding: 12,
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <img src={qrDataUrl} alt="QR acceso inventario" width={200} height={200} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div className="section-title" style={{ marginBottom: 6 }}>URL de acceso</div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    wordBreak: 'break-all',
                    color: 'var(--color-text)',
                  }}>
                    {phoneUrl}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--color-text)' }}>Disponible en el teléfono:</div>
                  <div>✓ Inventario (ver y ajustar stock)</div>
                  <div>✓ Clientes y pedidos</div>
                  <div>✓ Historial de ventas</div>
                  <div>✓ Reportes</div>
                  <div style={{ marginTop: 6 }}>✗ Impresión (solo en escritorio)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
