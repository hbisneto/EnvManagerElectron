const { app, Menu, shell, dialog, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Global variable to keep track of the about window instance
let aboutWin = null;

// Set events for autoUpdater
autoUpdater.on('update-available', (info) => {
    sendToAbout('update-status', `Update available (v${info.version}). Downloading...`);
});

autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.floor(progressObj.percent);
    sendToAbout('update-progress', percent);
    sendToAbout('update-status', `Downloading: ${percent}%`);
});

autoUpdater.on('update-downloaded', (info) => {
    sendToAbout('update-status', `Update v${info.version} downloaded. Ready to install.`);
    sendToAbout('update-downloaded');  // For activate "Install and Restart" button in the about window
});

autoUpdater.on('error', (err) => {
    sendToAbout('update-status', `Error: ${err.message}`);
});

// Auxiliar to send messages to the about window if it's open
function sendToAbout(channel, data) {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.webContents.send(channel, data);
    }
}

// Set feed URL for autoUpdater (GitHub)
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'hbisneto',
    repo: 'EnvManagerElectron'
});

function buildMenu(win) {
    const isMac = process.platform === 'darwin';

    const template = [
        // Menu App (macOS only)
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { 
                    label: 'About EnvManager', 
                    click: () => openAboutWindow(win, false)  // Opens without update check
                },
                { type: 'separator' },
                { 
                    label: 'Check for Updates...',
                    click: () => openAboutWindow(win, true)  // Opens and starts update check
                },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),

        // File
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => console.log('New Project clicked')
                },
                {
                    label: 'Open Folder...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => console.log('Open Folder clicked')
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },

        // Edit (Electron default + macOS customizations)
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },

        // View
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },

        // Window (macOS)
        ...(isMac ? [{
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ]
        }] : []),

        // Help
        {
            role: 'help',
            submenu: [
                { 
                    label: 'About EnvManager',
                    click: () => openAboutWindow(win, false)
                },
                { 
                    label: 'Check for Updates...',
                    click: () => openAboutWindow(win, true)
                },
                { 
                    label: 'Visit GitHub',
                    click: () => shell.openExternal('https://github.com/hbisneto/envmanager')
                }
            ]
        }
    ];

    return Menu.buildFromTemplate(template);
}

function openAboutWindow(mainWin, startCheck = false) {
    if (aboutWin && !aboutWin.isDestroyed()) {
        aboutWin.focus();
        if (startCheck) checkForUpdates();
        return;
    }

    aboutWin = new BrowserWindow({
        width: 400,
        height: 300,
        parent: mainWin,
        modal: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'renderer', 'preload-about.js'),
            contextIsolation: true,  // Activate context isolation for security
            nodeIntegration: false   // Extra security
        }
    });

    aboutWin.loadFile(path.join(__dirname, 'renderer', 'about.html'));

    aboutWin.on('closed', () => {
        aboutWin = null;
    });

    // Await loading from the about window before sending version and starting update check
    aboutWin.webContents.on('did-finish-load', () => {
        console.log('Janela About carregada com sucesso');
        console.log('Enviando versão:', app.getVersion());
        sendToAbout('set-version', app.getVersion());

        if (startCheck) {
            checkForUpdates();
        } else {
            sendToAbout('update-status', 'Up to date.');
        }
    });
}

function checkForUpdates() {
    sendToAbout('update-status', 'Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify()
        .then((result) => {
            if (!result) {
                sendToAbout('update-status', 'No updates available.');
            }
        })
        .catch((err) => {
            sendToAbout('update-status', `Error: ${err.message}`);
        });
}

function setAppMenu(win) {
    const menu = buildMenu(win);
    const isMac = process.platform === 'darwin';

    if (isMac) {
        Menu.setApplicationMenu(menu);
    } else {
        win.setMenu(menu);
    }
}

module.exports = { setAppMenu };