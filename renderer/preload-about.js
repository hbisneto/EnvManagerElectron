const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('aboutApi', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    onUpdateStatus: (callback) =>
        ipcRenderer.on('update-status', (_, text) => callback(text)),

    onUpdateProgress: (callback) =>
        ipcRenderer.on('update-progress', (_, percent) => callback(percent)),

    onUpdateDownloaded: (callback) =>
        ipcRenderer.on('update-downloaded', callback),

    requestRestart: () =>
        ipcRenderer.send('restart-app'),

    requestClose: () =>
        ipcRenderer.send('close-about-window')
});
