import { NextResponse } from "next/server";
import { readConfig, writeConfig, validateConfigPayload } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { isVaultUnlocked } from "@/lib/vault-auth";
import { toAdminConfig, toPublicConfig, toUnlockedConfig } from "@/lib/config-api";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
};

export async function GET() {
  try {
    const config = await readConfig();
    const [admin, vaultUnlocked] = await Promise.all([
      isAuthenticated(),
      isVaultUnlocked(),
    ]);

    const payload = admin
      ? toAdminConfig(config)
      : vaultUnlocked
        ? toUnlockedConfig(config)
        : toPublicConfig(config);

    return NextResponse.json(payload, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const newConfig = await req.json();
    if (!validateConfigPayload(newConfig)) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }

    await writeConfig(newConfig);
    return NextResponse.json({ success: true, config: toAdminConfig(newConfig) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
