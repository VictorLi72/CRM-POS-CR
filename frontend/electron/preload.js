const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('electronAPI', {
  obtenerIpLocal: () => ipcRenderer.invoke('obtener-ip-local'),
  listarImpresoras: () => ipcRenderer.invoke('listar-impresoras'),
  imprimirTiquete: (html, printerName) => ipcRenderer.invoke('imprimir-tiquete', { html, printerName }),
});
