import { formatCurrency } from './format';
import { getReceiptHeader, getReceiptOptions } from '../api/client';

export function buildFolioCode(folio, createdAt) {
  const d = createdAt ? new Date(createdAt) : new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `CRM-${yy}${mm}${dd}-${String(folio).padStart(4, '0')}`;
}

// ── Code 128B generator (sin dependencias externas) ──────────────────────────
const C128 = '212222222122222221121223121322131222122212122231132221221213221312231212112232122132122231113222123122123221223211221132221231213212223112312131311222321122321221312212322112322211212123212321232121111323131123131321112313132113132311211313231113231311112133112331132131113123113321133121313121211331231131213113213311213131311123311321331121312113312311332111314111221411431111111224111422121124121421141122141221112214112412122114122411142211241211221114413111241112134111111242121142121241114212124112124211411212421112421211212141214121412121111143111341131141114113114311411113411311113141114131311141411131211412211214211232';
const STOP = [2, 3, 3, 1, 1, 1, 2];

function barcodeSVG(text, scale = 2) {
  const START_B = 104;
  const syms = [START_B];
  let check = START_B;
  for (let i = 0; i < text.length; i++) {
    const v = text.charCodeAt(i) - 32;
    syms.push(v);
    check += v * (i + 1);
  }
  syms.push(check % 103);

  const W = scale, H = scale * 28;
  let x = 0;
  const rects = [];

  for (const s of syms) {
    const base = s * 6;
    for (let i = 0; i < 6; i++) {
      const w = +C128[base + i] * W;
      if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="${H}"/>`);
      x += w;
    }
  }
  for (let i = 0; i < 7; i++) {
    const w = STOP[i] * W;
    if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="${H}"/>`);
    x += w;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${H}" viewBox="0 0 ${x} ${H}" style="max-width:100%;display:block;margin:0 auto;"><g fill="black">${rects.join('')}</g></svg>`;
}
// ─────────────────────────────────────────────────────────────────────────────

// Genera el HTML del tiquete con diseño moderno (coincide con el Receipt de POS).
export function buildReceiptHtml(sale, cashierName, hdr = getReceiptHeader(), opts = getReceiptOptions()) {
  const folioCode = buildFolioCode(sale.folio, sale.creado_en);
  const fechaD = new Date((sale.creado_en || new Date().toISOString()).replace(' ', 'T'));
  const fechaStr = fechaD.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr = fechaD.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  const totalUnidades = sale.items.reduce((s, it) => s + it.cantidad, 0);

  const filas = sale.items.map((it) => `
    <div class="item">
      <span class="item-qty">${it.cantidad}x</span>
      <div class="item-info">
        <div class="item-name">${escapeHtml(it.producto_nombre)}</div>
        ${it.descuento > 0 ? `<div class="item-disc">desc. ${formatCurrency(it.descuento)}</div>` : ''}
      </div>
      <span class="item-price">${formatCurrency(it.total)}</span>
    </div>`).join('');

  const barcodeSection = opts.mostrarCodigo ? `
    <div style="padding:0 ${opts.margenCodigo ?? 10}px; margin:10px 0 4px; text-align:center;">
      ${barcodeSVG(folioCode, opts.escalaCodigo ?? 2)}
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;margin-top:2px;">${folioCode}</div>
      ${opts.mensajeCodigo ? `<div style="font-size:9px;color:#555;">${escapeHtml(opts.mensajeCodigo)}</div>` : ''}
    </div>` : '';

  const metodos = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', sinpe: 'SINPE Móvil', fiado: 'Fiado', mixto: 'Mixto' };

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  /* TM-T20II: papel 80mm, área imprimible 72mm, margen 4mm c/lado */
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 13px;
    width: 72mm;
    color: #000;
    padding: 0 2px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0 5px; }
  .hdr-left .biz-name { font-size: 15px; font-weight: 700; line-height: 1.2; }
  .hdr-left .biz-sub { font-size: 11px; color: #333; margin-top: 2px; }
  .hdr-right { text-align: right; flex-shrink: 0; margin-left: 8px; }
  .hdr-right .folio { font-size: 13px; font-weight: 700; }
  .hdr-right .cajero { font-size: 11px; color: #333; margin-top: 2px; }
  .divider-thick { border: none; border-top: 2px solid #000; margin: 5px 0; }
  .meta { font-size: 11px; color: #333; margin: 3px 0 7px; }
  .item { display: flex; align-items: flex-start; padding: 5px 0; border-bottom: 1px solid #aaa; }
  .item-qty { font-weight: 700; width: 24px; flex-shrink: 0; font-size: 13px; }
  .item-info { flex: 1; min-width: 0; padding-right: 5px; }
  .item-name { font-size: 13px; word-break: break-word; }
  .item-disc { font-size: 10px; color: #333; }
  .item-price { font-weight: 600; font-size: 13px; flex-shrink: 0; text-align: right; }
  .totals { padding: 7px 0 3px; }
  .total-row { display: flex; justify-content: flex-end; gap: 14px; padding: 2px 0; font-size: 13px; }
  .total-row.main { font-size: 17px; font-weight: 700; padding: 4px 0; }
  .muted { color: #444; }
  .footer { padding: 8px 0 5px; border-top: 1px solid #aaa; margin-top: 5px; text-align: center; }
  .footer-msg { font-weight: 700; font-size: 13px; }
  .footer-date { font-size: 11px; color: #333; margin-top: 3px; }
  @media print {
    body { width: 72mm; }
  }
</style>
</head>
<body>

  <div class="hdr">
    <div class="hdr-left">
      <div class="biz-name">${escapeHtml(hdr.nombre)}</div>
      ${hdr.cedula ? `<div class="biz-sub">Cédula: ${escapeHtml(hdr.cedula)}</div>` : ''}
      ${hdr.telefono ? `<div class="biz-sub">Tel: ${escapeHtml(hdr.telefono)}</div>` : ''}
      ${hdr.direccion ? `<div class="biz-sub">${escapeHtml(hdr.direccion)}</div>` : ''}
    </div>
    <div class="hdr-right">
      ${opts.mostrarFolio ? `<div class="folio">Tiquete #${sale.folio}</div>` : ''}
      ${opts.mostrarCajero ? `<div class="cajero">Cajero: ${escapeHtml(cashierName || '')}</div>` : ''}
    </div>
  </div>

  <hr class="divider-thick" />

  <div class="meta">
    ${fechaStr} &middot; ${horaStr}
    ${opts.mostrarTotalItems ? `&middot; ${totalUnidades} ${totalUnidades === 1 ? 'unidad' : 'unidades'}` : ''}
  </div>

  <div>${filas}</div>

  <div class="totals">
    ${opts.mostrarSubtotal ? `<div class="total-row"><span class="muted">Subtotal</span><span>${formatCurrency(sale.subtotal)}</span></div>` : ''}
    ${opts.mostrarIva ? `<div class="total-row"><span class="muted">IVA</span><span>${formatCurrency(sale.iva_total)}</span></div>` : ''}
    <div class="total-row main"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
    ${sale.metodo_pago === 'mixto' && sale.pagos
      ? sale.pagos.map((p) => `<div class="total-row"><span class="muted">${escapeHtml(metodos[p.metodo] || p.metodo)}</span><span>${formatCurrency(p.monto)}</span></div>`).join('')
      : `<div class="total-row"><span class="muted">${escapeHtml(metodos[sale.metodo_pago] || sale.metodo_pago)}</span><span>${formatCurrency(sale.total)}</span></div>`
    }
    ${(sale.metodo_pago === 'efectivo' || sale.metodo_pago === 'mixto') && sale.vuelto > 0
      ? `<div class="total-row"><span class="muted">Vuelto</span><span>${formatCurrency(sale.vuelto)}</span></div>` : ''}
  </div>

  <div class="footer">
    <div class="footer-msg">${escapeHtml(hdr.leyenda || '¡Gracias por su compra!')}</div>
    <div class="footer-date">${fechaStr} &middot; ${horaStr}</div>
  </div>

  ${barcodeSection}

</body>
</html>`;
}

// Muestra un diálogo para elegir imprimir o descargar (modo web).
export function elegirImpresion(html, folio) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:24px 22px 20px;max-width:310px;width:92%;box-shadow:0 24px 64px rgba(0,0,0,.35);">
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#18212f;">¿Cómo desea el tiquete?</div>
        <div style="font-size:13px;color:#5e6e85;margin-bottom:20px;">Elija cómo procesar el tiquete #${folio}.</div>
        <div style="display:flex;gap:10px;">
          <button id="__pr_print" style="flex:1;padding:11px 6px;font-size:13px;font-weight:600;border:none;border-radius:9px;background:#1e6f5c;color:#fff;cursor:pointer;">🖨️ Imprimir</button>
          <button id="__pr_dl" style="flex:1;padding:11px 6px;font-size:13px;font-weight:600;border:1.5px solid #e0e4eb;border-radius:9px;background:#fff;color:#18212f;cursor:pointer;">⬇️ Descargar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    function cleanup(choice) {
      document.body.removeChild(overlay);
      resolve(choice);
    }
    overlay.querySelector('#__pr_print').onclick = () => cleanup('print');
    overlay.querySelector('#__pr_dl').onclick = () => cleanup('download');
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(null); };
  });
}

export async function descargarRecibo(html, folio) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:80mm;height:200mm;border:none;visibility:hidden;';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      const a = Object.assign(document.createElement('a'), { href: url, download: `tiquete-${folio}.html` });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
    }
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
