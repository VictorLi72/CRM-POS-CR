export function formatCurrency(value) {
  const n = Number(value) || 0;
  return '₡' + n.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value.includes('T') || value.endsWith('Z') ? value : value.replace(' ', 'T') + 'Z');
  return d.toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatDateOnly(value) {
  if (!value) return '';
  // value viene como "YYYY-MM-DD" (fecha pura, sin hora). Se formatea directo desde
  // los componentes en vez de pasar por Date(), porque Date() interpreta ese formato
  // como UTC medianoche y al mostrarlo en hora de Costa Rica (UTC-6) corre un día atrás.
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
