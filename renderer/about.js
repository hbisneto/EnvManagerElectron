console.log('about.js carregado com sucesso');
console.log('window.aboutApi existe?', !!window.aboutApi);

const api = window.aboutApi;

// Show version
api.onSetVersion((version) => {
    console.log('Received version:', version);
    document.getElementById('version').textContent = version || 'Unknown';
});

// Update status
api.onUpdateStatus((text) => {
    document.getElementById('update-status').textContent = text;
});

// Download progress
api.onUpdateProgress((percent) => {
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressDiv').style.display = 'block';
});

// Download complete
api.onUpdateDownloaded(() => {
    document.getElementById('update-status').textContent = 'Update downloaded. Restart now?';
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('restartBtn').style.display = 'block';
});

// Restart button
document.getElementById('restartBtn').onclick = () => {
    api.requestRestart();
};