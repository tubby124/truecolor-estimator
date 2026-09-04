import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { MERCHANT_OFFER_COUNT } from "@/lib/merchant/merchant-catalog";

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
  it("publishes the exact, rights-cleared offer set for every main product family", async () => {
    const response = await GET();
    const xml = await response.text();
    const ids = values(xml, "id");
    const links = values(xml, "link");
    const prices = values(xml, "price");

    expect(ids).toHaveLength(MERCHANT_OFFER_COUNT);
    expect(new Set(ids).size).toBe(MERCHANT_OFFER_COUNT);
    expect(ids.every((id) => id.length <= 50)).toBe(true);
    expect(links).toHaveLength(MERCHANT_OFFER_COUNT);
    expect(prices).toHaveLength(MERCHANT_OFFER_COUNT);
    expect(CANONICAL_PRODUCT_SLUGS.every((slug) => links.some((link) => link.includes(`/products/${slug}?merchant=`)))).toBe(true);
    expect(values(xml, "pickup_sla")).toEqual(Array(MERCHANT_OFFER_COUNT).fill("multi-week"));
    expect(values(xml, "included_destination")).toEqual(Array(MERCHANT_OFFER_COUNT).fill("Free_local_listings"));
    expect(values(xml, "item_group_id")).toEqual([
      "tc-family-vinyl-banners",
      "tc-family-vinyl-banners",
      "tc-family-business-cards",
      "tc-family-business-cards",
    ]);
    expect(values(xml, "item_group_title")).toEqual([
      "Vinyl Banners",
      "Vinyl Banners",
      "Business Cards",
      "Business Cards",
    ]);
    expect(values(xml, "size")).toEqual(["2×4 ft", "3×6 ft"]);
    expect(values(xml, "multipack")).toEqual(["250", "500"]);
    expect(values(xml, "name")).toEqual(["Size", "Size", "Pack quantity", "Pack quantity"]);
    expect(values(xml, "value")).toEqual(["2×4 ft", "3×6 ft", "250", "500"]);
    expect(xml).not.toContain("<g:shipping>");
  });

  it("never represents local pickup as Canada-wide free shipping", async () => {
    const response = await GET();
    const xml = await response.text();
    const shippingBlocks = [...xml.matchAll(/<g:shipping>[\s\S]*?<\/g:shipping>/g)].map((m) => m[0]);

    expect(shippingBlocks).toHaveLength(0);
    expect(xml).not.toContain("<g:price>0.00 CAD</g:price>");
    expect(values(xml, "google_product_category")).toEqual([]);
    expect(values(xml, "excluded_destination")).toHaveLength(MERCHANT_OFFER_COUNT * 5);
  });
});
