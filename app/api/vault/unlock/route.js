import { NextResponse } from "next/server";
import { unlockVault } from "@/lib/vault-auth";

export async function POST(req) {
  try {
    const { code } = await req.json();
    const ok = await unlockVault(code);
    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Codice errato" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
