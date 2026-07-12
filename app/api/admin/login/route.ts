import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const ok = await loginAdmin(password || "");
    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Password errata" }, { status: 401 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
