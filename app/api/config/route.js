import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const newConfig = await req.json();
    if (!newConfig.vaultCode || !Array.isArray(newConfig.songs)) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }

    await writeConfig(newConfig);
    return NextResponse.json({ success: true, config: newConfig });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
