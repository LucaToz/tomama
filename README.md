# Tomama — anteprima pezzi nuovi

Sito standalone, mobile-first, per far ascoltare i 9 pezzi nuovi che si
sbloccano con un codice (card fisiche + QR al concerto). Esperienza "diario"
old school guidata dallo scroll.

## Stack

- **Next.js** (App Router) — `app/`
- **Framer Motion** (`useScroll` + `useTransform`) per tutte le animazioni
  scroll-driven (niente listener manuali su `window`)
- **next/font/google** — Permanent Marker, Caveat, Special Elite, JetBrains Mono
- **Vercel Blob** (`@vercel/blob`) per l'hosting audio
- **lucide-react** per le icone

## Avvio in locale

```bash
npm install
npm run dev
# http://localhost:3000  — codice cassaforte: TOMAMA
```

## Dove si cambia cosa

| Cosa | File |
| --- | --- |
| Codice cassaforte (`VAULT_CODE`) | `lib/songs.js` (in cima) |
| Dati dei 9 pezzi (`SONGS`) | `lib/songs.js` |
| Palette / font token | `app/globals.css` (`:root`) |
| Sequenza a 5 fasi (timing scroll) | `app/components/DiaryPage.js` |

Aggiungere un pezzo = aggiungere un blocco all'array `SONGS`. Tutto il resto
(sezione pinnata, animazioni, player, condivisione) si replica da solo.

## Sequenza scroll (per ogni pezzo)

Ogni pezzo ha una sezione **pinnata** (sticky) durante le 5 fasi:

1. La cover appare near-fullscreen e si **assesta** come polaroid in alto
2. Solo dopo, compaiono **titolo + player**
3. Scrollando entra la **seconda foto** (poi esce del tutto)
4. La **punchline** si scrive a macchina, legata allo scroll
5. Il **foglietto con nastro adesivo** si srotola rivelando il testo

Le foto vivono in fasce dedicate (cover in header, seconda foto al centro che
poi sparisce): **mai sovrapposte al testo**.

## Audio su Vercel Blob

1. In locale copia `.env.example` → `.env.local` e incolla `BLOB_READ_WRITE_TOKEN`
   (Vercel → progetto → Storage → Blob store → tab `.env.local`).
2. Metti i file audio in `./audio/`.
3. `npm run upload-audio` → stampa gli URL pubblici (cache CDN 1 anno).
4. Incolla ogni URL nel campo `audioSrc` del pezzo in `lib/songs.js`.

Quando `audioSrc` è valorizzato il player suona davvero; se è `null` restano
solo le barre animate. Il **download** si sblocca dopo aver premuto play su
tutti e 9 i pezzi.

## Deploy su Vercel

1. Push del repo su GitHub e importa il progetto su Vercel.
2. Storage → crea un **Blob store** e collegalo al progetto: `BLOB_READ_WRITE_TOKEN`
   viene iniettato in automatico.
3. Deploy. Nessuna altra configurazione richiesta.
