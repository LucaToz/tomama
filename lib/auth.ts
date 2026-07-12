import { cookies } from "next/headers";
import { getEnvSecret, signToken, verifyToken } from "./security";

const COOKIE_NAME = "admin_session";
const SESSION_LABEL = "tomama-admin";

function getAdminSecret(): string {
  return getEnvSecret("ADMIN_PASSWORD", "admin-tomama");
}

function getSessionToken(): string {
  return signToken(SESSION_LABEL, getAdminSecret());
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  return verifyToken(session, getSessionToken());
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (password !== getAdminSecret()) return false;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 2,
    path: "/",
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
