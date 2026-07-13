import os
import psycopg2
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

def obter_conexao_db():
    url_banco = os.environ.get('DATABASE_URL')
    if url_banco:
        if url_banco.startswith("postgres://"):
            url_banco = url_banco.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(url_banco)
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/imobiliario', methods=['POST'])
def salvar_imobiliario():
    data = request.get_json()
    valor_terreno = float(data.get('valor_terreno', 0))
    custo_edificacao = float(data.get('custo_edificacao', 0))
    impostos_anuais = float(data.get('impostos_anuais', 0))
    vida_util_anos = int(data.get('vida_util_anos', 20))
    horas_operacionais_ano = int(data.get('horas_operacionais_ano', 2400))

    amortizacao_anual = (valor_terreno + custo_edificacao) / vida_util_anos
    custo_imobiliario_anual = amortizacao_anual + impostos_anuais
    minutos_ano = horas_operacionais_ano * 60
    custo_minuto_instalacao = custo_imobiliario_anual / minutos_ano if minutos_ano > 0 else 0

    conn = obter_conexao_db()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO investimentos_iniciais (descricao_terreno, valor_terreno, 
                                                    custo_edificacao, impostos_transferencia) 
                   VALUES (%s, %s, %s, %s);""",
                ('Galpão Industrial Metalúrgico', valor_terreno, custo_edificacao, impostos_anuais)
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({
        'status': 'sucesso',
        'amortizacaoAnual': round(amortizacao_anual, 2),
        'custoAnualTotal': round(custo_imobiliario_anual, 2),
        'custoMinutoInstalacao': round(custo_minuto_instalacao, 4)
    })

@app.route('/api/maquinas', methods=['POST'])
def salvar_maquina():
    data = request.get_json()
    nome = data.get('nome')
    preco = float(data.get('preco', 0))
    vida_util = int(data.get('vida_util', 1))
    valor_revenda = float(data.get('valor_revenda', 0))
    manutencao = float(data.get('manutencao', 0))
    horas_ano = int(data.get('horas_ano', 1))
    
    depreciacao_anual = (preco - valor_revenda) / vida_util
    custo_fixo_anual = depreciacao_anual + manutencao
    minutos_ano = horas_ano * 60
    custo_minuto = custo_fixo_anual / minutos_ano if minutos_ano > 0 else 0

    conn = obter_conexao_db()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO maquinas (nome_maquina, preco_compra, tempo_vida_util_anos, 
                                        valor_revenda_estimado, custo_manutencao_anual, 
                                        horas_ativas_ano, custo_minuto_maquina) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s);""",
                (nome, preco, vida_util, valor_revenda, manutencao, horas_ano, custo_minuto)
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({
        'status': 'sucesso',
        'depreciacaoAnual': round(depreciacao_anual, 2),
        'custoFixoAnual': round(custo_fixo_anual, 2),
        'custoMinuto': round(custo_minuto, 4)
    })

@app.route('/api/calculo-markup', methods=['POST'])
def calcular_markup():
    data = request.get_json()
    custo_total = float(data.get('custo_total', 0))
    margem_lucro = float(data.get('margem_lucro', 0))
    impostos = float(data.get('impostos', 0))
    
    denominador = 1 - ((margem_lucro + impostos) / 100)
    if denominador <= 0:
        return jsonify({'error': 'Margem ou impostos excessivos'}), 400
        
    markup = 1 / denominador
    preco_venda = custo_total * markup
    
    return jsonify({
        'markup': round(markup, 2),
        'preco_venda': round(preco_venda, 2)
    })

# NOVO ENDPOINT: Análise Financeira para os Acionistas
@app.route('/api/acionistas-payback', methods=['POST'])
def calcular_payback():
    data = request.get_json()
    investimento_total = float(data.get('investimento_total', 0))
    lucro_liquido_mensal = float(data.get('lucro_liquido_mensal', 0))
    
    if lucro_liquido_mensal <= 0:
        return jsonify({'error': 'O lucro líquido mensal precisa ser maior que zero'}), 400
        
    payback_meses = investimento_total / lucro_liquido_mensal
    roi_anual = ((lucro_liquido_mensal * 12) / investimento_total) * 100
    
    return jsonify({
        'payback_meses': round(payback_meses, 1),
        'roi_anual': round(roi_anual, 2)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)




# Adicione estas rotas ao seu arquivo app.py existente

@app.route('/terreno')
def pagina_terreno():
    return render_template('terreno.html')

@app.route('/maquinas')
def pagina_maquinas():
    return render_template('maquinas.html')

@app.route('/processos')
def pagina_processos():
    return render_template('processos.html')

@app.route('/materiais')
def pagina_materiais():
    return render_template('materiais.html')

@app.route('/precificacao')
def pagina_precificacao():
    return render_template('precificacao.html')

@app.route('/retorno')
def pagina_retorno():
    return render_template('retorno.html')
