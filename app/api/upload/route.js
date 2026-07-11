import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";

export async function POST(req) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    const filename = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Se c'è il token di Vercel Blob in ENV, carichiamo lì
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${Date.now()}-${filename}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    }

    // Altrimenti, fallback locale nella cartella public/uploads
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (_) {}

    // Rende il nome sicuro ed univoco per evitare collisioni in locale
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadsDir, safeName);
    
    await fs.writeFile(filePath, new Uint8Array(buffer));
    
    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Per Next.js Pages router, ma in App Router si ignora. Lo lasciamo per sicurezza o non serve
  },
};
