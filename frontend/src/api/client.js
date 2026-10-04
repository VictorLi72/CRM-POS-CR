import axios from 'axios';

const SERVER_URL_KEY = 'crm_server_url';
const TOKEN_KEY = 'crm_token';
const PRINTER_KEY = 'crm_printer_name';
const AUTO_PRINT_KEY = 'crm_auto_print';

export function getServerUrl() {
  const stored = localStorage.getItem(SERVER_URL_KEY);
  if (stored) return stored;
  // En el navegador (no Electron), usa el mismo origen para que el proxy de Vite enrute las llamadas al backend
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

export function setServerUrl(url) {
  localStorage.setItem(SERVER_URL_KEY, url.replace(/\/+$/, ''));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getPrinterName() {
  return localStorage.getItem(PRINTER_KEY) || '';
}

export function setPrinterName(name) {
  if (name) localStorage.setItem(PRINTER_KEY, name);
  else localStorage.removeItem(PRINTER_KEY);
}

export function getAutoPrint() {
  return localStorage.getItem(AUTO_PRINT_KEY) === 'true';
}

export function setAutoPrint(value) {
  localStorage.setItem(AUTO_PRINT_KEY, value ? 'true' : 'false');
}

const RECEIPT_HEADER_KEY = 'crm_receipt_header';
const DEFAULT_RECEIPT_HEADER = {
  nombre: 'CRM Super CR',
  slogan: '',
  cedula: '',
  telefono: '',
  direccion: '',
  email: '',
  leyenda: '¡Gracias por su compra!',
};

export function getReceiptHeader() {
  try {
    const stored = localStorage.getItem(RECEIPT_HEADER_KEY);
    return stored ? { ...DEFAULT_RECEIPT_HEADER, ...JSON.parse(stored) } : { ...DEFAULT_RECEIPT_HEADER };
  } catch {
    return { ...DEFAULT_RECEIPT_HEADER };
  }
}

export function setReceiptHeader(data) {
  localStorage.setItem(RECEIPT_HEADER_KEY, JSON.stringify(data));
}

const DATAFONO_KEY = 'crm_datafono';
const DEFAULT_DATAFONO = {
  tipo: 'none',   // 'none' | 'serial' | 'network'
  marca: '',
  puerto_com: 'COM1',
  ip: '',
  puerto_red: '8080',
};

export function getDatafono() {
  try {
    const stored = localStorage.getItem(DATAFONO_KEY);
    return stored ? { ...DEFAULT_DATAFONO, ...JSON.parse(stored) } : { ...DEFAULT_DATAFONO };
  } catch {
    return { ...DEFAULT_DATAFONO };
  }
}

export function setDatafono(data) {
  localStorage.setItem(DATAFONO_KEY, JSON.stringify(data));
}

const RECEIPT_OPTIONS_KEY = 'crm_receipt_options';
const DEFAULT_RECEIPT_OPTIONS = {
  mostrarIva: true,
  mostrarSubtotal: true,
  mostrarTotalItems: true,
  mostrarCodigo: true,
  mensajeCodigo: 'Escaneá este código en Devoluciones',
  mostrarCajero: true,
  mostrarFolio: true,
  escalaCodigo: 2,
  margenCodigo: 10,
  margenTiquete: 5,
};

export function getReceiptOptions() {
  try {
    const stored = localStorage.getItem(RECEIPT_OPTIONS_KEY);
    return stored ? { ...DEFAULT_RECEIPT_OPTIONS, ...JSON.parse(stored) } : { ...DEFAULT_RECEIPT_OPTIONS };
  } catch {
    return { ...DEFAULT_RECEIPT_OPTIONS };
  }
}

export function setReceiptOptions(data) {
  localStorage.setItem(RECEIPT_OPTIONS_KEY, JSON.stringify(data));
}

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = `${getServerUrl()}/api`;
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
