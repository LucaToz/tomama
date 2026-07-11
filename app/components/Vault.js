"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import styles from "./Vault.module.css";

/**
 * Schermata cassaforte. Sblocco = vaultCode prop.
 */
export default function Vault({ vaultCode, copy, onUnlock }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const codeToCheck = (vaultCode || "TOMAMA").trim().toUpperCase();
    if (value.trim().toUpperCase() === codeToCheck) {
      onUnlock();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.grain} />
      <Lock size={28} color="#8a8378" style={{ marginBottom: 24 }} />
      <p className={styles.eyebrow}>{copy?.vaultEyebrow}</p>
      <p className={styles.sub}>{copy?.vaultSub}</p>

      <div
        className={styles.inputRow}
        style={{ animation: shake ? "shakeCode 0.5s" : "none" }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={copy?.vaultPlaceholder || "CODICE"}
          className={styles.input}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className={styles.cursor}>_</span>
      </div>

      <button onClick={submit} className={styles.btn}>
        {copy?.vaultButton || "apri"}
      </button>

      {shake && <p className={styles.error}>{copy?.vaultError}</p>}
    </div>
  );
}
