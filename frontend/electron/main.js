const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'CRM Super - Punto de Venta',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Impresión de tiquetes ---
// Se usa una ventana oculta para renderizar el HTML del recibo e imprimirlo
// directamente (silent: true) a la impresora elegida, sin abrir diálogos de
// impresión de Windows. Esto evita depender de drivers ESC/POS o módulos
// nativos: cualquier impresora térmica instalada como impresora normal de
// Windows funciona, porque Electron imprime a través del driver del sistema.

ipcMain.handle('listar-impresoras', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return [];
  const impresoras = await win.webContents.getPrintersAsync();
  return impresoras.map((p) => ({ name: p.name, displayName: p.displayName, isDefault: p.isDefault }));
});

ipcMain.handle('imprimir-tiquete', async (event, { html, printerName }) => {
  const ventanaImpresion = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await ventanaImpresion.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise((resolve, reject) => {
      ventanaImpresion.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: printerName || undefined,
          marginsType: 1,
        },
        (success, errorType) => {
          if (success) resolve();
          else reject(new Error(errorType || 'No se pudo imprimir'));
        }
      );
    });
    return { ok: true };
  } finally {
    ventanaImpresion.close();
  }
});
