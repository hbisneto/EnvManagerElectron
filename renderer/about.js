document.addEventListener('DOMContentLoaded', async () => {

    const versionSpan = document.getElementById('version');
    const statusText = document.getElementById('update-status');
    const progressDiv = document.getElementById('progressDiv');
    const progressBar = document.getElementById('progressBar');
    const progressLabel = document.getElementById('updateProgressLabel');
    const restartBtn = document.getElementById('restartBtn');
    const closeBtn = document.getElementById('closeBtn');

    // Mostrar versão
    const version = await window.aboutApi.getAppVersion();
    versionSpan.innerText = version;

    // Botão Close
    closeBtn.addEventListener('click', () => {
        window.aboutApi.requestClose();
    });

    // Botão Restart
    restartBtn.addEventListener('click', () => {
        window.aboutApi.requestRestart();
    });

    // STATUS
    window.aboutApi.onUpdateStatus((text) => {
        statusText.innerText = text;

        if (text.includes('up to date')) {
            statusText.className = 'fw-semibold text-success';
            progressDiv.style.display = 'none';
            progressLabel.style.display = 'none';
        }

        if (text.includes('available')) {
            statusText.className = 'fw-semibold text-primary';
            progressDiv.style.display = 'block';
        }
    });

    // PROGRESSO
    window.aboutApi.onUpdateProgress((percent) => {
        progressDiv.style.display = 'block';
        progressLabel.style.display = 'block';

        progressBar.style.width = `${percent}%`;
        progressBar.innerText = `${Math.floor(percent)}%`;
    });

    // DOWNLOAD FINALIZADO
    window.aboutApi.onUpdateDownloaded(() => {
        statusText.innerText = "Update downloaded. Restart to apply.";
        statusText.className = 'fw-semibold text-success';

        progressBar.classList.remove('progress-bar-animated');
        restartBtn.style.display = 'inline-block';
        closeBtn.style.display = 'none';
    });
});
