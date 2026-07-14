"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DiaryPage from "./DiaryPage";
import TapePlayer from "./TapePlayer";
import { formatDiarySubHtml } from "@/lib/copy";
import type { CopyConfig, Song } from "@/lib/types";
import styles from "./Diary.module.css";

const FADE_MS = 400;

function fadeVolume(
  el: HTMLAudioElement,
  to: number,
  duration: number,
  rafRef: React.MutableRefObject<number | null>
) {
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  const from = el.volume;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.volume = from + (to - from) * t;
    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  };
  rafRef.current = requestAnimationFrame(tick);
}

interface DiaryProps {
  songs?: Song[];
  copy?: CopyConfig;
}

export default function Diary({ songs = [], copy = {} as CopyConfig }: DiaryProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRafRef = useRef<number | null>(null);

  /* Autoplay: sbloccato solo dopo il primo play manuale */
  const listeningUnlockedRef = useRef(false);
  /* Sezioni già “consumate” per l’autoplay (una sola volta ciascuna) */
  const visitedSectionsRef = useRef(new Set<number>());
  /* L’utente ha messo in pausa: niente autoplay finché non preme play */
  const userPausedRef = useRef(false);

  const playingSong = songs.find((s) => s.id === playingId);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!playingSong?.audioSrc) {
      if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
      el.pause();
      el.volume = 0;
      return;
    }

    if (el.getAttribute("src") !== playingSong.audioSrc) {
      el.setAttribute("src", playingSong.audioSrc);
      el.load();
    }

    el.volume = 0;
    el.play()
      .then(() => fadeVolume(el, 1, FADE_MS, fadeRafRef))
      .catch(() => {});
  }, [playingId, playingSong?.audioSrc]);

  const togglePlay = useCallback((song: Song) => {
    setPlayingId((cur) => {
      if (cur === song.id) {
        userPausedRef.current = true;
        return null;
      }
      listeningUnlockedRef.current = true;
      userPausedRef.current = false;
      visitedSectionsRef.current.add(song.id);
      return song.id;
    });
  }, []);

  const handleEnterSection = useCallback((song: Song) => {
    if (userPausedRef.current) return;
    if (!listeningUnlockedRef.current) return;
    if (visitedSectionsRef.current.has(song.id)) return;

    visitedSectionsRef.current.add(song.id);

    if (song.audioSrc) {
      setPlayingId(song.id);
      return;
    }
    setPlayingId((cur) => (cur !== null && cur !== song.id ? null : cur));
  }, []);

  /* Sezione attiva = quella che contiene il punto ~22vh (zona player sticky) */
  useEffect(() => {
    if (!songs.length) return;

    let lastActiveId: number | null = null;
    let ticking = false;

    const getActiveSongId = (): number | null => {
      const anchor = window.innerHeight * 0.22;
      let activeId: number | null = null;

      document.querySelectorAll("[data-song-section]").forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= anchor && rect.bottom > anchor) {
          activeId = Number((node as HTMLElement).dataset.songId);
        }
      });

      return activeId;
    };

    const updateActiveSection = () => {
      ticking = false;
      const activeId = getActiveSongId();
      if (activeId === null || activeId === lastActiveId) return;

      lastActiveId = activeId;
      const song = songs.find((s) => s.id === activeId);
      if (song) handleEnterSection(song);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [songs, handleEnterSection]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#pezzo-")) return;
    const el = document.querySelector(hash);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
    }
  }, [songs]);

  return (
    <div className={styles.wrap}>
      <audio ref={audioRef} preload="none" className={styles.hiddenAudio} />

      <header className={styles.header}>
        <div className={styles.stamp}>{copy.diaryStamp}</div>
        <h1 className={styles.band}>{copy.diaryBand}</h1>
        <p
          className={styles.sub}
          dangerouslySetInnerHTML={{
            __html: formatDiarySubHtml(copy.diarySub, songs.length),
          }}
        />
      </header>

      {songs.map((song, i) => (
        <DiaryPage
          key={song.id}
          song={song}
          index={i}
          isFirst={i === 0}
          isPlaying={playingId === song.id}
          onTogglePlay={togglePlay}
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
        <p className={styles.note}>
          {copy.diaryFooter}
          {(copy.instagramUrl || copy.spotifyUrl) && (
            <>
              {" "}
              <span className={styles.footerLinks}>
                {copy.instagramUrl && (
                  <a
                    href={copy.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                  >
                    instagram
                  </a>
                )}
                {copy.instagramUrl && copy.spotifyUrl && " / "}
                {copy.spotifyUrl && (
                  <a
                    href={copy.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                  >
                    spotify
                  </a>
                )}
              </span>
            </>
          )}
        </p>
      </footer>
    </div>
  );
}
