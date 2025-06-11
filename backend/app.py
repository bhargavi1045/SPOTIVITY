import os
from uuid import uuid4
from dotenv import load_dotenv
import requests
from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
from urllib.parse import urlencode
from googletrans import Translator
from bs4 import BeautifulSoup


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'fallback_dev_secret_' + str(uuid4()))

translator = Translator()


SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

@app.route('/login')
def login():
    """Initiate Spotify OAuth flow with state parameter"""
    state = str(uuid4())
    session['oauth_state'] = state

    scope = 'user-read-currently-playing'
    params = {
        'response_type': 'code',
        'client_id': os.environ['SPOTIFY_CLIENT_ID'],
        'scope': scope,
        'redirect_uri': os.environ['SPOTIFY_REDIRECT_URI'],
        'state': state,
    }

    auth_url = f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    """Handle Spotify OAuth callback and token exchange"""
    if request.args.get('state') != session.pop('oauth_state', None):
        return jsonify({'error': 'Invalid state parameter'}), 403

    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Authorization code missing'}), 400

    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': os.environ['SPOTIFY_REDIRECT_URI'],
        'client_id': os.environ['SPOTIFY_CLIENT_ID'],
        'client_secret': os.environ['SPOTIFY_CLIENT_SECRET'],
    }

    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
        response.raise_for_status()
        tokens = response.json()
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Token exchange failed: {str(e)}'}), 500

    session['access_token'] = tokens['access_token']
    if 'refresh_token' in tokens:
        session['refresh_token'] = tokens['refresh_token']

    frontend_redirect = f"{os.environ['FRONTEND_REDIRECT_URI']}#access_token={tokens['access_token']}"
    return redirect(frontend_redirect)

@app.route('/refresh')
def refresh_token():
    if 'refresh_token' not in session:
        return jsonify({'error': 'No refresh token available'}), 401

    payload = {
        'grant_type': 'refresh_token',
        'refresh_token': session['refresh_token'],
        'client_id': os.environ['SPOTIFY_CLIENT_ID'],
    }

    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
        response.raise_for_status()
        tokens = response.json()
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Refresh failed: {str(e)}'}), 500

    session['access_token'] = tokens['access_token']
    return jsonify({'access_token': tokens['access_token']})

@app.route('/current_track')
def current_track():
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    headers = {'Authorization': f"Bearer {session['access_token']}"}
    try:
        response = requests.get(f"{SPOTIFY_API_BASE}/me/player/currently-playing", headers=headers)

        if response.status_code == 204:
            return jsonify({'error': 'No track currently playing'}), 404

        response.raise_for_status()
        data = response.json()

        track = {
            'name': data['item']['name'],
            'artist': data['item']['artists'][0]['name'],
            'progress_ms': data['progress_ms'],
            'duration_ms': data['item']['duration_ms'],
            'album_art': data['item']['album']['images'][0]['url'] if data['item']['album']['images'] else None
        }
        return jsonify(track)

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Spotify API error: {str(e)}'}), 500

@app.route('/lyrics')
def get_lyrics():
    if 'access_token' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    track = current_track().get_json()
    if 'error' in track:
        return jsonify(track), track.get('status_code', 400)

    genius_url = search_genius_track(track['name'], track['artist'])
    if not genius_url:
        return jsonify({'error': 'Lyrics not found'}), 404

    lyrics = scrape_lyrics_from_url(genius_url)
    if not lyrics:
        return jsonify({'error': 'Could not scrape lyrics'}), 500

    target_lang = request.args.get('lang', 'en')
    try:
        translated = translator.translate(lyrics, dest=target_lang).text
    except Exception as e:
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

    return jsonify({
        'original': lyrics,
        'translated': translated,
        'language': target_lang,
        'track': track
    })

def search_genius_track(song, artist):
    try:
        url = 'https://api.genius.com/search'
        headers = {'Authorization': f"Bearer {os.environ['GENIUS_API_TOKEN']}"}
        params = {'q': f"{song} {artist}"}

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        hits = response.json().get('response', {}).get('hits', [])
        return hits[0]['result']['url'] if hits else None
    except Exception:
        return None

def scrape_lyrics_from_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        page = requests.get(url, headers=headers)
        page.raise_for_status()

        soup = BeautifulSoup(page.text, 'html.parser')
        containers = soup.find_all('div', attrs={'data-lyrics-container': 'true'})
        return '\n'.join([c.get_text(separator='\n') for c in containers]) if containers else None
    except Exception:
        return None

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        ssl_context=(
            os.environ.get('SSL_CERT_PATH', 'localhost+1.pem'),
            os.environ.get('SSL_KEY_PATH', 'localhost+1-key.pem')
        ),
        debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    )
