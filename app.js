'use strict'

let usuarios = []
let editando = null

async function buscarCEP(cep) {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`)
        if (!response.ok) throw new Error()
        const data = await response.json()

        document.getElementById('endereco').value = data.street || ''
        document.getElementById('bairro').value = data.neighborhood || ''
        document.getElementById('cidade').value = data.city || ''
        document.getElementById('estado').value = data.state || ''
    } catch (error) {
        alert('CEP não encontrado ou erro na rede.')
    }
}

document.getElementById('cep').addEventListener('focusout', e => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length === 8) buscarCEP(cep)
})

function pegarDadosFormulario() {
    return {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        cep: document.getElementById('cep').value,
        endereco: document.getElementById('endereco').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value
    }
}

function limparFormulario() {
    document.querySelectorAll('input').forEach(input => input.value = '')
}

function renderizarUsuarios() {
    const lista = document.getElementById('listaUsuarios')
    lista.innerHTML = ''

    usuarios.forEach((usuario, index) => {
        lista.innerHTML += `
            <div class="card">
                <h3>${usuario.nome}</h3>
                <p><strong>Email:</strong> ${usuario.email}</p>
                <p><strong>Endereço:</strong> ${usuario.endereco}, ${usuario.numero}</p>
                <p>${usuario.bairro} - ${usuario.cidade} / ${usuario.estado}</p>
                <div class="card-buttons">
                    <button onclick="editarUsuario(${index})">Editar</button>
                    <button onclick="excluirUsuario(${index})">Excluir</button>
                </div>
            </div>
        `
    })
}

function salvarUsuario() {
    const dados = pegarDadosFormulario()
    if (!dados.nome) return alert("Preencha ao menos o nome!")
    usuarios.push(dados)
    renderizarUsuarios()
    limparFormulario()
}

function excluirUsuario(index) {
    usuarios.splice(index, 1)
    renderizarUsuarios()
}

function editarUsuario(index) {
    const usuario = usuarios[index]
    editando = index

    for (let key in usuario) {
        if (document.getElementById(key)) document.getElementById(key).value = usuario[key]
    }

    document.getElementById('btnSalvar').hidden = true
    document.getElementById('btnAtualizar').hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function atualizarUsuario() {
    usuarios[editando] = pegarDadosFormulario()
    renderizarUsuarios()
    limparFormulario()
    document.getElementById('btnSalvar').hidden = false
    document.getElementById('btnAtualizar').hidden = true
}

document.getElementById('btnSalvar').addEventListener('click', salvarUsuario)
document.getElementById('btnAtualizar').addEventListener('click', atualizarUsuario)

document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark')
    document.body.classList.toggle('light')
})