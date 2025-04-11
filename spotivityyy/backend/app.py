from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(_name_)
CORS(app)

@app.route('/translate')
def translate():
    lang = request.args.get('lang', 'es')
    lyrics = "Hello, is it me you're looking for?"
    translated = f"[{lang.upper()}] Hola, ¿soy yo a quien buscas?"
    return jsonify({"translated_lyrics": translated})

if _name_ == '_main_':
    app.run(debug=True)
