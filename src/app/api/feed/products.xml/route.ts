// Google Merchant Center / Meta Catalog product feed.
//
// XML format = Google Shopping (g: namespace). Meta Commerce Manager
// accepts the same feed via the "Use a data feed" option.
//
// Live URL: https://truecolorprinting.ca/api/feed/products.xml
//
// Refreshes from data/tables/products.v1.csv on every request.
// Cached at the edge for 1 hour to avoid hammering CSV reads.

import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data/loader";

export const revalidate = 3600;
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Map CSV category to a product landing page slug for `link`
const CATEGORY_TO_SLUG: Record<string, string> = {
  SIGN: "coroplast-signs",
  BANNER: "vinyl-banners",
  RIGID: "acp-signs",
  MAGNET: "vehicle-magnets",
  FLYER: "flyers",
  BUSINESS_CARD: "business-cards",
  FOAMBOARD: "foamboard-displays",
  RETRACTABLE: "retractable-banners",
  WINDOW_DECAL: "window-decals",
  WINDOW_PERF: "window-perf",
  VINYL_LETTERING: "vinyl-lettering",
  STICKER: "stickers",
  POSTCARD: "postcards",
  BROCHURE: "brochures",
  PHOTO_POSTER: "photo-posters",
  MAGNET_CALENDAR: "magnet-calendars",
};

// Google product_type taxonomy (broad fallback — refine later)
const GOOGLE_PRODUCT_CATEGORY = "Office Supplies > General Office Supplies > Office & Business Forms";

export async function GET(): Promise<Response> {
  const products = getProducts();

  const items = products
    .filter((p) => p.is_active)
    .map((p) => {
      const slug = CATEGORY_TO_SLUG[p.category] ?? p.category.toLowerCase();
      const link = `${SITE_URL}/products/${slug}`;
      const imageLink = `${SITE_URL}/images/industries/${slug}/hero.webp`;
      const desc = `${p.product_name}. Roland UV in-house print. From Saskatoon. Standard turnaround 1-3 business days. Same-day rush +$40.`;
      return `
    <item>
      <g:id>${escapeXml(p.product_id)}</g:id>
      <g:title>${escapeXml(p.product_name)}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} CAD</g:price>
      <g:brand>True Color Display Printing</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:custom_label_0>${escapeXml(p.category)}</g:custom_label_0>
      <g:shipping>
        <g:country>CA</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 CAD</g:price>
      </g:shipping>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>True Color Display Printing</title>
    <link>${SITE_URL}</link>
    <description>Custom signs, banners, business cards, decals, and large-format print — Saskatoon, SK.</description>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
