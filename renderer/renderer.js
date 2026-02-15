const select = document.getElementById('pythonSelect');
const btn = document.getElementById('createBtn');
const progress = document.getElementById('progressBar');
const status = document.getElementById('status');

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

btn.onclick = () => {
    const python = select.value;
    const nome = document.getElementById('venvName').value;

    if (!nome) {
        status.textContent = 'Digite um nome para a venv';
        return;
    }

    progress.style.width = '10%';
    status.textContent = 'Criando ambiente virtual...';

    window.api.criarVenv({ python, nome });
};

window.api.onProgress((value) => {
    progress.style.width = value + '%';
});

window.api.onDone((ok) => {
    if (ok) {
        status.textContent = 'Venv criada com sucesso!';
        progress.classList.remove('bg-danger');
        progress.classList.add('bg-success');
    } else {
        status.textContent = 'Erro ao criar a venv';
        progress.classList.add('bg-danger');
    }
});

carregarPythons();
