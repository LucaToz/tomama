import { createHmac, timingSafeEqual } from "node:crypto";

export function getEnvSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set in production`);
  }
  return devFallback;
}

export function signToken(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyToken(token: string | undefined, expected: string): boolean {
  if (!token || token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function normalizeVaultCode(code: string): string {
  return (code || "").trim().toUpperCase();
}
