const select = document.getElementById('pythonSelect');
const btn = document.getElementById('createBtn');
const progress = document.getElementById('progressBar');
const progressDiv = document.getElementById('progressBarDiv');
const status = document.getElementById('status');

const projectLocationInput = document.getElementById('projectLocation');
const projectLocationBtn = document.getElementById('projectLocationBtn');
const projectNameInput = document.getElementById('projectName');
const summaryText = document.getElementById('summaryDiv');

function atualizarResumo() {
    const base = projectLocationInput.value;
    const nome = projectNameInput.value;

    if (!base || !nome) return;

    // normaliza barras
    let caminho = base;
    if (!caminho.endsWith('/') && !caminho.endsWith('\\')) {
        caminho += '/';
    }

    const finalPath = caminho + nome;

    summaryText.innerHTML =
        `<small class="text-body-secondary">Project will be created in "${finalPath}"</small>`;
}

// botão de selecionar pasta
projectLocationBtn.onclick = async () => {
    const pasta = await window.api.selecionarPastaProjeto();
    if (pasta) {
        projectLocationInput.value = pasta;
        atualizarResumo();
    }
};

// atualizar resumo ao digitar
projectNameInput.addEventListener('input', atualizarResumo);
projectLocationInput.addEventListener('input', atualizarResumo);

async function carregarPythons() {
    const lista = await window.api.getPythons();

    select.innerHTML = '';

    lista.forEach(py => {
        const option = document.createElement('option');
        option.value = py.comando;
        option.textContent = `${py.versao} (${py.comando})`;
        select.appendChild(option);
    });
}

// btn.onclick = () => {
//     const python = select.value;
//     const nome = document.getElementById('venvName').value;
//     progressDiv.style.height = '10px';

//     if (!nome) {
//         status.textContent = 'Digite um nome para a venv';
//         return;
//     }

//     progress.style.width = '10%';
//     status.textContent = 'Criando ambiente virtual...';

//     window.api.criarVenv({ python, nome });
// };

btn.onclick = () => {
    const python = select.value;
    const nomeVenv = document.getElementById('venvName').value;
    const projectName = document.getElementById('projectName').value;
    const projectLocation = document.getElementById('projectLocation').value;

    progressDiv.style.height = '10px';

    if (!nomeVenv || !projectName || !projectLocation) {
        status.textContent = 'Preencha todos os campos';
        return;
    }

    progress.style.width = '10%';
    status.textContent = 'Criando projeto...';

    window.api.criarVenv({
        python,
        nomeVenv,
        projectName,
        projectLocation
    });
};


window.api.onProgress((value) => {
    progress.style.width = value + '%';
});

window.api.onDone((ok) => {
    if (ok) {
        status.textContent = 'Venv criada com sucesso!';
        progress.classList.remove('bg-danger');
        progress.classList.add('bg-success');
        
        // set height to 0px after 1 second
        setTimeout(() => {
            progressDiv.style.height = '0px';
            progress.style.width = '0%';
            progress.classList.remove('bg-success');
        }, 1000);
    } else {
        status.textContent = 'Erro ao criar a venv';
        progress.classList.add('bg-danger');
    }
});

carregarPythons();
