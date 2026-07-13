-- Tabela de Terrenos e Edificações
CREATE TABLE investimentos_iniciais (
    id SERIAL PRIMARY KEY,
    descricao_terreno VARCHAR(255) NOT NULL,
    valor_terreno NUMERIC(12,2) NOT NULL,
    custo_edificacao NUMERIC(12,2) NOT NULL,
    impostos_transferencia NUMERIC(12,2) NOT NULL,
    data_aquisicao DATE DEFAULT CURRENT_DATE
);

-- Tabela de Máquinas e Custos Operacionais
CREATE TABLE maquinas (
    id SERIAL PRIMARY KEY,
    nome_maquina VARCHAR(100) NOT NULL,
    preco_compra NUMERIC(12,2) NOT NULL,
    tempo_vida_util_anos INT NOT NULL,
    valor_revenda_estimado NUMERIC(12,2) NOT NULL,
    custo_manutencao_anual NUMERIC(12,2) NOT NULL,
    horas_ativas_ano INT NOT NULL,
    custo_minuto_maquina NUMERIC(10,4) -- Calculado via trigger ou app
);

-- Tabela de Insumos e Produtos
CREATE TABLE produtos_tabela (
    id SERIAL PRIMARY KEY,
    nome_produto VARCHAR(150) NOT NULL,
    custo_materia_prima NUMERIC(10,2) NOT NULL,
    custo_mao_de_obra NUMERIC(10,2) NOT NULL,
    outros_insumos NUMERIC(10,2) NOT NULL,
    markup_aplicado NUMERIC(5,2) NOT NULL,
    preco_venda_final NUMERIC(10,2) NOT NULL
);
