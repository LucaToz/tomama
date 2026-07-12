import { cookies } from "next/headers";
import { readConfig } from "./db.js";

const COOKIE_NAME = "vault_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

function normalizeCode(code) {
  return (code || "").trim().toUpperCase();
}

export function getVaultToken(vaultCode) {
  const secret = process.env.VAULT_SESSION_SECRET || "tomama-vault";
  return Buffer.from(`${secret}:${normalizeCode(vaultCode)}`).toString("base64url");
}

export async function isVaultUnlocked() {
  const config = await readConfig();
  const expected = getVaultToken(config.vaultCode);
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === expected;
}

export async function unlockVault(code) {
  const config = await readConfig();
  if (normalizeCode(code) !== normalizeCode(config.vaultCode)) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, getVaultToken(config.vaultCode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });
  return true;
}
