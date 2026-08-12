import axios from 'axios';

const SERVER_URL_KEY = 'crm_server_url';
const TOKEN_KEY = 'crm_token';

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
