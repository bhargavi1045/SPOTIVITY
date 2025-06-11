// src/api/lyricsApi.jsx

export const fetchLyricsAndTranslation = async (song, artist, targetLang = 'en') => {
  try {
    const response = await fetch('http://127.0.0.1:5000/translate_lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        song_title: song,
        artist_name: artist,
        target_lang: targetLang.toLowerCase(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch lyrics');
    }

    const data = await response.json();

    return {
      originalLyrics: data.lyrics,
      translatedLyrics: data.translated_lyrics,
      sourceUrl: data.source,
    };
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    throw error;
  }
};
