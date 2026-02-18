const { contextBridge, ipcRenderer } = require('electron');

console.log('Inicio do arquivo preload-about.js');

contextBridge.exposeInMainWorld('aboutApi', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_, text) => callback(text)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_, percent) => callback(percent)),
    onSetVersion: (callback) => ipcRenderer.on('set-version', (_, version) => callback(version)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, ...args) => callback(...args)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    
    // For restart button in about window
    requestRestart: () => ipcRenderer.send('restart-app')
});

console.log('preload-about.js carregado');