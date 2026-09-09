import QRCode from 'qrcode';
import { formatCurrency, formatDate } from './format';
import { getReceiptHeader } from '../api/client';

function buildFolioCode(folio, createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `CRM-${yy}${mm}${dd}-${String(folio).padStart(4, '0')}`;
}

// Genera el HTML del tiquete para imprimir en una impresora térmica de 80mm.
// El QR codifica CRM-AAMMDD-FOLIO para escaneo rápido en devoluciones.
export async function buildReceiptHtml(sale, cashierName) {
  const hdr = getReceiptHeader();
  const folioCode = buildFolioCode(sale.folio, sale.creado_en);
  const qrDataUrl = await QRCode.toDataURL(folioCode, {
    width: 130,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });

  const filas = sale.items
    .map(
      (it) => `
        <tr>
          <td colspan="2">${escapeHtml(it.producto_nombre)}</td>
        </tr>
        <tr>
          <td>${it.cantidad} x ${formatCurrency(it.precio_unitario)}${it.descuento > 0 ? ` · desc. ${formatCurrency(it.descuento)}` : ''}</td>
          <td class="right">${formatCurrency(it.total)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; width: 76mm; margin: 0; color: #000; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .muted { color: #333; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .totales td { padding: 2px 0; }
  .grande { font-size: 14px; font-weight: bold; }
  .qr-block { text-align: center; margin: 8px 0 2px; }
  .qr-block img { width: 110px; height: 110px; }
  .qr-hint { font-size: 9px; color: #555; text-align: center; margin-bottom: 4px; }
</style>
</head>
<body>
  <h1>${escapeHtml(hdr.nombre)}</h1>
  ${hdr.slogan ? `<div class="center muted" style="font-size:10px;">${escapeHtml(hdr.slogan)}</div>` : ''}
  ${hdr.cedula ? `<div class="center muted">Cédula: ${escapeHtml(hdr.cedula)}</div>` : ''}
  ${hdr.telefono ? `<div class="center muted">Tel: ${escapeHtml(hdr.telefono)}</div>` : ''}
  ${hdr.direccion ? `<div class="center muted">${escapeHtml(hdr.direccion)}</div>` : ''}
  ${hdr.email ? `<div class="center muted">${escapeHtml(hdr.email)}</div>` : ''}
  <hr />
  <div class="center muted">Tiquete #${sale.folio}</div>
  <div class="center muted">${formatDate(sale.creado_en || new Date().toISOString())}</div>
  <hr />
  <table>${filas}</table>
  <hr />
  <table class="totales">
    <tr><td>Subtotal</td><td class="right">${formatCurrency(sale.subtotal)}</td></tr>
    <tr><td>IVA</td><td class="right">${formatCurrency(sale.iva_total)}</td></tr>
    <tr class="grande"><td>Total</td><td class="right">${formatCurrency(sale.total)}</td></tr>
    ${sale.metodo_pago === 'efectivo' ? `<tr><td>Recibido</td><td class="right">${formatCurrency(sale.monto_recibido)}</td></tr>
    <tr><td>Vuelto</td><td class="right">${formatCurrency(sale.vuelto)}</td></tr>` : ''}
    <tr><td>Pago</td><td class="right">${escapeHtml(sale.metodo_pago)}</td></tr>
  </table>
  <hr />
  <div class="muted">Cajero: ${escapeHtml(cashierName || '')}</div>
  <div class="qr-block">
    <img src="${qrDataUrl}" alt="QR tiquete #${sale.folio}" />
  </div>
  <div class="center" style="font-size:10px;letter-spacing:1px;font-weight:bold;margin-bottom:2px;">${folioCode}</div>
  <div class="qr-hint">Escaneá este código en Devoluciones para recuperar la compra</div>
  <div class="center" style="margin-top: 6px;">${escapeHtml(hdr.leyenda || '¡Gracias por su compra!')}</div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
