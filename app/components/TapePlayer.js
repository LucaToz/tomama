"use client";

import { Play, Pause } from "lucide-react";
import styles from "./TapePlayer.module.css";

/**
 * Player stile cassetta (solo UI).
 * L'audio reale è gestito dal genitore Diary tramite un unico elemento <audio>.
 */
export default function TapePlayer({ song, isPlaying, onToggle }) {
  return (
    <div className={styles.tape}>
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
