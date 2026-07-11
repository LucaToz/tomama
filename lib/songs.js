/* ============================================================
   CONFIG — UNICO PUNTO da cambiare per il codice della cassaforte
   ============================================================ */
export const VAULT_CODE = "TOMAMA";

/* ============================================================
   DATI DEI PEZZI
   ------------------------------------------------------------
   Ogni oggetto è indipendente: aggiungere un pezzo = aggiungere
   un blocco qui sotto, tutto il resto si replica da solo.

   Campi:
     id        -> numero univoco
     title     -> titolo del pezzo
     photo     -> cover (fase 1). Path in /public o URL. null = placeholder
     photo2    -> seconda foto (fase 3). null = placeholder
     punchline -> si scrive a macchina in fase 4
     lyrics    -> testo completo (fase 5). Usa \n per andare a capo
     audioSrc  -> URL del file audio su Vercel Blob. null = player "finto"
     duration  -> durata mostrata nel player (es. "2:41")
   ============================================================ */

export function createEmptySong(id) {
  return {
    id,
    title: `Pezzo ${id}`,
    photo: null,
    photo2: null,
    punchline: "",
    lyrics: "",
    audioSrc: null,
    duration: "—:—",
  };
}

export const SONGS = [
  {
    id: 1,
    title: "Antologia Rurale",
    photo: "/songs/song1.jpg",
    photo2: "/songs/song1.jpg", // esempio: sostituisci con la seconda foto vera
    punchline: "lavorare tanto, sognare il giusto",
    lyrics:
      "Prima strofa del pezzo qui.\nSeconda riga che continua il discorso.\n\nRitornello che urli con noi,\ntre accordi e via, non serve altro.\n\nIncolla qui il testo completo quando è pronto.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 2,
    title: "Pezzo 2 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 3,
    title: "Pezzo 3 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 4,
    title: "Pezzo 4 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 5,
    title: "Pezzo 5 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 6,
    title: "Pezzo 6 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 7,
    title: "Pezzo 7 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 8,
    title: "Pezzo 8 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
  {
    id: 9,
    title: "Pezzo 9 — TITOLO QUI",
    photo: null,
    photo2: null,
    punchline: "PUNCHLINE QUI",
    lyrics: "TESTO COMPLETO QUI.",
    audioSrc: null,
    duration: "—:—",
  },
];
