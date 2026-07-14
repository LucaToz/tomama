import { sanitizeExternalUrl } from "./urls";
import { sanitizeInlineHtml } from "./html";
import type { CopyConfig } from "./types";

/** Rimuove suffissi social legacy dal footer (es. "→ instagram / whatsapp"). */
export function normalizeDiaryFooter(footer: string): string {
  const text = (footer || DEFAULT_COPY.diaryFooter).trim();
  const arrowIdx = text.indexOf("→");
  if (arrowIdx === -1) return text || DEFAULT_COPY.diaryFooter;

  const prefix = text.slice(0, arrowIdx + 1).trim();
  const suffix = text.slice(arrowIdx + 1).trim();
  if (!suffix) return prefix;

  const isLegacySocial = /^(instagram|whatsapp|spotify)(\s*\/\s*(instagram|whatsapp|spotify))*$/i.test(
    suffix
  );
  return isLegacySocial ? prefix : text;
}

export const DEFAULT_COPY: CopyConfig = {
  vaultEyebrow: "I PEZZI NUOVI NON SONO ANCORA ONLINE",
  vaultSub: "Se eri lì, lo sai.",
  vaultPlaceholder: "CODICE",
  vaultButton: "apri",
  vaultError: "non è quello giusto.",
  diaryStamp: "SBLOCCATO",
  diaryBand: "Tomama",
  diarySub: "diario di prova — {count} pezzi · 18 luglio, Crema",
  diaryFooter: "resta aggiornato →",
  instagramUrl: "",
  spotifyUrl: "",
  playlistTitle: "tutti i pezzi",
  loadingText: "caricamento...",
};

export function mergeCopy(copy?: Partial<CopyConfig> | null): CopyConfig {
  const merged = { ...DEFAULT_COPY, ...(copy || {}) };
  return {
    ...merged,
    diaryFooter: normalizeDiaryFooter(merged.diaryFooter),
    instagramUrl: sanitizeExternalUrl(merged.instagramUrl),
    spotifyUrl: sanitizeExternalUrl(merged.spotifyUrl),
  };
}

export function formatDiarySub(template: string, count: number): string {
  return (template || DEFAULT_COPY.diarySub).replace("{count}", String(count));
}

export function formatDiarySubHtml(template: string, count: number): string {
  return sanitizeInlineHtml(formatDiarySub(template, count));
}

export function pickVaultCopy(copy: CopyConfig): Pick<
  CopyConfig,
  | "vaultEyebrow"
  | "vaultSub"
  | "vaultPlaceholder"
  | "vaultButton"
  | "vaultError"
  | "loadingText"
> {
  return {
    vaultEyebrow: copy.vaultEyebrow,
    vaultSub: copy.vaultSub,
    vaultPlaceholder: copy.vaultPlaceholder,
    vaultButton: copy.vaultButton,
    vaultError: copy.vaultError,
    loadingText: copy.loadingText,
  };
}
