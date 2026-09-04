import { describe, expect, it } from "vitest";
import { GET } from "./route";

const CANONICAL_PRODUCT_SLUGS = [
  "coroplast-signs",
  "vinyl-banners",
  "acp-signs",
  "vehicle-magnets",
  "foamboard-displays",
  "retractable-banners",
  "window-decals",
  "window-perf",
  "vinyl-lettering",
  "stickers",
  "postcards",
  "brochures",
  "flyers",
  "business-cards",
  "photo-posters",
  "magnet-calendars",
] as const;

function values(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<g:${tag}>([^<]+)</g:${tag}>`, "g"))].map((match) => match[1]);
}

describe("Merchant Center product feed", () => {
  it("publishes one exact, rights-cleared configuration for every main product family", async () => {
    const response = await GET();
    const xml = await response.text();
    const ids = values(xml, "id");
    const links = values(xml, "link");
    const prices = values(xml, "price");

    expect(ids).toHaveLength(16);
    expect(new Set(ids).size).toBe(16);
    expect(ids.every((id) => id.length <= 50)).toBe(true);
    expect(links).toHaveLength(16);
    expect(prices).toHaveLength(16);
    expect(CANONICAL_PRODUCT_SLUGS.every((slug) => links.some((link) => link.includes(`/products/${slug}?merchant=`)))).toBe(true);
    expect(values(xml, "pickup_sla")).toEqual(Array(16).fill("multi-week"));
    expect(values(xml, "included_destination")).toEqual(Array(16).fill("Free_local_listings"));
    expect(xml).not.toContain("<g:shipping>");
  });

  it("never represents local pickup as Canada-wide free shipping", async () => {
    const response = await GET();
    const xml = await response.text();
    const shippingBlocks = [...xml.matchAll(/<g:shipping>[\s\S]*?<\/g:shipping>/g)].map((m) => m[0]);

    expect(shippingBlocks).toHaveLength(0);
    expect(xml).not.toContain("<g:price>0.00 CAD</g:price>");
    expect(values(xml, "google_product_category")).toEqual([]);
    expect(values(xml, "excluded_destination")).toHaveLength(16 * 5);
  });
});
