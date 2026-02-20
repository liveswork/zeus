import { app, BrowserWindow, Menu, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

// Configuração de diretórios compatível com ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Só mostra quando estiver pronto para evitar piscar branco
    backgroundColor: '#f9fafb', // Cor de fundo suave enquanto carrega
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // Garanta que esse arquivo existe
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // Mantém segurança, mas ajustaremos o CSP
      devTools: true // Habilita DevTools mesmo em produção para debug (remova depois)
    },
  });

  // 🟢 DEFINIÇÃO DO CSP (Política de Segurança)
  // Usamos a mesma lógica permissiva tanto para DEV quanto para PROD neste momento
  // para garantir que estilos inline e conexões externas funcionem.
  const csp = [
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: filesystem:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 https://rxdb.info https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com",
    "style-src 'self' 'unsafe-inline' http://localhost:5173 https://fonts.googleapis.com",
    "font-src 'self' http://localhost:5173 data: https://fonts.gstatic.com",
    "connect-src 'self' ws://localhost:5173 http://localhost:5173 https: wss: file:", // file: adicionado
    "img-src 'self' data: blob: https: http: file:",
    "frame-src 'self' https://rxdb.info https://*.firebaseapp.com"
  ].join('; ');

  // Aplica o CSP nos Headers
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // 🟢 CARREGAMENTO DA URL (Lógica Corrigida)
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Em produção, usamos loadFile que é mais robusto para caminhos locais
    // Assume que a estrutura é:
    // /resources/app/dist-electron/main.js
    // /resources/app/dist/index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
    
    // 🔥 Mantenha o console aberto em produção para ver erros se houver
    // Comente esta linha quando estiver 100% estável
    // win.webContents.openDevTools(); 
  }

  // Só mostra a janela quando o conteúdo estiver carregado
  win.once('ready-to-show', () => {
    win.show();
  });

  // Monitora falhas de carregamento em produção
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Falha ao carregar:', errorCode, errorDescription);
  });
}

// ... (Mantenha o resto do código de Menu e app.whenReady igual) ...
const template = [
    {
        label: 'Arquivo',
        submenu: [
            { role: 'quit', label: 'Sair' }
        ]
    },
    // ... seus outros menus ...
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