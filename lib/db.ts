import { promises as fs } from "node:fs";
import { join } from "node:path";
import { head, put, BlobNotFoundError } from "@vercel/blob";
import { SONGS, VAULT_CODE, normalizeSong } from "./songs";
import { DEFAULT_COPY, mergeCopy } from "./copy";
import type { AppConfig } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(DATA_DIR, "config.json");
const BLOB_CONFIG_PATH = "data/config.json";

function getInitialConfig(): AppConfig {
  return {
    vaultCode: VAULT_CODE,
    copy: { ...DEFAULT_COPY },
    songs: SONGS,
  };
}

function normalizeConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    songs: Array.isArray(config.songs) ? config.songs.map(normalizeSong) : [],
    copy: mergeCopy(config.copy),
  };
}

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readConfigFromFilesystem(): Promise<AppConfig> {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

  try {
    await fs.access(CONFIG_FILE);
  } catch {
    const initialConfig = getInitialConfig();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), "utf8");
  }

  const raw = await fs.readFile(CONFIG_FILE, "utf8");
  return normalizeConfig(JSON.parse(raw) as AppConfig);
}

async function writeConfigToFilesystem(config: AppConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
  await fs.writeFile(CONFIG_FILE, JSON.stringify(normalizeConfig(config), null, 2), "utf8");
}

async function readConfigFromBlob(): Promise<AppConfig> {
  try {
    const blob = await head(BLOB_CONFIG_PATH);
    const configUrl = `${blob.url}?v=${blob.uploadedAt.getTime()}`;
    const res = await fetch(configUrl, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      throw new Error(`Impossibile leggere config da Blob (${res.status})`);
    }
    return normalizeConfig((await res.json()) as AppConfig);
  } catch (err) {
    if (err instanceof BlobNotFoundError) {
      let seed: AppConfig;
      try {
        const raw = await fs.readFile(CONFIG_FILE, "utf8");
        seed = JSON.parse(raw) as AppConfig;
      } catch {
        seed = getInitialConfig();
      }
      await writeConfigToBlob(normalizeConfig(seed));
      return normalizeConfig(seed);
    }
    throw err;
  }
}

async function writeConfigToBlob(config: AppConfig): Promise<void> {
  const body = JSON.stringify(normalizeConfig(config), null, 2);
  await put(BLOB_CONFIG_PATH, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function readConfig(): Promise<AppConfig> {
  if (hasBlobStorage()) {
    return readConfigFromBlob();
  }
  return readConfigFromFilesystem();
}

export async function writeConfig(config: AppConfig): Promise<void> {
  if (hasBlobStorage()) {
    return writeConfigToBlob(config);
  }
  return writeConfigToFilesystem(config);
}

export function validateConfigPayload(body: unknown): body is AppConfig {
  if (!body || typeof body !== "object") return false;
  const config = body as Partial<AppConfig>;
  return (
    typeof config.vaultCode === "string" &&
    config.vaultCode.trim().length > 0 &&
    Array.isArray(config.songs) &&
    typeof config.copy === "object" &&
    config.copy !== null
  );
}
