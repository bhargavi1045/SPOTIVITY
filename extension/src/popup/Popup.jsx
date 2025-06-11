import React, { useState, useEffect } from 'react';
import LyricsDisplay from './LyricsDisplay';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const Popup = () => {
  const [targetLang, setTargetLang] = useState('en');
  const [lyrics, setLyrics] = useState('');
  const [translatedLyrics, setTranslatedLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth status on component mount
  useEffect(() => {
    chrome.storage.local.get(['spotify_token'], (result) => {
      setIsLoggedIn(!!result.spotify_token);
    });
  }, []);

  const handleLogin = () => {
    const clientId = '816ef6b48a3e4836981febf73d06e2bd'; // <-- Replace this
    const redirectUri = chrome.identity.getRedirectURL();
    const scope = 'user-read-currently-playing';

    const authUrl = `https://accounts.spotify.com/authorize` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          setError('Login failed: ' + (chrome.runtime.lastError?.message || 'No redirect URL'));
          return;
        }

        try {
          const fragment = new URL(redirectUrl).hash.substring(1); // Remove leading '#'
          const params = new URLSearchParams(fragment);
          const token = params.get('access_token');

          if (token) {
            chrome.storage.local.set({ spotify_token: token }, () => {
              setIsLoggedIn(true);
              setError('');
            });
          } else {
            setError('No access token found in redirect URL');
          }
        } catch (err) {
          setError('Error processing login: ' + err.message);
        }
      }
    );
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['spotify_token'], () => {
      setIsLoggedIn(false);
      setLyrics('');
      setTranslatedLyrics('');
    });
  };

  const handleTranslate = async () => {
    setLoading(true);
    setError('');
    setLyrics('');
    setTranslatedLyrics('');

    try {
      const { spotify_token } = await new Promise((resolve) => {
        chrome.storage.local.get(['spotify_token'], resolve);
      });

      if (!spotify_token) {
        throw new Error('Please login to Spotify first');
      }

      const response = await fetch('https://localhost:5000/translate_lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_lang: targetLang,
          access_token: spotify_token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translation failed');
      }

      const data = await response.json();
      setLyrics(data.lyrics || 'No lyrics available');
      setTranslatedLyrics(data.translated_lyrics || 'Translation not available');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Spotivity</h2>

      {isLoggedIn ? (
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout from Spotify
        </button>
      ) : (
        <button onClick={handleLogin} style={styles.loginButton}>
          Login with Spotify
        </button>
      )}

      <div style={styles.languageSelector}>
        <label htmlFor="language-select" style={styles.label}>
          Translate to:
        </label>
        <select
          id="language-select"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          style={styles.select}
          disabled={!isLoggedIn}
        >
          {languages.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTranslate}
        disabled={loading || !isLoggedIn}
        style={{
          ...styles.actionButton,
          backgroundColor: !isLoggedIn ? '#cccccc' : loading ? '#666666' : '#333333',
          cursor: !isLoggedIn || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Translating...' : 'Translate Current Song'}
      </button>

      {error && <p style={styles.error}>{error}</p>}

      <LyricsDisplay
        lyrics={lyrics}
        translatedLyrics={translatedLyrics}
        loading={loading}
      />
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '16px',
    width: '320px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  title: {
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: '16px',
  },
  loginButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1DB954',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginBottom: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#ff3333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginBottom: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  languageSelector: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  actionButton: {
    width: '100%',
    padding: '10px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginBottom: '16px',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    margin: '8px 0',
    fontSize: '14px',
  },
};

export default Popup;
