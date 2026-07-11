"use client";

import { useCallback, useState } from "react";
import DiaryPage from "./DiaryPage";
import styles from "./Diary.module.css";

export default function Diary({ songs = [] }) {
  const [playingId, setPlayingId] = useState(null);

  const togglePlay = useCallback((song) => {
    setPlayingId((cur) => (cur === song.id ? null : song.id));
  }, []);

  // Arrivati alla sezione di un nuovo pezzo: se stava suonando un ALTRO pezzo,
  // fermalo (così l'audio non continua mentre leggi/ascolti il successivo).
  const handleEnterSection = useCallback((id) => {
    setPlayingId((cur) => (cur !== null && cur !== id ? null : cur));
  }, []);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.stamp}>SBLOCCATO</div>
        <h1 className={styles.band}>Tomama</h1>
        <p className={styles.sub}>
          diario di prova — {songs.length} pezzi · 18 luglio, Crema
        </p>
      </header>

      {songs.map((song, i) => (
        <DiaryPage
          key={song.id}
          song={song}
          index={i}
          isPlaying={playingId === song.id}
          onTogglePlay={togglePlay}
          onEnterSection={handleEnterSection}
        />
      ))}

      <footer className={styles.footer}>
        <p className={styles.note}>resta aggiornato → instagram / whatsapp</p>
      </footer>
    </div>
  );
}
