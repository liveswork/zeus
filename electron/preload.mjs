// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openLink: (url) => ipcRenderer.send('open-external-link', url)
});