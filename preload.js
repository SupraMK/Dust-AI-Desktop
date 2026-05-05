const { contextBridge, ipcRenderer } = require('electron');

// Expose sécurisée vers le renderer (si besoin futur d'API natives)
contextBridge.exposeInMainWorld('dustApp', {
  platform: process.platform,
  version: process.versions.electron
});