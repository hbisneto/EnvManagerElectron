const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');

// evita erros gráficos
app.disableHardwareAcceleration();

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 500,
        height: 420,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('renderer/index.html');

    // abre o console automaticamente
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

const possiveisPythons = [
    'python',
    'python3',
    'python3.8',
    'python3.9',
    'python3.10',
    'python3.11',
    'python3.12',
    'python3.13',
    'python3.14',
    'py -3.8',
    'py -3.9',
    'py -3.10',
    'py -3.11',
    'py -3.12'
];

function verificarComando(cmd) {
    console.log('Testando:', cmd);

    return new Promise((resolve) => {
        exec(`${cmd} --version`, (err, stdout, stderr) => {
            if (err) {
                console.log(`Não encontrado: ${cmd}`);
                return resolve(null);
            }

            const versao = (stdout || stderr).trim();
            console.log(`Encontrado: ${cmd} → ${versao}`);

            resolve({ comando: cmd, versao });
        });
    });
}

async function detectarPythons() {
    console.log('Detectando versões do Python...');
    const resultados = await Promise.all(
        possiveisPythons.map(verificarComando)
    );

    const lista = resultados.filter(Boolean);
    console.log('Pythons detectados:', lista);

    return lista;
}

ipcMain.handle('get-pythons', async () => {
    return await detectarPythons();
});

ipcMain.on('criar-venv', (event, { python, nome }) => {
    console.log(`Criando venv: ${nome} com ${python}`);

    const partes = python.split(' ');
    const cmd = partes[0];
    const args = partes.slice(1);

    const processo = spawn(cmd, [...args, '-m', 'venv', nome]);

    processo.stdout.on('data', (data) => {
        console.log('[PYTHON]', data.toString());
        event.sender.send('venv-progress', 50);
    });

    processo.stderr.on('data', (data) => {
        console.error('[PYTHON ERROR]', data.toString());
    });

    processo.on('error', (err) => {
        console.error('Erro ao iniciar processo:', err);
        event.sender.send('venv-done', false);
    });

    processo.on('close', (code) => {
        console.log('Processo finalizado com código:', code);

        if (code === 0) {
            event.sender.send('venv-progress', 100);
            event.sender.send('venv-done', true);
        } else {
            event.sender.send('venv-done', false);
        }
    });
});
