import { promises as fs } from "node:fs";
import { join } from "node:path";
import { SONGS, VAULT_CODE } from "./songs.js";

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(DATA_DIR, "config.json");

// Assicura l'esistenza della cartella data e del file di configurazione
async function initDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (_) {}

  try {
    await fs.access(CONFIG_FILE);
  } catch (_) {
    // Se il file JSON non esiste, lo creiamo partendo dai dati statici originari
    const initialConfig = {
      vaultCode: VAULT_CODE,
      songs: SONGS,
    };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), "utf8");
  }
}

export async function readConfig() {
  await initDb();
  const raw = await fs.readFile(CONFIG_FILE, "utf8");
  return JSON.parse(raw);
}

export async function writeConfig(config) {
  await initDb();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}
