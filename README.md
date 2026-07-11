# Tomama — anteprima pezzi nuovi

Sito standalone, mobile-first, per far ascoltare i 9 pezzi nuovi che si
sbloccano con un codice (card fisiche + QR al concerto). Esperienza "diario"
old school guidata dallo scroll.

## Stack

- **Next.js** (App Router) — `app/`
- **Framer Motion** (`useScroll` + `useTransform`) per tutte le animazioni
  scroll-driven (niente listener manuali su `window`)
- **next/font/google** — Permanent Marker, Special Elite, JetBrains Mono
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
| Codice cassaforte + dati pezzi | `/admin-portal` oppure `data/config.json` (locale) |
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

### Upload da admin (immagini + audio)

1. Su Vercel: **Storage** → crea un **Blob store** e collegalo al progetto.
   Vercel inietta `BLOB_READ_WRITE_TOKEN` in automatico.
2. In locale: copia `.env.example` → `.env.local` e incolla il token dalla tab
   `.env.local` dello store Blob su Vercel.
3. Vai su `/admin-portal`, carica i file e clicca **Salva Modifiche**.

Gli upload passano direttamente a Vercel Blob (client upload), senza il limite
4.5 MB delle serverless function. File grandi usano upload multipart.

### Upload audio bulk da terminale (opzionale)

1. Metti i file audio in `./audio/`.
2. `npm run upload-audio` → stampa gli URL pubblici (cache CDN 1 anno).
3. Incolla ogni URL nel campo `audioSrc` del pezzo in admin o `data/config.json`.

## Deploy su Vercel

1. Push del repo su GitHub e importa il progetto su Vercel.
2. Storage → crea un **Blob store** e collegalo al progetto: `BLOB_READ_WRITE_TOKEN`
   viene iniettato in automatico.
3. Deploy. Nessuna altra configurazione richiesta.

In produzione la configurazione (`vaultCode` + `songs`) viene salvata su
**Vercel Blob** (`data/config.json` nello store), non sul filesystem.
