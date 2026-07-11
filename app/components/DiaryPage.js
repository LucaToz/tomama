"use client";

import { useRef, useState, useCallback, useLayoutEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Share2, ChevronDown, Check } from "lucide-react";
import TapePlayer from "./TapePlayer";
import styles from "./DiaryPage.module.css";

/*
  Ogni pezzo:

  1) INTRO PINNATA (scroll-driven): la cover appare near-fullscreen e si
     "assesta" vicino al player, mentre lo sfondo colorato entra.

  2) HEADER GLASS STICKY: cover mini + titolo + player restano agganciati in
     alto (effetto liquid glass) per TUTTA la sezione del pezzo. Quando si
     arriva al pezzo successivo, questo header si stacca e riparte quello del
     nuovo pezzo (ogni sezione ha il suo).

  3) CORPO IN FLUSSO: seconda foto → punchline → foglietto. Appaiono una volta
     e RESTANO visibili, impilati senza sovrapporsi.
*/
const INTRO_VH = 140;
const LYRICS_PEEK_HEIGHT = 88;
const LYRICS_REVEAL_VH_MIN = 140;
const LYRICS_REVEAL_VH_MAX = 240;

async function fetchCoverFile(photoSrc, songId) {
  const src = photoSrc.startsWith("http")
    ? photoSrc
    : `${window.location.origin}${photoSrc.startsWith("/") ? photoSrc : `/${photoSrc}`}`;
  const res = await fetch(src);
  if (!res.ok) throw new Error("cover fetch failed");
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "jpg";
  return new File([blob], `tomama-${songId}.${ext}`, { type: blob.type || "image/jpeg" });
}

