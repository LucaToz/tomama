/**
 * Upload dei file audio su Vercel Blob.
 *
 * USO:
 *   1. Metti i file audio (.mp3/.m4a/.wav) nella cartella ./audio del progetto
 *   2. Copia .env.example in .env.local e incolla il tuo BLOB_READ_WRITE_TOKEN
 *      (Vercel > progetto > Storage > Blob store > tab ".env.local")
 *   3. npm run upload-audio
 *   4. Copia gli URL stampati nel campo audioSrc di ogni pezzo in lib/songs.js
 *
 * Perché uno script e non una route API: caricando da qui i file passano
 * diretti allo store, senza il limite di 4.5 MB del body delle serverless
 * function — comodo per gli audio e adatto al piano free/hobby.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { put } from "@vercel/blob";
import "dotenv/config";

const AUDIO_DIR = join(process.cwd(), "audio");
const AUDIO_EXT = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac", ".flac"]);
const CONTENT_TYPE = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
};

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "✗ Manca BLOB_READ_WRITE_TOKEN. Crea .env.local con il token del tuo Blob store."
    );
    process.exit(1);
  }

  let files;
  try {
    files = (await readdir(AUDIO_DIR)).filter((f) =>
      AUDIO_EXT.has(extname(f).toLowerCase())
    );
  } catch {
    console.error(`✗ Cartella non trovata: ${AUDIO_DIR}\n  Crea ./audio e metti dentro i file.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("✗ Nessun file audio in ./audio");
    process.exit(1);
  }

  console.log(`Trovati ${files.length} file. Carico su Vercel Blob...\n`);

  for (const file of files) {
    const buf = await readFile(join(AUDIO_DIR, file));
    const ext = extname(file).toLowerCase();
    const blob = await put(`audio/${file}`, buf, {
      access: "public",
      addRandomSuffix: false, // URL stabile e prevedibile
      contentType: CONTENT_TYPE[ext] || "application/octet-stream",
      // caching lungo: gli audio non cambiano, li serve la CDN di Vercel
      cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 anno
    });
    console.log(`✓ ${file}`);
    console.log(`  ${blob.url}\n`);
  }

  console.log("Fatto. Incolla gli URL nel campo audioSrc dei pezzi in lib/songs.js");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
