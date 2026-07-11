from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__, 
            template_folder='../frontend', 
            static_folder='../frontend')

def init_db():
    with sqlite3.connect('empresa.db') as conn:
        cursor = conn.cursor()
        with open('../database/schema.sql', 'r') as f:
            cursor.executescript(f.read())
        conn.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/produtos', methods=['GET', 'POST'])
def gerenciar_produtos():
    conn = sqlite3.connect('empresa.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        dados = request.json
        cursor.execute("INSERT INTO produtos (nome, quantidade, preco) VALUES (?, ?, ?)",
                       (dados['nome'], dados['quantidade'], dados['preco']))
        conn.commit()
        return jsonify({"status": "sucesso"}), 201
        
    cursor.execute("SELECT * FROM produtos")
    produtos = [{"id": row[0], "nome": row[1], "quantidade": row[2], "preco": row[3]} for row in cursor.fetchall()]
    return jsonify(produtos)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
