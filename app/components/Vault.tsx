"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import type { VaultCopy } from "@/lib/types";
import styles from "./Vault.module.css";

interface VaultProps {
  copy: VaultCopy;
  onUnlock: () => void;
}

export default function Vault({ copy, onUnlock }: VaultProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = (await res.json()) as { success?: boolean };

      if (data.success) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.grain} />
      <Lock size={28} color="#8a8378" style={{ marginBottom: 24 }} />
      <p className={styles.eyebrow}>{copy.vaultEyebrow}</p>
      <p className={styles.sub}>{copy.vaultSub}</p>

      <div
        className={styles.inputRow}
        style={{ animation: shake ? "shakeCode 0.5s" : "none" }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={copy.vaultPlaceholder || "CODICE"}
          className={styles.input}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={submitting}
        />
        <span className={styles.cursor}>_</span>
      </div>

      <button onClick={submit} className={styles.btn} disabled={submitting}>
        {submitting ? "..." : copy.vaultButton || "apri"}
      </button>

      {shake && <p className={styles.error}>{copy.vaultError}</p>}
    </div>
  );
}
