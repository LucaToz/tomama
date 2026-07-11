import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

export async function GET() {
  return NextResponse.json({
    blobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(req) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // Client upload (Vercel Blob) — bypassa il limite 4.5 MB delle serverless
    if (contentType.includes("application/json")) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          {
            error:
              "Blob store non configurato. Su Vercel: Storage → crea un Blob store e collegalo al progetto.",
          },
          { status: 503 }
        );
      }

      const body = await req.json();
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async () => ({
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        }),
        onUploadCompleted: async () => {},
      });

      return NextResponse.json(jsonResponse);
    }

    // Fallback server-side (solo locale / senza Blob)
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    const filename = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${Date.now()}-${filename}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Upload non disponibile: manca BLOB_READ_WRITE_TOKEN. Collega un Blob store al progetto Vercel.",
        },
        { status: 503 }
      );
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (_) {}

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadsDir, safeName);

    await fs.writeFile(filePath, new Uint8Array(buffer));

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
