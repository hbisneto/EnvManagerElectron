const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const { dialog } = require('electron');
const fs = require('fs');

app.disableHardwareAcceleration();

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('renderer/index.html');
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

            if (!versao.startsWith('Python 3')) {
                console.log(`Ignorado (não é Python 3): ${versao}`);
                return resolve(null);
            }

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
    const unicos = [];
    const versoes = new Set();

    for (const py of lista) {
        if (!versoes.has(py.versao)) {
            versoes.add(py.versao);
            unicos.push(py);
        }
    }

    console.log('Pythons detectados:', unicos);
    return unicos;
}

ipcMain.handle('get-pythons', async () => {
    return await detectarPythons();
});

ipcMain.on('criar-venv', (event, dados) => {
    const { python, nomeVenv, projectName, projectLocation, createGitignore, requirementsPath } = dados;

    const projectPath = path.join(projectLocation, projectName);

    function sendStatus(text) {
        console.log(text);
        event.sender.send('venv-status', text);
    }

    function sendProgress(value) {
        event.sender.send('venv-progress', value);
    }


    console.log('Projeto será criado em:', projectPath);

    try {
        if (!fs.existsSync(projectPath)) {
            console.log('Criando pasta do projeto...');
            fs.mkdirSync(projectPath, { recursive: true });
        }

        if (createGitignore) {
            const gitignorePath = path.join(projectPath, '.gitignore');

            const gitignoreContent = `
# EnvManager Suggested .gitignore content
${nomeVenv}/

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
            console.log('.gitignore criado');
        }

        event.sender.send('venv-progress', 20);

        const partes = python.split(' ');
        const cmd = partes[0];
        const args = partes.slice(1);

        console.log(`Criando venv: ${nomeVenv} com ${python}`);

        const processo = spawn(
            cmd,
            [...args, '-m', 'venv', nomeVenv],
            { cwd: projectPath }
        );

        processo.stdout.on('data', (data) => {
            console.log('[PYTHON]', data.toString());
            event.sender.send('venv-progress', 60);
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

    } catch (err) {
        console.error('Erro ao criar pasta do projeto:', err);
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