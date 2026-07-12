import { sanitizeExternalUrl } from "./urls";
import { sanitizeInlineHtml } from "./html";
import type { CopyConfig } from "./types";

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
