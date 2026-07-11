"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DiaryPage from "./DiaryPage";
import TapePlayer from "./TapePlayer";
import { formatDiarySub } from "@/lib/copy";
import styles from "./Diary.module.css";

export default function Diary({ songs = [], copy = {} }) {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const playingSong = songs.find((s) => s.id === playingId);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!playingSong?.audioSrc) {
      el.pause();
      return;
    }

    if (el.getAttribute("src") !== playingSong.audioSrc) {
      el.setAttribute("src", playingSong.audioSrc);
      el.load();
    }

    el.play().catch(() => {});
  }, [playingId, playingSong?.audioSrc]);

  const togglePlay = useCallback((song) => {
    setPlayingId((cur) => (cur === song.id ? null : song.id));
  }, []);

  const handleEnterSection = useCallback((song) => {
    if (song.audioSrc) {
      setPlayingId((cur) => (cur === song.id ? cur : song.id));
      return;
    }
    setPlayingId((cur) => (cur !== null && cur !== song.id ? null : cur));
  }, []);

  return (
    <div className={styles.wrap}>
      <audio ref={audioRef} preload="none" className={styles.hiddenAudio} />

      <header className={styles.header}>
        <div className={styles.stamp}>{copy.diaryStamp}</div>
        <h1 className={styles.band}>{copy.diaryBand}</h1>
        <p className={styles.sub}>{formatDiarySub(copy.diarySub, songs.length)}</p>
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

      <section className={styles.playlist}>
        <h2 className={styles.playlistTitle}>{copy.playlistTitle}</h2>
        <ul className={styles.playlistList}>
          {songs.map((song, i) => (
            <li key={song.id} className={styles.playlistItem}>
              <div className={styles.playlistMeta}>
                <span className={styles.playlistIndex}>
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.playlistName}>{song.title}</span>
              </div>
              <TapePlayer
                song={song}
                isPlaying={playingId === song.id}
                onToggle={togglePlay}
              />
            </li>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <p className={styles.note}>{copy.diaryFooter}</p>
      </footer>
    </div>
  );
}
