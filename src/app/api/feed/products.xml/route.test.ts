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

// <g:shipping> carries its own nested <g:price>, so strip it before reading offer prices.
function withoutShipping(xml: string): string {
  return xml.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/g, "");
}

describe("Merchant Center product feed", () => {
  it("is default-disabled until the external Merchant pilot gate is approved", async () => {
    const response = await GET();
    const xml = await response.text();
    const ids = values(xml, "id");
    const links = values(xml, "link");
    const prices = values(withoutShipping(xml), "price");

    expect(ids).toHaveLength(0);
    expect(links).toHaveLength(0);
    expect(prices).toHaveLength(0);
    expect(xml).not.toContain("<g:shipping>");
  });

  it("never represents local pickup as Canada-wide free shipping", async () => {
    const response = await GET();
    const xml = await response.text();
    const shippingBlocks = [...xml.matchAll(/<g:shipping>[\s\S]*?<\/g:shipping>/g)].map((m) => m[0]);

    expect(shippingBlocks).toHaveLength(0);
    expect(xml).not.toContain("0.00 CAD");
    expect(values(xml, "google_product_category")).toEqual([]);
  });
});
