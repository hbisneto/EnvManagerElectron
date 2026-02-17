const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPythons: () => ipcRenderer.invoke('get-pythons'),
    createVenv: (data) => ipcRenderer.send('create-venv', data),
    onProgress: (callback) => ipcRenderer.on('venv-progress', (_, v) => callback(v)),
    onStatus: (callback) => ipcRenderer.on('venv-status', (_, text) => callback(text)),
    onDone: (callback) => ipcRenderer.on('venv-done', (_, v) => callback(v)),
    selecProjectFolder: () => ipcRenderer.invoke('select-project-folder'),
    selectRequirementsFile: () => ipcRenderer.invoke('select-requirements-file')
});