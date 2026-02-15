const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPythons: () => ipcRenderer.invoke('get-pythons'),
    criarVenv: (dados) => ipcRenderer.send('criar-venv', dados),
    onProgress: (callback) => ipcRenderer.on('venv-progress', (_, v) => callback(v)),
    onDone: (callback) => ipcRenderer.on('venv-done', (_, v) => callback(v))
});
