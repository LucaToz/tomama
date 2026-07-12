import { NextResponse } from "next/server";
import { unlockVault } from "@/lib/vault-auth";

export async function POST(req: Request) {
  try {
    const { code } = (await req.json()) as { code?: string };
    const ok = await unlockVault(code || "");
    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Codice errato" }, { status: 401 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
