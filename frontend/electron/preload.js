const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('electronAPI', {
  listarImpresoras: () => ipcRenderer.invoke('listar-impresoras'),
  imprimirTiquete: (html, printerName) => ipcRenderer.invoke('imprimir-tiquete', { html, printerName }),
});
