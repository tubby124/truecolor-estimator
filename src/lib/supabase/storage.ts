/**
 * Supabase Storage helpers for artwork file uploads.
 * Uses the anon key — browser uploads directly to the `print-files` bucket.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dczbgraekmzirxknjvwe.supabase.co";

export async function uploadArtworkFile(file: File): Promise<string> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!anonKey) throw new Error("Supabase not configured");

  const supabase = createClient(SUPABASE_URL, anonKey);

  // Use a unique temp path — moves to orders/{orderId}/ after order is created
  const ext = file.name.split(".").pop() ?? "bin";
  const uuid = crypto.randomUUID();
  const path = `pending/${uuid}/artwork.${ext}`;

  const { error } = await supabase.storage
    .from("print-files")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return path;
}
