"use client";

import { Play, Pause } from "lucide-react";
import type { Song } from "@/lib/types";
import styles from "./TapePlayer.module.css";

interface TapePlayerProps {
  song: Song;
  isPlaying: boolean;
  onToggle: (song: Song) => void;
}

export default function TapePlayer({ song, isPlaying, onToggle }: TapePlayerProps) {
  return (
    <div className={`${styles.tape} ${isPlaying ? styles.tapePlaying : ""}`}>
      <button
        onClick={() => onToggle(song)}
        className={styles.btn}
        aria-label={isPlaying ? "pausa" : "play"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className={styles.reels} aria-hidden="true">
        <span className={`${styles.reel} ${isPlaying ? styles.reelSpin : ""}`} />
        <span className={`${styles.reel} ${isPlaying ? styles.reelSpin : ""}`} />
      </div>

      <div className={`${styles.bars} ${isPlaying ? styles.barsPlaying : ""}`}>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={styles.bar}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </div>

      <span className={styles.duration}>{song.duration}</span>
    </div>
  );
}
