import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";
import { LIBRARY_BUCKET, LIBRARY_CATALOG, parseLibraryCatalog } from "@/lib/social/asset-library";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) { auth.headers.set("Cache-Control", "private, no-store"); return auth; }
  try {
    const storage = createServiceClient().storage;
    const { data: bucket, error: bucketError } = await storage.getBucket(LIBRARY_BUCKET);
    if (bucketError || !bucket) return NextResponse.json({ state: "unavailable", assets: [], message: "The private asset library has not been connected or is temporarily unavailable." }, { headers });
    if (bucket.public) return NextResponse.json({ error: "The asset library must be private before browsing." }, { status: 503, headers });
    const { data, error } = await storage.from(LIBRARY_BUCKET).download(LIBRARY_CATALOG);
    if (error || !data) return NextResponse.json({ state: "unavailable", assets: [], message: "No catalog is available yet. Complete the private collection upload, then refresh." }, { headers });
    if (data.size > 8 * 1024 * 1024) throw new Error("Catalog too large");
    const catalog = parseLibraryCatalog(JSON.parse(await data.text()));
    const paths = catalog.assets.map(a => a.storagePath);
    const signed = paths.length ? await storage.from(LIBRARY_BUCKET).createSignedUrls(paths, 900) : { data: [], error: null };
    if (signed.error) throw new Error("Preview unavailable");
    const urls = new Map((signed.data ?? []).map(item => [item.path, item.signedUrl]));
    const assets = catalog.assets.map(({ storagePath, ...asset }) => ({ ...asset, previewUrl: urls.get(storagePath) || null }));
    return NextResponse.json({ state: "ready", collectedAt: catalog.collectedAt, businessId: catalog.businessId, previewExpiresAt: new Date(Date.now() + 900000).toISOString(), assets }, { headers });
  } catch {
    return NextResponse.json({ error: "The private library could not be loaded. Check collection setup and try again." }, { status: 503, headers });
  }
}
