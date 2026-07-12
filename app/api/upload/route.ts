import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth";
import { isAllowedUploadType, sanitizeFileName } from "@/lib/urls";

export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024;

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json({
    blobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(req: Request) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

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

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    if (!isAllowedUploadType(file.type)) {
      return NextResponse.json({ error: "Tipo file non consentito" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "File troppo grande" }, { status: 413 });
    }

    const safeName = `${Date.now()}-${sanitizeFileName(file.name)}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${safeName}`, buffer, {
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
    await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

    const filePath = join(uploadsDir, safeName);
    await fs.writeFile(filePath, new Uint8Array(buffer));

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
