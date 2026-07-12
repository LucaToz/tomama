"use client";

import { useRef, useState, useCallback, useLayoutEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";
import { Share2, ChevronDown, Check } from "lucide-react";
import TapePlayer from "./TapePlayer";
import { getSongPhotos } from "@/lib/songs";
import type { Song } from "@/lib/types";
import styles from "./DiaryPage.module.css";

const INTRO_VH = 140;
const LYRICS_PEEK_HEIGHT = 88;
const LYRICS_REVEAL_VH_MIN = 140;
const LYRICS_REVEAL_VH_MAX = 240;

const PHOTO_STACK_CONFIG: Record<
  number,
  { runwayVh: number; photos: { atVh: number; revealVh: number }[] }
> = {
  1: { runwayVh: 130, photos: [{ atVh: 0, revealVh: 8 }] },
  2: {
    runwayVh: 200,
    photos: [
      { atVh: 0, revealVh: 8 },
      { atVh: 55, revealVh: 10 },
    ],
  },
  3: {
    runwayVh: 250,
    photos: [
      { atVh: 0, revealVh: 8 },
      { atVh: 50, revealVh: 10 },
      { atVh: 100, revealVh: 10 },
    ],
  },
};

function getPhotoScrollRange(runwayVh: number) {
  return Math.max(runwayVh - 100, 24);
}

function getPhotoStackConfig(count: number) {
  return PHOTO_STACK_CONFIG[count] || PHOTO_STACK_CONFIG[3];
}

function photoProgressPoints(atVh: number, revealVh: number, runwayVh: number) {
  const range = getPhotoScrollRange(runwayVh);
  const start = atVh / range;
  const end = Math.min((atVh + revealVh) / range, 1);
  return { start, end };
}

type PhotoLayout = {
  x: number;
  y: number;
  rotate: number;
  tape: "yellow" | "red" | "green";
  tapeRotate: number;
  tapeLeft: string;
};

const PHOTO_STACK_LAYOUT: PhotoLayout[] = [
  { x: -14, y: 0, rotate: -8, tape: "yellow", tapeRotate: -4, tapeLeft: "50%" },
  { x: 22, y: 38, rotate: 7, tape: "red", tapeRotate: 6, tapeLeft: "42%" },
  { x: -8, y: 76, rotate: -5, tape: "green", tapeRotate: -3, tapeLeft: "56%" },
];

type PhotoVisualStyle = {
  opacity: number | MotionValue<number>;
  scale: number | MotionValue<number>;
  y: number | MotionValue<number>;
  rotate: number | MotionValue<number>;
  zIndex: number;
};

function PhotoStackItemVisual({
  src,
  layout,
  style,
  styles: s,
}: {
  src: string;
  layout: PhotoLayout;
  style: PhotoVisualStyle;
  styles: typeof styles;
}) {
  const { opacity, scale, y, rotate, zIndex } = style;
  const tapeClass =
    layout.tape === "red"
      ? s.washiRed
      : layout.tape === "green"
        ? s.washiGreen
        : s.washiYellow;

  return (
    <motion.div
      className={s.photoStackItem}
      style={{ x: layout.x, opacity, scale, y, rotate, zIndex }}
    >
      <div className={s.coverPhoto}>
        <img src={src} alt="" />
      </div>
      <div
        className={tapeClass}
        style={{
          transform: `translateX(-50%) rotate(${layout.tapeRotate}deg)`,
          left: layout.tapeLeft,
        }}
      />
    </motion.div>
  );
}

function PhotoStackItem({
  src,
  index,
  total,
  progress,
  layout,
  runwayVh,
  styles: s,
}: {
  src: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  layout: PhotoLayout;
  runwayVh: number;
  styles: typeof styles;
}) {
  const [revealed, setRevealed] = useState(false);
  const config = getPhotoStackConfig(total);
  const timing = config.photos[index] || config.photos[config.photos.length - 1];
  const { start, end } = photoProgressPoints(timing.atVh, timing.revealVh, runwayVh);

  useMotionValueEvent(progress, "change", (v) => {
    if (typeof v === "number" && v >= end) {
      setRevealed(true);
    }
  });

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const scale = useTransform(progress, [start, end], [1.15, 1]);
  const y = useTransform(progress, [start, end], [layout.y - 100, layout.y]);
  const rotate = useTransform(progress, [start, end], [layout.rotate + 12, layout.rotate]);

  if (revealed) {
    return (
      <PhotoStackItemVisual
        src={src}
        layout={layout}
        style={{
          opacity: 1,
          scale: 1,
          y: layout.y,
          rotate: layout.rotate,
          zIndex: index + 1,
        }}
        styles={s}
      />
    );
  }

  return (
    <PhotoStackItemVisual
      src={src}
      layout={layout}
      style={{ opacity, scale, y, rotate, zIndex: index + 1 }}
      styles={s}
    />
  );
}

function PhotoStackScroll({
  photos,
  songId,
  styles: s,
}: {
  photos: string[];
  songId: number;
  styles: typeof styles;
}) {
  const photoScrollRef = useRef<HTMLDivElement>(null);
  const config = getPhotoStackConfig(photos.length);
  const stackMinHeight = 280 + (photos.length - 1) * 52;

  const { scrollYProgress: photoProgress } = useScroll({
    target: photoScrollRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={photoScrollRef}
      className={s.photoScrollTrack}
      style={{ height: `${config.runwayVh}vh` }}
    >
      <div className={s.photoStackSticky}>
        <div className={s.photoStack} style={{ minHeight: stackMinHeight }}>
          {photos.map((src, i) => (
            <PhotoStackItem
              key={`${songId}-photo-${i}`}
              src={src}
              index={i}
              total={photos.length}
              progress={photoProgress}
              runwayVh={config.runwayVh}
              layout={PHOTO_STACK_LAYOUT[i] || PHOTO_STACK_LAYOUT[0]}
              styles={s}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

async function fetchCoverFile(photoSrc: string, songId: number) {
  const src = photoSrc.startsWith("http")
    ? photoSrc
    : `${window.location.origin}${photoSrc.startsWith("/") ? photoSrc : `/${photoSrc}`}`;
  const res = await fetch(src);
  if (!res.ok) throw new Error("cover fetch failed");
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "jpg";
  return new File([blob], `tomama-${songId}.${ext}`, { type: blob.type || "image/jpeg" });
}

interface DiaryPageProps {
  song: Song;
  index: number;
  isFirst?: boolean;
  isPlaying: boolean;
  onTogglePlay: (song: Song) => void;
}

export default function DiaryPage({
  song,
  index,
  isFirst = false,
  isPlaying,
  onTogglePlay,
}: DiaryPageProps) {
  const introRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const typingStarted = useRef(false);

  const rotate1 = index % 2 === 0 ? -4 : 5;
  const extraPhotos = getSongPhotos(song);

  const { scrollYProgress } = useScroll({
    target: introRef,
    offset: ["start start", "end end"],
  });

  const coverScale = useTransform(scrollYProgress, [0, 0.65], [1, 0.46]);
  const coverY = useTransform(scrollYProgress, [0, 0.65], ["0%", "-30%"]);
  const coverX = useTransform(scrollYProgress, [0, 0.65], ["0%", "-24%"]);
  const coverOpacity = useTransform(scrollYProgress, [0.55, 0.72], [1, 0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const headerOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLParagraphElement>(null);
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

  const startTyping = useCallback(() => {
    if (typingStarted.current || !song.punchline) return;
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

  useLayoutEffect(() => {
    typingStarted.current = false;
    setCharCount(0);
  }, [song.punchline, song.id]);

  const typedText = song.punchline.slice(0, charCount);
  const typing = charCount > 0 && charCount < song.punchline.length;

  const share = async () => {
    const url = `${window.location.origin}/pezzo/${song.id}`;
    const shareData: ShareData = { title: `Tomama — ${song.title}`, url };

    if (song.photo && navigator.canShare) {
      try {
        const file = await fetchCoverFile(song.photo, song.id);
        const withFiles = { ...shareData, files: [file] };
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          return;
        }
      } catch {
        /* fallback sotto */
      }
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* fallback sotto */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* nessuna azione */
    }
  };

  return (
    <motion.section
      id={`pezzo-${song.id}`}
      data-song-section=""
      data-song-id={song.id}
      className={`${styles.section}${isFirst ? ` ${styles.sectionFirst}` : ""}`}
    >
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

        <div className={styles.body}>
          {extraPhotos.length > 0 && (
            <PhotoStackScroll photos={extraPhotos} songId={song.id} styles={styles} />
          )}

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
              {!typing && charCount > 0 && (
                <span className={styles.quote}>&rdquo;</span>
              )}
              <span className={styles.typeCursor} style={{ opacity: typing ? 1 : 0 }}>
                |
              </span>
            </p>
          </motion.div>

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
