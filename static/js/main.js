// ============================================================================
// VARIABLES GLOBAIS ÚNICAS (Declaradas apenas uma vez para evitar travamentos)
// ============================================================================
let parqueMaquinas = [];
let listaProcessos = [];
let listaInsumos = [];
let custoMinutoImobiliarioGlobal = 0;
let totalInvestidoEstrutura = 0;
let totalInvestidoMaquinas = 0;
let lucroPorPecaGlobal = 0;

// ============================================================================
// 1. CONTROLE DE INTERFACE, ACESSIBILIDADE E ESCUTA DE ROTAS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const expandido = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !expandido);
            navMenu.classList.toggle('active');
        });
    }

    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-toggle');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                dropdowns.forEach(d => {
                    d.classList.remove('open');
                    d.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                });
                if (!isOpen) {
                    dropdown.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    // SISTEMA DE DIRECIONAMENTO DE TELAS AUTOMÁTICO
    if (document.getElementById('tabelaMaquinas')) renderizarTabelaMaquinas();
    if (document.getElementById('procSelecaoMaquina')) atualizarSelectMaquinas();
    if (document.getElementById('tabelaProcessos')) renderizarTabelaProcessos();
    if (document.getElementById('tabelaInsumos')) renderizarTabelaInsumos();
    if (document.getElementById('custoTotal')) carregarEMotorCustoGlobal();
});

function toggleContraste() { 
    document.body.classList.toggle('alto-contraste'); 
}

let tamanhoFonteAtual = 100;
function alterarFonte(direcao) {
    tamanhoFonteAtual += (direcao * 10);
    if (tamanhoFonteAtual >= 80 && tamanhoFonteAtual <= 140) {
        document.documentElement.style.fontSize = `${tamanhoFonteAtual}%`;
    }
}

function emitirAudioTexto(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(texto);
        mensagem.lang = 'pt-BR';
        mensagem.rate = 1.0;
        window.speechSynthesis.speak(mensagem);
    }
}




// ============================================================================
// 2. MÓDULO IMOBILIÁRIO (PÁGINA: terreno.html)
// ============================================================================
async function calcularCustosImobiliarios() {
    const valor_terreno = parseFloat(document.getElementById('imoTerreno').value) || 0;
    const custo_edificacao = parseFloat(document.getElementById('imoEdificacao').value) || 0;
    const vida_util_anos = parseInt(document.getElementById('imoVidaUtil').value) || 1;
    const impostos_anuais = parseFloat(document.getElementById('imoImpostos').value) || 0;
    const horas_operacionais_ano = parseInt(document.getElementById('imoHorasAno').value) || 1;

    if (valor_terreno <= 0 || custo_edificacao <= 0) {
        alert("Por favor, preencha os valores de terreno e edificação.");
        return;
    }

    totalInvestidoEstrutura = valor_terreno + custo_edificacao;

    const response = await fetch('/api/imobiliario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_terreno, custo_edificacao, vida_util_anos, impostos_anuais, horas_operacionais_ano })
    });

    const box = document.getElementById('resultadoImobiliario');
    box.style.display = "block";

    if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('custoMinutoImobiliario', data.custoMinutoInstalacao);
        localStorage.setItem('totalInvestidoEstrutura', totalInvestidoEstrutura.toString());

        const textoRetorno = `Custos imobiliários processados com sucesso. Impacto de estrutura fixado em R$ ${data.custoMinutoInstalacao.toFixed(4)} por minuto operacional.`;
        box.innerHTML = `<strong>Demonstrativo Imobiliário Teradmas:</strong><br>${textoRetorno}`;
        emitirAudioTexto(textoRetorno);
    } else {
        box.innerHTML = `<p style="color:red;">Erro ao salvar os dados no servidor do Render.</p>`;
    }
}

// ============================================================================
// 3. MÓDULO DE ATIVOS & MÁQUINAS (PÁGINA: maquinas.html)
// ============================================================================
async function adicionarMaquinaServidor() {
    const nome = document.getElementById('maquinaNome').value.trim();
    const preco = parseFloat(document.getElementById('maquinaPreco').value) || 0;
    const vidaUtil = parseInt(document.getElementById('maquinaVidaUtil').value) || 1;
    const valorRevenda = parseFloat(document.getElementById('maquinaValorRevenda').value) || 0;
    const manutencao = parseFloat(document.getElementById('maquinaManutencao').value) || 0;
    const horasAno = parseInt(document.getElementById('maquinaHorasAno').value) || 1;

    if (!nome || preco <= 0) {
        alert("Preencha o nome e o preço do ativo industrial.");
        return;
    }

    const response = await fetch('/api/maquinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nome: nome, 
            preco: preco, 
            vida_util: vidaUtil, 
            valor_revenda: valorRevenda, 
            manutencao: manutencao, 
            horas_ano: horasAno 
        })
    });

    if (response.ok) {
        const dadosCalculados = await response.json();
        
        let parque = JSON.parse(localStorage.getItem('parqueMaquinas')) || [];
        parque.push({
            id: Date.now(),
            nome: nome,
            preco: preco,
            depreciacaoAnual: dadosCalculados.depreciacaoAnual,
            custoFixoAnual: dadosCalculados.custoFixoAnual,
            custoMinuto: dadosCalculados.custoMinuto
        });
        
        localStorage.setItem('parqueMaquinas', JSON.stringify(parque));
        
        totalInvestidoMaquinas = parque.reduce((acc, curr) => acc + curr.preco, 0);
        localStorage.setItem('totalInvestidoMaquinas', totalInvestidoMaquinas.toString());

        renderizarTabelaMaquinas();
        document.getElementById('maquinaNome').value = '';
        
        const aviso = `Ativo ${nome} registrado com sucesso no banco de dados.`;
        emitirAudioTexto(aviso);
    } else {
        alert("Falha ao salvar o ativo no banco PostgreSQL.");
    }
}

