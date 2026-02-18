const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { dialog } = require('electron');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const { setAppMenu } = require('./menubar');

app.disableHardwareAcceleration();

let win;
let splash;

function createSplash() {
    splash = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splash.loadFile('renderer/splash.html');
    splash.center();
    splash.setAlwaysOnTop(true, 'screen-saver');
}

function createWindow() {
    win = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        width: 800,
        height: 800,
        icon: path.join(__dirname, 'icon.png'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('renderer/index.html');
    //win.webContents.openDevTools(); // Comment this line to disable DevTools on startup

    setAppMenu(win);
    
}

app.whenReady().then(() => {
    createSplash();
    createWindow();

    let minimumTimePassed = false;
    let windowIsReady = false;

    const tryShowMain = () => {
        if (minimumTimePassed && windowIsReady) {
            if (splash && !splash.isDestroyed()) {
                try {
                    splash.close();
                } catch (err) {
                    console.warn('Erro ao fechar splash:', err);
                }
            }
            if (win && !win.isDestroyed()) {
                try {
                    win.show();
                } catch (err) {
                    console.warn('Erro ao mostrar janela principal:', err);
                }
            }
        }
    };

    setTimeout(() => {
        minimumTimePassed = true;
        tryShowMain();
    }, 5000);

    win.once('ready-to-show', () => {
        windowIsReady = true;
        tryShowMain();
    });

    app.once('before-quit', () => {
        if (splash && !splash.isDestroyed()) {
            splash.destroy();
        }
        if (win && !win.isDestroyed()) {
            win.destroy();
        }
    });
});

const possiblePythonVersions = [
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

function verifyCommand(cmd) {
    console.log('Testing:', cmd);

    return new Promise((resolve) => {
        exec(`${cmd} --version`, (err, stdout, stderr) => {
            if (err) {
                console.log(`Not found: ${cmd}`);
                return resolve(null);
            }

            const version = (stdout || stderr).trim();

            if (!version.startsWith('Python 3')) {
                console.log(`Ignored (not Python 3): ${version}`);
                return resolve(null);
            }

            console.log(`Found: ${cmd} → ${version}`);
            resolve({ command: cmd, version });
        });
    });
}

async function detectPythonVersions() {
    console.log('Detecting Python versions...');
    const results = await Promise.all(
        possiblePythonVersions.map(verifyCommand)
    );

    const versionList = results.filter(Boolean);
    const unique = [];
    const versions = new Set();

    for (const py of versionList) {
        if (!versions.has(py.version)) {
            versions.add(py.version);
            unique.push(py);
        }
    }

    console.log('Detected Python versions:', unique);
    return unique;
}

ipcMain.handle('get-pythons', async () => {
    return await detectPythonVersions();
});

ipcMain.on('create-venv', (event, data) => {
    const { python, venvName, projectName, projectLocation, createGitignore, requirementsPath, updatePip } = data;

    const projectPath = path.join(projectLocation, projectName);
    const venvPath = path.join(projectPath, venvName);
    const pipPath = process.platform === 'win32' 
        ? path.join(venvPath, 'Scripts', 'pip.exe') 
        : path.join(venvPath, 'bin', 'pip');

    function sendStatus(text) {
        console.log(text);
        event.sender.send('venv-status', text);
    }

    function sendProgress(value) {
        event.sender.send('venv-progress', value);
    }

    console.log('Project will be created in:', projectPath);

    try {
        if (!fs.existsSync(projectPath)) {
            console.log('Creating project folder...');
            fs.mkdirSync(projectPath, { recursive: true });
        }

        if (createGitignore) {
            const gitignorePath = path.join(projectPath, '.gitignore');

            const gitignoreContent = `
# EnvManager Suggested .gitignore content
${venvName}/

.DS_STORE
*.pyc
Thumbs.db

# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#pdm.lock
#   pdm stores project-wide configurations in .pdm.toml, but it is recommended to not include it
#   in version control.
#   https://pdm.fming.dev/#use-with-ide
.pdm.toml

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#  JetBrains specific template is maintained in a separate JetBrains.gitignore that can
#  be found at https://github.com/github/gitignore/blob/main/Global/JetBrains.gitignore
#  and can be added to the global gitignore or merged into this file.  For a more nuclear
#  option (not recommended) you can uncomment the following to ignore the entire idea folder.
#.idea/
`.trim();

            fs.writeFileSync(gitignorePath, gitignoreContent);
            console.log('.gitignore created at:', gitignorePath);
        }

        sendProgress(10);

        const parts = python.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        console.log(`Creating venv: ${venvName} with ${python}`);

        const processVenv = spawn(
            cmd,
            [...args, '-m', 'venv', venvName],
            { cwd: projectPath }
        );

        processVenv.stdout.on('data', (data) => {
            console.log('[PYTHON]', data.toString());
            sendProgress(20);
        });

        processVenv.stderr.on('data', (data) => {
            console.error('[PYTHON ERROR]', data.toString());
        });

        processVenv.on('error', (err) => {
            console.error('Error starting venv process:', err);
            sendStatus('Error creating venv');
            event.sender.send('venv-done', false);
        });

        processVenv.on('close', (code) => {
            console.log('Created venv with code:', code);

            if (code !== 0) {
                sendStatus('Error creating venv');
                event.sender.send('venv-done', false);
                return;
            }

            sendProgress(40);

            // Aux function to upgrade pip if requested, then call the callback to continue with dependencies
            const upgradePipIfRequested = (callback) => {
                if (!updatePip) {
                    callback(); // Continue without upgrading pip
                    return;
                }

                sendStatus('Updating pip...');
                sendProgress(45); // Small progress increase for pip upgrade step

                const pipUpgrade = spawn(
                    pipPath,
                    ['install', '--upgrade', 'pip'],
                    { cwd: projectPath }
                );

                pipUpgrade.stdout.on('data', (data) => {
                    console.log('[PIP UPGRADE]', data.toString());
                });

                pipUpgrade.stderr.on('data', (data) => {
                    console.error('[PIP UPGRADE ERROR]', data.toString());
                });

                pipUpgrade.on('close', (upgradeCode) => {
                    if (upgradeCode === 0) {
                        sendStatus('pip updated successfully');
                    } else {
                        sendStatus('Warning: pip update failed, continuing anyway');
                    }
                    sendProgress(50); // Ready to continue with dependencies installation
                    callback();
                });

                pipUpgrade.on('error', (err) => {
                    console.error('Error running pip upgrade:', err);
                    sendStatus('Warning: could not update pip');
                    callback(); // Continues with dependencies even if pip upgrade fails
                });
            };

            // Main logic to install dependencies from requirements.txt, called after pip upgrade if requested
            const continueWithDependencies = () => {
                if (!requirementsPath || !fs.existsSync(requirementsPath)) {
                    sendProgress(100);
                    sendStatus('Venv created successfully (No dependencies to install)');
                    event.sender.send('venv-done', true);
                    return;
                }

                const reqContent = fs.readFileSync(requirementsPath, 'utf-8');
                const packages = reqContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#') && !line.startsWith(';'));
                let totalPackages = packages.length;
                let installed = 0;

                if (totalPackages === 0) {
                    sendProgress(100);
                    sendStatus('Venv created, but requirements.txt empty.');
                    event.sender.send('venv-done', true);
                    return;
                }

                exec('git --version', (gitErr) => {
                    if (gitErr) {
                        sendStatus('Git not found in system. Install Git to support GitHub packages (e.g., git+https://...).');
                        event.sender.send('venv-done', false);
                        return;
                    }

                    sendStatus(`Installing dependencies (0/${totalPackages})...`);

                    const processPip = spawn(
                        pipPath,
                        ['install', '-r', requirementsPath],
                        { cwd: projectPath }
                    );

                    let currentPackage = '';

                    processPip.stdout.on('data', (data) => {
                        const output = data.toString();
                        console.log('[PIP]', output);

                        const collectingMatch = output.match(/Collecting\s+(.+?)(?:\s|$)/);
                        if (collectingMatch) {
                            currentPackage = collectingMatch[1].trim();
                            installed++;

                            const progressInstallation = 40 + (60 * (installed / Math.max(totalPackages, installed)));
                            sendProgress(progressInstallation);
                            sendStatus(`Installing package ${installed}/${totalPackages}: ${currentPackage}...`);
                        }

                        if (output.includes('Successfully installed')) {
                            sendProgress(100);
                            sendStatus(`All dependencies installed successfully (${installed} packages processed)`);
                        }
                    });

                    processPip.stderr.on('data', (data) => {
                        const errorOutput = data.toString();
                        console.error('[PIP STDERR]', errorOutput);

                        if (!errorOutput.includes('Running command git clone')) {
                            sendStatus(`Warning/Error during installation: ${errorOutput}`);
                        }
                    });

                    processPip.on('error', (err) => {
                        console.error('Error starting pip:', err);
                        sendStatus('Error installing dependencies');
                        event.sender.send('venv-done', false);
                    });

                    processPip.on('close', (code) => {
                        console.log('Installation finished with code:', code);
                        if (code === 0) {
                            sendProgress(100);
                            sendStatus(`All dependencies installed successfully (${totalPackages} packages processed)`);
                            event.sender.send('venv-done', true);
                        } else {
                            sendStatus('Error installing dependencies');
                            event.sender.send('venv-done', false);
                        }
                    });
                });
            };

            upgradePipIfRequested(continueWithDependencies);
        });

    } catch (err) {
        console.error('Error creating project folder:', err);
        sendStatus('Error creating project folder');
        event.sender.send('venv-done', false);
    }
});

ipcMain.handle('select-project-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('select-requirements-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });

    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
});