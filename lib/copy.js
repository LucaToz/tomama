export const DEFAULT_COPY = {
  vaultEyebrow: "I PEZZI NUOVI NON SONO ANCORA ONLINE",
  vaultSub: "Se eri lì, lo sai.",
  vaultPlaceholder: "CODICE",
  vaultButton: "apri",
  vaultError: "non è quello giusto.",
  diaryStamp: "SBLOCCATO",
  diaryBand: "Tomama",
  diarySub: "diario di prova — {count} pezzi · 18 luglio, Crema",
  diaryFooter: "resta aggiornato → instagram / whatsapp",
  playlistTitle: "tutti i pezzi",
  loadingText: "caricamento...",
};

export function mergeCopy(copy) {
  return { ...DEFAULT_COPY, ...(copy || {}) };
}

export function formatDiarySub(template, count) {
  return (template || DEFAULT_COPY.diarySub).replace("{count}", String(count));
}