function renderizarTabelaMaquinas() {
    const tbody = document.querySelector('#tabelaMaquinas tbody');
    if (!tbody) return;
    
    let parque = JSON.parse(localStorage.getItem('parqueMaquinas')) || [];
    tbody.innerHTML = '';
    
    parque.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${m.nome}</td><td>R$ ${m.depreciacaoAnual.toFixed(2)}</td><td>R$ ${m.custoFixoAnual.toFixed(2)}</td><td>R$ ${m.custoMinuto.toFixed(4)}</td><td><button onclick="removerMaquinaLocal(${m.id})" style="background:#e74c3c; color:white; border:none; padding:4px 8px; cursor:pointer;">Remover</button></td>`;
        tbody.appendChild(tr);
    });
}

function removerMaquinaLocal(id) {
    let parque = JSON.parse(localStorage.getItem('parqueMaquinas')) || [];
    parque = parque.filter(m => m.id !== id);
    localStorage.setItem('parqueMaquinas', JSON.stringify(parque));
    
    totalInvestidoMaquinas = parque.reduce((acc, curr) => acc + curr.preco, 0);
    localStorage.setItem('totalInvestidoMaquinas', totalMaquinas.toString());
    
    renderizarTabelaMaquinas();
}

function atualizarSelectMaquinas() {
    const select = document.getElementById('procSelecaoMaquina');
    if (!select) return;
    
    let parque = JSON.parse(localStorage.getItem('parqueMaquinas')) || [];
    select.innerHTML = '<option value="">-- Selecione uma máquina --</option>';
    
    parque.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.nome;
        select.appendChild(option);
    });
}



// ============================================================================
// 4. MÓDULO DE PROCESSOS & ENCARGOS MOD (PÁGINA: processos.html)
// ============================================================================
function adicionarEtapaProcesso() {
    const maquinaId = document.getElementById('procSelecaoMaquina').value;
    const tempoOperacao = parseFloat(document.getElementById('procTempoOperacao').value) || 0;
    const tempoSetup = parseFloat(document.getElementById('procTempoSetup').value) || 0;
    const salarioBase = parseFloat(document.getElementById('procSalarioMod').value) || 0;
    const encargosPercentual = parseFloat(document.getElementById('procEncargosPercentual').value) || 0;
    const loteTamanho = parseInt(document.getElementById('procLoteTamanho').value) || 1;

    if (!maquinaId) { 
        alert("Selecione uma máquina cadastrada."); 
        return; 
    }

    let parque = JSON.parse(localStorage.getItem('parqueMaquinas')) || [];
    const maquinaSelecionada = parque.find(m => m.id == maquinaId);

    const salarioComEncargos = salarioBase * (1 + (encargosPercentual / 100));
    const minutosMensaisTrabalho = 220 * 60; 
    const custoModMinutoCalculado = salarioComEncargos / minutosMensaisTrabalho;

    const tempoSetupRateado = tempoSetup / loteTamanho;
    const tempoTotalAlocadoPorPeca = tempoOperacao + tempoSetupRateado;

    const custoMaquinaEtapa = tempoOperacao * maquinaSelecionada.custoMinuto;
    const custoSetupEtapa = tempoSetupRateado * maquinaSelecionada.custoMinuto;
    const custoModEtapa = tempoTotalAlocadoPorPeca * custoModMinutoCalculado;
    const custoTotalEtapa = custoMaquinaEtapa + custoSetupEtapa + custoModEtapa;

    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    rotas.push({
        id: Date.now(),
        maquinaNome: maquinaSelecionada.nome,
        tempoOperacao,
        tempoSetupRateado,
        custoMinutoMaquina: maquinaSelecionada.custoMinuto,
        custoModTotal: custoModEtapa,
        custoTotalEtapa
    });

    localStorage.setItem('listaProcessos', JSON.stringify(rotas));
    renderizarTabelaProcessos();
}

function renderizarTabelaProcessos() {
    const tbody = document.querySelector('#tabelaProcessos tbody');
    if (!tbody) return;

    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    tbody.innerHTML = '';
    let totalProcessoGeral = 0;

    rotas.forEach(p => {
        totalProcessoGeral += p.custoTotalEtapa;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.maquinaNome}</td><td>${p.tempoOperacao}</td><td>R$ ${p.custoMinutoMaquina.toFixed(4)}</td><td>${p.tempoSetupRateado.toFixed(2)}</td><td>R$ ${p.custoModTotal.toFixed(2)}</td><td><strong>R$ ${p.custoTotalEtapa.toFixed(2)}</strong></td><td><button onclick="removerProcesso(${p.id})" style="background:#e74c3c; color:white; border:none; padding:4px; cursor:pointer;">X</button></td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('totalProcessoCusto').innerText = totalProcessoGeral.toFixed(2);
    localStorage.setItem('custoTotalProcessos', totalProcessoGeral.toString());
}

function removerProcesso(id) {
    let rotas = JSON.parse(localStorage.getItem('listaProcessos')) || [];
    rotas = rotas.filter(p => p.id !== id);
    localStorage.setItem('listaProcessos', JSON.stringify(rotas));
    renderizarTabelaProcessos();
}
