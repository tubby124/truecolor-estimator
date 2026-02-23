/**
 * POST /api/upload
 *
 * Server-side file upload to Supabase Storage using the service role key.
 * This bypasses Supabase storage RLS policies that would block unauthenticated
 * (anonymous checkout) uploads when using the anon key directly from the browser.
 *
 * Accepts: FormData with field "file"
 * Returns: { path: string }  — the storage path for use in the order
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 52_428_800; // 50 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/postscript", // AI / EPS
];

// AI and EPS files sometimes arrive with generic MIME types — allow by extension too
const ALLOWED_EXTENSIONS = /\.(pdf|ai|eps|jpg|jpeg|png|webp)$/i;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large — max 50 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 }
      );
    }

    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.test(file.name);
    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        { error: "File type not allowed — use PDF, AI, EPS, JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `pending/${crypto.randomUUID()}/artwork.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from("print-files")
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("[upload] Supabase storage error:", error.message);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    console.log(`[upload] OK — ${path} (${(file.size / 1024).toFixed(0)} KB)`);
    return NextResponse.json({ path });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
