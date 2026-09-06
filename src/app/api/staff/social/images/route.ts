import { requireSocialBusiness, socialAssetPrefix } from "@/lib/social/business";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const BUCKET = "social-images";
const PAGE_SIZE = 200;
const MAX_LIST_CALLS = 50;
const MAX_IMAGES = 5000;
const headers = { "Cache-Control": "private, no-store" };

export async function GET(req?: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const storage = createServiceClient().storage.from(BUCKET);
    const prefix = socialAssetPrefix(auth.businessId);
    const folders = [prefix];
    const images: { url: string; name: string; created_at: string }[] = [];
    let calls = 0;
    let truncated = false;
    outer: for (const folder of folders) {
      for (let offset = 0; ; offset += PAGE_SIZE) {
        if (calls >= MAX_LIST_CALLS) { truncated = true; break outer; }
        calls++;
        // Stable name ordering keeps folder entries and offset pagination deterministic.
        const { data, error } = await storage.list(folder, {
          limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" },
        });
        if (error || !data) throw new Error("Image listing unavailable");
        for (const file of data) {
          if (file.name === ".emptyFolderPlaceholder") continue;
          if (!file.id) {
            // Uploads use social/<year>/<uuid>; do not recursively walk arbitrary folders.
            if (folder === prefix && /^\d{4}$/.test(file.name)) folders.push(`${prefix}/${file.name}`);
            continue;
          }
          if (!file.name || file.name.includes("/") || file.name === "." || file.name === "..") continue;
          const { data: { publicUrl } } = storage.getPublicUrl(`${folder}/${file.name}`);
          images.push({ url: publicUrl, name: file.name, created_at: file.created_at });
          if (images.length >= MAX_IMAGES) { truncated = true; break outer; }
        }
        if (data.length < PAGE_SIZE) break;
      }
    }
    images.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ images, truncated }, { headers });
  } catch {
    // Do not return a partial list as a successful complete inventory.
    return NextResponse.json({ error: "Could not load the image library. Please try again." }, { status: 503, headers });
  }
}
