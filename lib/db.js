import { promises as fs } from "node:fs";
import { join } from "node:path";
import { head, put, BlobNotFoundError } from "@vercel/blob";
import { SONGS, VAULT_CODE } from "./songs.js";
import { DEFAULT_COPY, mergeCopy } from "./copy.js";

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(DATA_DIR, "config.json");
const BLOB_CONFIG_PATH = "data/config.json";

function getInitialConfig() {
  return {
    vaultCode: VAULT_CODE,
    copy: { ...DEFAULT_COPY },
    songs: SONGS,
  };
}

function normalizeConfig(config) {
  return {
    ...config,
    copy: mergeCopy(config.copy),
  };
}

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readConfigFromFilesystem() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (_) {}

  try {
    await fs.access(CONFIG_FILE);
  } catch (_) {
    const initialConfig = getInitialConfig();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), "utf8");
  }

  const raw = await fs.readFile(CONFIG_FILE, "utf8");
  return normalizeConfig(JSON.parse(raw));
}

async function writeConfigToFilesystem(config) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (_) {}

  await fs.writeFile(CONFIG_FILE, JSON.stringify(normalizeConfig(config), null, 2), "utf8");
}

async function readConfigFromBlob() {
  try {
    const blob = await head(BLOB_CONFIG_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Impossibile leggere config da Blob (${res.status})`);
    }
    return normalizeConfig(await res.json());
  } catch (err) {
    if (err instanceof BlobNotFoundError) {
      // Prima volta su Vercel: migra da config.json nel bundle (sola lettura) o dal seed
      let seed;
      try {
        const raw = await fs.readFile(CONFIG_FILE, "utf8");
        seed = JSON.parse(raw);
      } catch (_) {
        seed = getInitialConfig();
      }
      await writeConfigToBlob(normalizeConfig(seed));
      return normalizeConfig(seed);
    }
    throw err;
  }
}

async function writeConfigToBlob(config) {
  const body = JSON.stringify(normalizeConfig(config), null, 2);
  await put(BLOB_CONFIG_PATH, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function readConfig() {
  if (useBlobStorage()) {
    return readConfigFromBlob();
  }
  return readConfigFromFilesystem();
}

export async function writeConfig(config) {
  if (useBlobStorage()) {
    return writeConfigToBlob(config);
  }
  return writeConfigToFilesystem(config);
}
