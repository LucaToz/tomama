import { NextResponse } from "next/server";
import { isVaultUnlocked } from "@/lib/vault-auth";

export async function GET() {
  const unlocked = await isVaultUnlocked();
  return NextResponse.json({ unlocked });
}
