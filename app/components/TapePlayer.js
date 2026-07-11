"use client";

import { useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import styles from "./TapePlayer.module.css";

/**
 * Player stile cassetta.
 * - Se song.audioSrc è presente, suona davvero l'audio (Vercel Blob).
 * - Se è null, resta un player "finto" con le sole barre animate.
 * Il play/pausa è controllato dal genitore (un solo pezzo alla volta).
 */
export default function TapePlayer({ song, isPlaying, onToggle }) {
  const audioRef = useRef(null);

  // Sincronizza l'elemento <audio> con lo stato isPlaying deciso dal genitore.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying]);

  return (
    <div className={styles.tape}>
      {song.audioSrc && (
        <audio ref={audioRef} src={song.audioSrc} preload="none" />
      )}

      <button
        onClick={() => onToggle(song)}
        className={styles.btn}
        aria-label={isPlaying ? "pausa" : "play"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className={styles.bars}>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={styles.bar}
            style={{
              animationPlayState: isPlaying ? "running" : "paused",
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <span className={styles.duration}>{song.duration}</span>
    </div>
  );
}