export default function DiaryPage({
  song,
  index,
  isFirst = false,
  isPlaying,
  onTogglePlay,
  onEnterSection,
}) {
  const introRef = useRef(null);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const typingStarted = useRef(false);

  const rotate1 = index % 2 === 0 ? -4 : 5;
  const rotate2 = index % 2 === 0 ? 6 : -5;

  // progress 0→1 sulla sola zona di intro pinnata
  const { scrollYProgress } = useScroll({
    target: introRef,
    offset: ["start start", "end end"],
  });

  /* FASE 1: cover che si assesta vicino al player */
  const coverScale = useTransform(scrollYProgress, [0, 0.65], [1, 0.46]);
  const coverY = useTransform(scrollYProgress, [0, 0.65], ["0%", "-30%"]);
  const coverX = useTransform(scrollYProgress, [0, 0.65], ["0%", "-24%"]);
  const coverOpacity = useTransform(scrollYProgress, [0.55, 0.72], [1, 0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  /* FASE 2: header (compare quando la cover si è assestata, poi resta) */
  const headerOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1]);

  /* hint "scorri" */
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  /* FASE 5: testo che si svela a accordion mentre scorri */
  const sheetScrollRef = useRef(null);
  const lyricsRef = useRef(null);
  const [lyricsFullHeight, setLyricsFullHeight] = useState(LYRICS_PEEK_HEIGHT);

  useLayoutEffect(() => {
    if (lyricsRef.current) {
      setLyricsFullHeight(lyricsRef.current.scrollHeight);
    }
  }, [song.lyrics]);

  const revealRunwayVh = Math.min(
    LYRICS_REVEAL_VH_MAX,
    Math.max(LYRICS_REVEAL_VH_MIN, 100 + Math.round(lyricsFullHeight / 28))
  );

  /* Pista di scroll pinnata: mentre scorri qui il foglietto resta fermo
     e il testo si apre; solo a progress=1 riprende lo scroll della pagina. */
  const { scrollYProgress: revealProgress } = useScroll({
    target: sheetScrollRef,
    offset: ["start start", "end end"],
  });

  const lyricsMaxHeight = useTransform(revealProgress, (v) => {
    const end = Math.max(lyricsFullHeight, LYRICS_PEEK_HEIGHT + 1);
    return LYRICS_PEEK_HEIGHT + v * (end - LYRICS_PEEK_HEIGHT);
  });

  const shareOpacity = useTransform(revealProgress, [0.92, 1], [0, 1]);
  const lyricsFadeOpacity = useTransform(revealProgress, [0, 0.2, 0.88, 1], [1, 1, 0.35, 0]);

  /* punchline a macchina da scrivere, quando entra in vista */
  const startTyping = useCallback(() => {
    if (typingStarted.current) return;
    typingStarted.current = true;
    const full = song.punchline;
    let i = 0;
    const tick = () => {
      i += 1;
      setCharCount(i);
      if (i < full.length) setTimeout(tick, 45);
    };
    tick();
  }, [song.punchline]);

  const typedText = song.punchline.slice(0, charCount);
  const typing = charCount > 0 && charCount < song.punchline.length;

  const share = async () => {
    const url = `${window.location.origin}/pezzo/${song.id}`;
    const shareData = { title: `Tomama — ${song.title}`, url };

    if (song.photo && navigator.canShare) {
      try {
        const file = await fetchCoverFile(song.photo, song.id);
        const withFiles = { ...shareData, files: [file] };
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          return;
        }
      } catch (_) {}
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  return (
    <motion.section
      id={`pezzo-${song.id}`}
      className={`${styles.section}${isFirst ? ` ${styles.sectionFirst}` : ""}`}
      onViewportEnter={() => onEnterSection(song)}
      viewport={{ once: false, amount: 0.25 }}
    >
      {/* sfondo sfocato: sticky full-viewport, opacità legata allo scroll intro */}
      <motion.div className={styles.blurBg} style={{ opacity: bgOpacity }}>
        <div
          className={styles.blurBgInner}
          style={{
            backgroundImage: song.photo
              ? `linear-gradient(rgba(243,236,218,0.35), rgba(243,236,218,0.58)), url(${song.photo})`
              : "none",
          }}
        />
      </motion.div>

      <div className={styles.songInner}>
        {/* HEADER GLASS STICKY (persiste per tutta la sezione) */}
        <motion.header className={styles.stickyHeader} style={{ opacity: headerOpacity }}>
          <div className={styles.headerPolaroid} style={{ transform: `rotate(${rotate1}deg)` }}>
            {song.photo ? (
              <img src={song.photo} alt="" />
            ) : (
              <span className={styles.placeholderMini}>COVER</span>
            )}
            <div className={styles.washiMini} />
          </div>
          <div className={styles.headerText}>
            <span className={styles.index}>#{String(index + 1).padStart(2, "0")}</span>
            <h2 className={styles.title}>{song.title}</h2>
            <TapePlayer song={song} isPlaying={isPlaying} onToggle={onTogglePlay} />
          </div>
        </motion.header>

        {/* INTRO PINNATA — cover che si assesta */}
        <div ref={introRef} className={styles.intro} style={{ height: `${INTRO_VH}vh` }}>
          <div className={styles.introSticky}>
            <motion.div
              className={styles.coverFull}
              style={{ scale: coverScale, x: coverX, y: coverY, opacity: coverOpacity }}
            >
              <div className={styles.coverPolaroid} style={{ transform: `rotate(${rotate1}deg)` }}>
                <div className={styles.coverPhoto}>
                  {song.photo ? (
                    <img src={song.photo} alt={song.title} />
                  ) : (
                    <span className={styles.placeholder}>COVER QUI</span>
                  )}
                </div>
                <div className={styles.washi} />
              </div>
            </motion.div>

            <motion.div className={styles.scrollHint} style={{ opacity: hintOpacity }}>
              <ChevronDown size={14} /> scorri
            </motion.div>
          </div>
        </div>

        {/* CORPO — appaiono e RESTANO */}
        <div className={styles.body}>
          {/* FASE 3 — seconda foto */}
          <motion.div
            className={styles.photo2}
            style={{ rotate: rotate2 }}
            initial={{ opacity: 0, y: 48, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 110, damping: 15 }}
          >
            <div className={styles.coverPhoto}>
              {song.photo2 ? (
                <img src={song.photo2} alt="" />
              ) : (
                <span className={styles.placeholder}>FOTO 2 QUI</span>
              )}
            </div>
            <div className={styles.washiRed} />
          </motion.div>

          {/* FASE 4 — punchline a macchina da scrivere */}
          <motion.div
            className={styles.punchLayer}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            onViewportEnter={startTyping}
          >
            <p className={styles.punchline}>
              <span className={styles.quote}>&ldquo;</span>
              <span>{typedText}</span>
              <span className={styles.typeCursor} style={{ opacity: typing ? 1 : 0 }}>
                |
              </span>
            </p>
          </motion.div>

          {/* FASE 5 — pista pinnata: scroll bloccato sul foglietto finché il testo non è aperto */}
          <div
            ref={sheetScrollRef}
            className={styles.sheetScrollTrack}
            style={{ height: `${revealRunwayVh}vh` }}
          >
            <div className={styles.sheet}>
              <div className={styles.tapeLeft} />
              <div className={styles.tapeRight} />
              <div className={styles.sheetInner}>
                <motion.div
                  className={styles.lyricsReveal}
                  style={{ maxHeight: lyricsMaxHeight }}
                >
                  <p ref={lyricsRef} className={styles.lyrics}>
                    {song.lyrics}
                  </p>
                  <motion.div
                    className={styles.lyricsFade}
                    style={{ opacity: lyricsFadeOpacity }}
                    aria-hidden="true"
                  />
                </motion.div>
                <motion.div style={{ opacity: shareOpacity }}>
                  <button onClick={share} className={styles.shareBtn}>
                    {copied ? (
                      <>
                        <Check size={13} /> link copiato
                      </>
                    ) : (
                      <>
                        <Share2 size={13} /> condividi questo pezzo
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
