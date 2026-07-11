document.getElementById('form-produto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('nome').value,
        quantidade: parseInt(document.getElementById('qtd').value),
        preco: parseFloat(document.getElementById('preco').value)
    };

    await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    document.getElementById('form-produto').reset();
    carregarProdutos();
});

async function carregarProdutos() {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();
    const lista = document.getElementById('lista-produtos');
    lista.innerHTML = '';
    
    produtos.forEach(p => {
        lista.innerHTML += `<li>${p.nome} - Qtd: ${p.quantidade} - R$ ${p.preco.toFixed(2)}</li>`;
    });
}

carregarProdutos();
