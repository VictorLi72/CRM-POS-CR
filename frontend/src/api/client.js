import axios from 'axios';

const SERVER_URL_KEY = 'crm_server_url';
const TOKEN_KEY = 'crm_token';
const PRINTER_KEY = 'crm_printer_name';
const AUTO_PRINT_KEY = 'crm_auto_print';

export function getServerUrl() {
  return localStorage.getItem(SERVER_URL_KEY) || 'http://localhost:4000';
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
