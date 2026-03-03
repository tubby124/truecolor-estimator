import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "social-images";

/**
 * POST /api/staff/social/upload
 * Uploads an image to Supabase Storage and returns the public URL.
 * Used by the Compose form to host images for Blotato's mediaUrls field.
 *
 * Request: multipart/form-data with field "file" (image/*)
 * Response: { url: string }
 */
export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();

  // Ensure bucket exists (creates once, ignores "already exists" error)
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  let file: File;
  try {
    const formData = await req.formData();
    const raw = formData.get("file");
    if (!raw || typeof raw === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    file = raw as File;
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Build unique filename: social/{year}/{uuid}.{ext}
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const year = new Date().getFullYear();
  const uuid = crypto.randomUUID();
  const path = `social/${year}/${uuid}.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
