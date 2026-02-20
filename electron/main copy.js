import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

// EM PRODUÇÃO, USE ISTO:
const userDataPath = app.getPath('userData'); 
// Isso aponta para C:\Users\Nome\AppData\Roaming\ZeusPDV

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true 
    },
  });

  // 🟢 CORREÇÃO CSP: Adicionei 'https:' em connect-src para permitir Google/Firebase
  const devCSP = [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173 data: blob: filesystem:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 https://rxdb.info https://*.firebaseio.com", 
    "style-src 'self' 'unsafe-inline' http://localhost:5173 https://fonts.googleapis.com",
    "font-src 'self' http://localhost:5173 data: https://fonts.gstatic.com",
    "connect-src 'self' ws://localhost:5173 http://localhost:5173 https: wss:", // 🟢 LIBERADO GERAL PARA HTTPS
    "img-src 'self' data: blob: https: http:",
    "frame-src 'self' https://rxdb.info https://*.firebaseapp.com" 
  ].join('; ');

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [isDev ? devCSP : "default-src 'self'"]
      }
    });
  });

  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  // Backup via meta tag
  win.webContents.on('dom-ready', () => {
    win.webContents.executeJavaScript(`
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "${devCSP}";
      document.head.appendChild(meta);
    `);
  });

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// ... (Mantenha o resto do menu e listeners igual ao original)
const template = [
    {
        label: 'Arquivo',
        submenu: [
            { role: 'quit', label: 'Sair' }
        ]
    },
    {
        label: 'Editar',
        submenu: [
            { role: 'undo', label: 'Desfazer' },
            { role: 'redo', label: 'Refazer' },
            { type: 'separator' },
            { role: 'cut', label: 'Cortar' },
            { role: 'copy', label: 'Copiar' },
            { role: 'paste', label: 'Colar' }
        ]
    },
    {
        label: 'Ajuda',
        submenu: [
            {
                label: 'Sobre o App',
                click: () => {
                    dialog.showMessageBox({
                        title: 'Sobre o Yndex',
                        message: 'O Yndex é o Protocolo Universal de Operação Comercial (UCOP). Não é apenas um ERP ou um PDV. É uma infraestrutura digital centralizada e agnóstica que padroniza, registra e orquestra a troca de bens e serviços globalmente. Nexxus OS padroniza a Transação Comercial, criando uma camada de interoperabilidade onde qualquer entidade — de um vendedor ambulante a uma multinacional — opera sob a mesma lógica de integridade, estoque e fluxo de valor.',
                        detail: 'Desenvolvido por Liveswork Softwares',
                    });
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});