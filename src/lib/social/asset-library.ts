/** Catalog metadata is untrusted. Collection never grants permission to publish. */
export const LIBRARY_BUCKET = "social-library";
export const LIBRARY_CATALOG = "catalogs/website-v1.json";
export type LibraryAsset = {
  id: string; sha256: string; storagePath: string; filename: string;
  title: string; description: string; alt: string; category: string; kind: string;
  sourceUrl: string; sourcePage: string;
  sourceType: "website-gallery" | "website-other" | "google-business-profile";
  width: number; height: number; bytes: number;
  rightsStatus: "review-required" | "hold";
  privacyStatus: "reviewed" | "review-required";
  sourcePublished: boolean; tags: string[];
};
export type LibraryCatalog = { schemaVersion: 1; businessId: string; collectedAt: string; assets: LibraryAsset[] };
export type LibraryPreview = Omit<LibraryAsset, "storagePath"> & { previewUrl: string | null };
const safeUrl = (value: unknown) => {
  if (typeof value !== "string") return false;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.search && !u.hash; } catch { return false; }
};
export function parseLibraryCatalog(value: unknown, expectedBusinessId = "truecolor"): LibraryCatalog {
  if (expectedBusinessId !== "truecolor" && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(expectedBusinessId)) throw new Error("Invalid library business");
  const originalsPrefix = expectedBusinessId === "truecolor" ? "originals/" : `businesses/${expectedBusinessId}/originals/`;
  const c = value as Partial<LibraryCatalog> | null;
  if (!c || c.schemaVersion !== 1 || c.businessId !== expectedBusinessId || typeof c.collectedAt !== "string" || !Number.isFinite(Date.parse(c.collectedAt)) || !Array.isArray(c.assets) || c.assets.length > 2000) throw new Error("Invalid library catalog");
  const ids = new Set<string>();
  for (const a of c.assets) {
    if (!a || ["id", "sha256", "storagePath", "filename", "title", "description", "alt", "category", "kind"].some(k => typeof a[k as keyof LibraryAsset] !== "string" || (a[k as keyof LibraryAsset] as string).length > 4000)
      || !/^[a-zA-Z0-9_-]{1,128}$/.test(a.id) || ids.has(a.id)
      || !/^[a-f0-9]{64}$/.test(a.sha256)
      || !a.storagePath.startsWith(originalsPrefix) || !/^[a-zA-Z0-9_./-]+$/.test(a.storagePath) || a.storagePath.split("/").some(s => !s || s === "." || s === "..")
      || !safeUrl(a.sourceUrl) || !safeUrl(a.sourcePage)
      || !["website-gallery", "website-other", "google-business-profile"].includes(a.sourceType)
      || !["review-required", "hold"].includes(a.rightsStatus)
      || !["reviewed", "review-required"].includes(a.privacyStatus)
      || typeof a.sourcePublished !== "boolean"
      || ![a.width, a.height, a.bytes].every(n => Number.isSafeInteger(n) && n > 0)
      || !Array.isArray(a.tags) || a.tags.length > 50 || a.tags.some(t => typeof t !== "string" || t.length > 200)) throw new Error("Invalid library asset");
    ids.add(a.id);
  }
  // Drop unknown collector fields rather than exposing private local paths or notes.
  const keys: (keyof LibraryAsset)[] = ["id", "sha256", "storagePath", "filename", "title", "description", "alt", "category", "kind", "sourceUrl", "sourcePage", "sourceType", "width", "height", "bytes", "rightsStatus", "privacyStatus", "sourcePublished", "tags"];
  return { schemaVersion: 1, businessId: expectedBusinessId, collectedAt: c.collectedAt, assets: c.assets.map(asset => Object.fromEntries(keys.map(key => [key, asset[key]])) as LibraryAsset) };
}
export function libraryReviewLabel(asset: Pick<LibraryAsset, "rightsStatus" | "privacyStatus">): string {
  return asset.rightsStatus === "hold" ? "Held — do not use" : asset.privacyStatus === "review-required" ? "Rights and privacy need review" : "Social rights need review";
}
