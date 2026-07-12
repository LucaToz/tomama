"use client";

import { useState, useEffect } from "react";
import Vault from "./components/Vault";
import Diary from "./components/Diary";
import { mergeCopy, pickVaultCopy } from "@/lib/copy";
import type { ConfigResponse, UnlockedConfigResponse } from "@/lib/types";
import styles from "./page.module.css";

function isUnlockedConfig(config: ConfigResponse | null): config is UnlockedConfigResponse {
  return Boolean(config?.unlocked);
}

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = () =>
      Promise.all([
        fetch("/api/config", { cache: "no-store" }).then((res) => res.json()),
        fetch("/api/vault/check", { cache: "no-store" }).then((res) => res.json()),
      ])
        .then(([data, session]) => {
          if (cancelled) return;
          setConfig(data as ConfigResponse);
          if (session.unlocked) {
            setUnlocked(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Failed to load config", err);
          setLoading(false);
        });

    loadConfig();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadConfig();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleUnlock = async () => {
    setTransitioning(true);
    try {
      const data = (await fetch("/api/config", { cache: "no-store" }).then((res) =>
        res.json()
      )) as ConfigResponse;
      setConfig(data);
    } catch (err) {
      console.error("Failed to reload config after unlock", err);
    }
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

  const songs = isUnlockedConfig(config) ? config.songs : [];
  const vaultCopy = pickVaultCopy(
    isUnlockedConfig(config) ? config.copy : mergeCopy(config?.copy)
  );
  const diaryCopy = isUnlockedConfig(config) ? mergeCopy(config.copy) : mergeCopy(null);

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
          <Vault copy={vaultCopy} onUnlock={handleUnlock} />
        </div>
      )}
      {unlocked && <Diary songs={songs} copy={diaryCopy} />}
    </main>
  );
}
