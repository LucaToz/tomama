"use client";

import { useState, useEffect } from "react";
import Vault from "./components/Vault";
import Diary from "./components/Diary";
import { mergeCopy } from "@/lib/copy";
import styles from "./page.module.css";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load config", err);
        setLoading(false);
      });
  }, []);

  const handleUnlock = () => {
    setTransitioning(true);
    setTimeout(() => setUnlocked(true), 650);
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>{mergeCopy(null).loadingText}</p>
      </div>
    );
  }

  const vaultCode = config?.vaultCode || "TOMAMA";
  const songs = config?.songs || [];
  const copy = mergeCopy(config?.copy);

  return (
    <main className={styles.app}>
      {!unlocked && (
        <div
          className={styles.vaultOverlay}
          style={{
            clipPath: transitioning
              ? "circle(0% at 50% 50%)"
              : "circle(150% at 50% 50%)",
          }}
        >
          <Vault vaultCode={vaultCode} copy={copy} onUnlock={handleUnlock} />
        </div>
      )}
      {unlocked && <Diary songs={songs} copy={copy} />}
    </main>
  );
}
