import React from 'react';

export default function LyricsDisplay({ lyrics, translatedLyrics }) {
  if (!lyrics) return null;

  // Normalize line breaks and split into lines for original lyrics
  const normalizedOriginal = lyrics.replace(/\r\n|\r/g, '\n');
  const originalLines = normalizedOriginal.split('\n').filter(line => line.trim() !== '');

  // Normalize and split translated lyrics if available
  const normalizedTranslated = translatedLyrics ? translatedLyrics.replace(/\r\n|\r/g, '\n') : '';
  const translatedLines = normalizedTranslated ? normalizedTranslated.split('\n').filter(line => line.trim() !== '') : [];

  return (
    <div className="mt-4 space-y-6 max-h-[400px] overflow-y-auto p-4 bg-gray-100 rounded-lg border border-gray-300 font-sans text-sm">
      <div>
        <h3 className="text-blue-600 font-bold mb-2">Original Lyrics</h3>
        {originalLines.map((line, idx) => {
          const isHeader = /^\[.*\]$/.test(line.trim());
          return (
            <p
              key={`original-${idx}`}
              className={`mb-1 ${isHeader ? 'font-semibold text-blue-700 mt-4' : 'text-gray-700'}`}
            >
              {line.trim()}
            </p>
          );
        })}
      </div>

      {translatedLyrics && (
        <div>
          <h3 className="text-green-600 font-bold mb-2 border-t border-green-300 pt-4">Translated Lyrics</h3>
          {translatedLines.map((line, idx) => {
            const isHeader = /^\[.*\]$/.test(line.trim());
            return (
              <p
                key={`translated-${idx}`}
                className={`mb-1 ${isHeader ? 'font-semibold text-green-700 mt-4' : 'text-gray-700'}`}
              >
                {line.trim()}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
