"use client";
import { useState } from "react";
import LyricsDisplay from "@/components/LyricsDisplay";
import LanguageSelector from "@/components/LanguageSelector";
import Header from "@/components/Header";

export default function Home() {
  const [lyrics, setLyrics] = useState("");
  const [translatedLyrics, setTranslatedLyrics] = useState("");
  const [language, setLanguage] = useState("es");

  const fetchLyrics = async () => {
    const response = await fetch("/api/lyrics");
    const data = await response.json();
    setLyrics(data.lyrics);
  };

  const translateLyrics = async () => {
    const response = await fetch(`/api/translate?lang=${language}`);
    const data = await response.json();
    setTranslatedLyrics(data.translated_lyrics);
  };

  return (
    <div className="container">
      <Header />
      <button onClick={fetchLyrics} className="btn">Get Lyrics</button>
      <button onClick={translateLyrics} className="btn">Translate</button>
      <LanguageSelector setLanguage={setLanguage} />
      <LyricsDisplay lyrics={translatedLyrics || lyrics} />
    </div>
  );
}
