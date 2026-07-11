"use client";

import { useRef, useState, useCallback } from "react";
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
const INTRO_VH = 165;

export default function DiaryPage({
  song,
  index,
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

  /* FASE 5: Srotolamento foglietto legato allo scroll */
  const sheetRef = useRef(null);
  const { scrollYProgress: sheetScroll } = useScroll({
    target: sheetRef,
    offset: ["start end", "end 0.95"],
  });
  const sheetScaleY = useTransform(sheetScroll, [0, 0.85], [0.3, 1]);
  const sheetOpacity = useTransform(sheetScroll, [0, 0.4], [0.2, 1]);
  const sheetY = useTransform(sheetScroll, [0, 0.85], [-12, 0]);

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
    const base =
      typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
    const url = `${base}#pezzo-${song.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Tomama — ${song.title}`, url });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch (_) {}
    }
  };

  return (
    <motion.section
      id={`pezzo-${song.id}`}
      className={styles.section}
      onViewportEnter={() => onEnterSection(song.id)}
      viewport={{ once: false, amount: 0.25 }}
    >
      {/* sfondo sfocato/colorato della cover, dietro tutto il pezzo.
          Contenitore con overflow:hidden così lo strato scalato non sfora. */}
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
            viewport={{ once: true, amount: 0.4 }}
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

          {/* FASE 5 — foglietto con nastro adesivo che si srotola dall'alto */}
          <motion.div
            ref={sheetRef}
            className={styles.sheet}
            style={{
              scaleY: sheetScaleY,
              opacity: sheetOpacity,
              y: sheetY,
            }}
          >
            <div className={styles.tapeLeft} />
            <div className={styles.tapeRight} />
            <div className={styles.sheetInner}>
              <p className={styles.lyrics}>{song.lyrics}</p>
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
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
