const select = document.getElementById('pythonSelect');
const btn = document.getElementById('createBtn');
const progress = document.getElementById('progressBar');
const progressDiv = document.getElementById('progressBarDiv');
const status = document.getElementById('status');
const projectLocationInput = document.getElementById('projectLocation');
const projectLocationBtn = document.getElementById('projectLocationBtn');
const projectNameInput = document.getElementById('projectName');
const summaryText = document.getElementById('summaryDiv');
const requirementsInput = document.getElementById('requirementsFilePath');
const requirementsBtn = document.getElementById('selectRequirementsFileBtn');
const dependenciesSummary = document.getElementById('dependenciesSummary');

function updateSummary() {
    const base = projectLocationInput.value;
    const name = projectNameInput.value;

    if (!base || !name) return;

    let path = base;
    if (!path.endsWith('/') && !path.endsWith('\\')) {
        path += '/';
    }

    const finalPath = path + name;

    summaryText.innerHTML =
        `<small class="text-body-secondary">Project will be created in "${finalPath}"</small>`;
}

projectLocationBtn.onclick = async () => {
    const folder = await window.api.selecProjectFolder();
    if (folder) {
        projectLocationInput.value = folder;
        updateSummary();
    }
};

requirementsBtn.onclick = async () => {
    const file = await window.api.selectRequirementsFile();
    if (file) {
        requirementsInput.value = file;

        // Contar pacotes para summary
        const response = await fetch(`file://${file}`);
        const text = await response.text();
        const packages = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && !line.startsWith(';'));
        dependenciesSummary.innerHTML = `<small class="text-body-secondary">${packages.length} dependencies found in requirements.txt</small>`;
    }
};

projectNameInput.addEventListener('input', updateSummary);
projectLocationInput.addEventListener('input', updateSummary);

async function loadPythonVersions() {
    const versionList = await window.api.getPythons();

    select.innerHTML = '';

    versionList.forEach(py => {
        const option = document.createElement('option');
        option.value = py.command;
        option.textContent = `${py.version} (${py.command})`;
        select.appendChild(option);
    });
}

btn.onclick = () => {
    const python = select.value;
    const venvName = document.getElementById('venvName').value;
    const projectName = document.getElementById('projectName').value;
    const projectLocation = document.getElementById('projectLocation').value;
    const createGitignore = document.getElementById('switchCheckDefault').checked;
    const requirementsPath = requirementsInput.value;

    progressDiv.style.height = '1px';

    if (!venvName || !projectName || !projectLocation) {
        status.textContent = 'Please, fill in all required fields';
        status.hidden = false;
        return;
    }

    progress.style.width = '0%';
    status.textContent = 'Creating project...';

    window.api.createVenv({
        python,
        venvName,
        projectName,
        projectLocation,
        createGitignore,
        requirementsPath
    });
};

window.api.onProgress((value) => {
    progress.style.width = value + '%';
});

window.api.onStatus((text) => {
    status.textContent = text;
});

window.api.onDone((ok) => {
    if (ok) {
        progress.classList.remove('bg-danger');
        progress.classList.add('bg-success');
        
        setTimeout(() => {
            progressDiv.style.height = '0px';
            progress.style.width = '0%';
            progress.classList.remove('bg-success');
            status.hidden = true;
        }, 5000);
    } else {
        status.textContent = 'Process error';
        progress.classList.add('bg-danger');
    }
});

loadPythonVersions();