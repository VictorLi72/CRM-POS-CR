const KEY = 'crm_a11y';
const DEFAULTS = { tema: 'system', fuente: 'md', contraste: false, movimiento: true };

export function getA11y() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

export function setA11y(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  applyA11y(prefs);
}

export function applyA11y(prefs = getA11y()) {
  const h = document.documentElement;
  // system = remove attribute so @media (prefers-color-scheme) takes over
  if (prefs.tema === 'dark') h.setAttribute('data-theme', 'dark');
  else if (prefs.tema === 'light') h.setAttribute('data-theme', 'light');
  else h.removeAttribute('data-theme');

  h.dataset.font = prefs.fuente ?? 'md';
  if (prefs.contraste) h.dataset.contrast = 'high';
  else delete h.dataset.contrast;
  if (!prefs.movimiento) h.dataset.motion = 'reduced';
  else delete h.dataset.motion;
}
