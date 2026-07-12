import { cookies } from "next/headers";
import { readConfig } from "./db";
import {
  getEnvSecret,
  normalizeVaultCode,
  signToken,
  verifyToken,
} from "./security";

const COOKIE_NAME = "vault_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function getVaultSecret(): string {
  return getEnvSecret("VAULT_SESSION_SECRET", "tomama-vault-dev");
}

export function getVaultToken(vaultCode: string): string {
  return signToken(normalizeVaultCode(vaultCode), getVaultSecret());
}

export async function isVaultUnlocked(): Promise<boolean> {
  const config = await readConfig();
  const expected = getVaultToken(config.vaultCode);
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(COOKIE_NAME)?.value, expected);
}

export async function unlockVault(code: string): Promise<boolean> {
  const config = await readConfig();
  if (normalizeVaultCode(code) !== normalizeVaultCode(config.vaultCode)) {
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
