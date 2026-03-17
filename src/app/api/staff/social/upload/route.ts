import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const BUCKET = "social-images";
const MAX_WIDTH = 1080;
const JPEG_QUALITY = 85;
const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export async function POST(req: Request) {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();

  // Ensure bucket exists
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
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

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 30MB limit" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let contentType: string;
  let ext: string;
  let width: number;
  let height: number;
  let format: string;

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Determine output format
    const inputFormat = metadata.format;

    let processed: sharp.Sharp;
    if (inputFormat === "png") {
      // Keep PNG — no lossy conversion
      processed = image.png();
      ext = "png";
      contentType = "image/png";
      format = "png";
    } else {
      // Convert WebP/HEIC to JPEG, or keep JPEG
      processed = image.jpeg({ quality: JPEG_QUALITY });
      ext = "jpg";
      contentType = "image/jpeg";
      format = "jpeg";
    }

    // Resize if wider than MAX_WIDTH
    if (metadata.width && metadata.width > MAX_WIDTH) {
      processed = processed.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
    }

    // Strip EXIF (privacy — no GPS from phone photos)
    processed = processed.rotate(); // auto-rotate from EXIF then strip

    buffer = Buffer.from(await processed.toBuffer());
    const outputMeta = await sharp(buffer).metadata();
    width = outputMeta.width ?? metadata.width ?? 0;
    height = outputMeta.height ?? metadata.height ?? 0;
  } catch {
    // Sharp failed — fall back to raw upload
    const origExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    ext = origExt;
    contentType = file.type;
    width = 0;
    height = 0;
    format = origExt;
  }

  const year = new Date().getFullYear();
  const uuid = crypto.randomUUID();
  const path = `social/${year}/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, width, height, format });
}
