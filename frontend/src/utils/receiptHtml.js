import { formatCurrency, formatDate } from './format';

// Genera el HTML del tiquete para imprimir en una impresora térmica de 80mm.
// El ancho se fija en milímetros vía @page/CSS; el driver de Windows de la
// impresora se encarga del resto (no se usan comandos ESC/POS directos).
export function buildReceiptHtml(sale, cashierName, storeName = 'CRM Super CR') {
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
</style>
</head>
<body>
  <h1>${escapeHtml(storeName)}</h1>
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
  <div class="center" style="margin-top: 8px;">¡Gracias por su compra!</div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
