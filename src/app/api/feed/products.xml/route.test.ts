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
  it("publishes one exact buyable offer for each canonical product page", async () => {
    const response = await GET();
    const xml = await response.text();
    const ids = values(xml, "id");
    const links = values(xml, "link");
    const prices = values(withoutShipping(xml), "price");

    expect(ids).toHaveLength(CANONICAL_PRODUCT_SLUGS.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(links).toEqual(
      CANONICAL_PRODUCT_SLUGS.map(
        (slug) => `https://truecolorprinting.ca/products/${slug}?merchant=tc-${slug}`,
      ),
    );
    expect(prices).toHaveLength(CANONICAL_PRODUCT_SLUGS.length);
    expect(prices.every((price) => Number.parseFloat(price) >= 25)).toBe(true);
    expect(xml).toContain("<g:product_type>True Color &gt;");
  });

  it("states the truthful local-pickup shipping block on every item", async () => {
    const response = await GET();
    const xml = await response.text();
    const shippingBlocks = [...xml.matchAll(/<g:shipping>[\s\S]*?<\/g:shipping>/g)].map((m) => m[0]);

    expect(shippingBlocks).toHaveLength(CANONICAL_PRODUCT_SLUGS.length);
    expect(new Set(shippingBlocks).size).toBe(1);
    expect(shippingBlocks[0]).toContain("<g:country>CA</g:country>");
    // Business truth (src/lib/business-info.ts): local pickup is standard, courier is
    // by request at customer cost — so the feed must not advertise free courier delivery.
    expect(shippingBlocks[0]).toContain("<g:service>Local pickup (Saskatoon)</g:service>");
    expect(shippingBlocks[0]).toContain("<g:price>0.00 CAD</g:price>");
    expect(values(xml, "google_product_category")).toEqual(
      CANONICAL_PRODUCT_SLUGS.map(
        () => "Office Supplies &gt; General Office Supplies &gt; Office &amp; Business Forms",
      ),
    );
  });
});
