'use strict'

let usuarios = []
let editando = null

// Inicialização das escutas de eventos e carga inicial
document.addEventListener('DOMContentLoaded', () => {
    carregarEstados()
    
    document.getElementById('cep').addEventListener('input', mapearMascaraCEP)
    document.getElementById('cep').addEventListener('focusout', validarEDispararCEP)
    document.getElementById('numero').addEventListener('blur', validarNumero)
    document.getElementById('emailProvider').addEventListener('change', atualizarDominioEmail)
    document.getElementById('estado').addEventListener('change', carregarCidadesPorEstado)
    
    document.getElementById('btnSalvar').addEventListener('click', salvarUsuario)
    document.getElementById('btnAtualizar').addEventListener('click', atualizarUsuario)
    
    document.getElementById('themeToggle').addEventListener('change', () => {
        document.body.classList.toggle('dark')
        document.body.classList.toggle('light')
    })
})

// Modifica o texto estático do domínio do e-mail ao alterar o select
function atualizarDominioEmail(e) {
    document.getElementById('domainLabel').textContent = e.target.value
}

// Formata o CEP automaticamente com hífen enquanto o usuário digita
function mapearMascaraCEP(e) {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    e.target.value = value
}

// Dispara a validação visual do CEP e consome a API externa
async function validarEDispararCEP(e) {
    const input = e.target
    const errorSpan = document.getElementById('error-cep')
    const cep = input.value.replace(/\D/g, '')

    if (cep.length !== 8) {
        aplicarErroVisual(input, errorSpan, true)
        return
    }

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`)
        if (!response.ok) throw new Error()
        const data = await response.json()

        aplicarErroVisual(input, errorSpan, false)
        
        document.getElementById('endereco').value = data.street || ''
        document.getElementById('bairro').value = data.neighborhood || ''
        
        // Sincroniza o select de estado
        const selectEstado = document.getElementById('estado')
        selectEstado.value = data.state || ''
        
        // Carrega as cidades daquele estado e seleciona a cidade retornada
        await carregarCidadesPorEstado({ target: selectEstado }, data.city)

    } catch (error) {
        aplicarErroVisual(input, errorSpan, true)
        limparCamposEndereco()
    }
}

// Validação do campo número (Não aceita strings vazias ou apenas espaços)
function validarNumero() {
    const input = document.getElementById('numero')
    const errorSpan = document.getElementById('error-numero')
    
    if (input.value.trim() === "") {
        aplicarErroVisual(input, errorSpan, true)
        return false
    } else {
        aplicarErroVisual(input, errorSpan, false)
        return true
    }
}

function aplicarErroVisual(input, errorElement, statusErro) {
    if (statusErro) {
        input.classList.add('input-error')
        errorElement.classList.add('active')
    } else {
        input.classList.remove('input-error')
        errorElement.classList.remove('active')
    }
}

// Consome a API pública para alimentar o Select de Estados nativos do Brasil
async function carregarEstados() {
    try {
        const response = await fetch('https://brasilapi.com.br/api/ibge/uf/v1')
        const estados = await response.json()
        
        // Ordena estados por ordem alfabética de nome
        estados.sort((a, b) => a.nome.localeCompare(b.nome))
        
        const selectEstado = document.getElementById('estado')
        estados.forEach(uf => {
            const option = document.createElement('option')
            option.value = uf.sigla
            option.textContent = `${uf.nome} (${uf.sigla})`
            selectEstado.appendChild(option)
        })
    } catch (e) {
        console.error("Erro ao carregar estados da BrasilAPI")
    }
}

// Consome as cidades baseado no estado selecionado na hierarquia
async function carregarCidadesPorEstado(e, cidadeParaSelecionar = '') {
    const siglaUF = e.target.value
    const datalist = document.getElementById('listaCidades')
    const inputCidade = document.getElementById('cidade')
    const labelCidade = document.getElementById('labelCidade')
    
    datalist.innerHTML = ''
    
    if (!siglaUF) {
        inputCidade.disabled = true
        inputCidade.value = ''
        labelCidade.textContent = "Cidade (Selecione o Estado)"
        return
    }

    try {
        labelCidade.textContent = "Carregando cidades..."
        const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${siglaUF}?provedor=dados-abertos`)
        const cidades = await response.json()
        
        cidades.forEach(municipio => {
            const option = document.createElement('option')
            option.value = municipio.nome
            datalist.appendChild(option)
        })
        
        inputCidade.disabled = false
        labelCidade.textContent = "Cidade"
        
        if (cidadeParaSelecionar) {
            inputCidade.value = cidadeParaSelecionar
        }
    } catch (error) {
        console.error("Erro ao buscar cidades")
    }
}

function pegarDadosFormulario() {
    const sufixoEmail = document.getElementById('emailProvider').value
    const prefixoEmail = document.getElementById('emailUser').value
    
    return {
        nome: document.getElementById('nome').value,
        email: prefixoEmail ? `${prefixoEmail}${sufixoEmail}` : '',
        cep: document.getElementById('cep').value,
        endereco: document.getElementById('endereco').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value
    }
}

function limparFormulario() {
    document.querySelectorAll('.form-container input').forEach(input => input.value = '')
    document.getElementById('estado').value = ''
    document.getElementById('cidade').disabled = true
    document.getElementById('labelCidade').textContent = "Cidade (Selecione o Estado)"
    
    // Reseta validações visuais
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'))
    document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('active'))
}

function limparCamposEndereco() {
    document.getElementById('endereco').value = ''
    document.getElementById('bairro').value = ''
    document.getElementById('cidade').value = ''
    document.getElementById('estado').value = ''
}

function renderizarUsuarios() {
    const lista = document.getElementById('listaUsuarios')
    lista.innerHTML = ''

    usuarios.forEach((usuario, index) => {
        lista.innerHTML += `
            <div class="card">
                <h3>${usuario.nome}</h3>
                <p><strong>Email:</strong> ${usuario.email}</p>
                <p><strong>Endereço:</strong> ${usuario.endereco}, Nº ${usuario.numero}</p>
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
    const numeroValido = validarNumero()
    
    if (!dados.nome) return alert("Preencha ao menos o nome!")
    if (!numeroValido) return
    
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

    document.getElementById('nome').value = usuario.nome
    document.getElementById('cep').value = usuario.cep
    document.getElementById('endereco').value = usuario.endereco
    document.getElementById('numero').value = usuario.numero
    document.getElementById('bairro').value = usuario.bairro
    
    // Trata a separação do e-mail de volta para o input e select
    if (usuario.email.includes('@')) {
        const partesEmail = usuario.email.split('@')
        document.getElementById('emailUser').value = partesEmail[0]
        const provedor = `@${partesEmail[1]}`
        document.getElementById('emailProvider').value = provedor
        document.getElementById('domainLabel').textContent = provedor
    }

    // Alimenta estado e carrega as cidades de forma síncrona para edição
    const selectEstado = document.getElementById('estado')
    selectEstado.value = usuario.estado
    carregarCidadesPorEstado({ target: selectEstado }, usuario.cidade)

    document.getElementById('btnSalvar').hidden = true
    document.getElementById('btnAtualizar').hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function atualizarUsuario() {
    if (!validarNumero()) return
    usuarios[editando] = pegarDadosFormulario()
    renderizarUsuarios()
    limparFormulario()
    document.getElementById('btnSalvar').hidden = false
    document.getElementById('btnAtualizar').hidden = true
}