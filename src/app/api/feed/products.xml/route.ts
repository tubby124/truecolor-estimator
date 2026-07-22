// Google Merchant Center / Meta Catalog product feed.
//
// XML format = Google Shopping (g: namespace). Meta Commerce Manager
// accepts the same feed via the "Use a data feed" option.
//
// Public feed URL: https://truecolorprinting.ca/feed/products.xml
// Legacy API URL remains available for existing external catalog configs.
//
// Refreshes from data/tables/products.v1.csv on every request.
// Cached at the edge for 1 hour to avoid hammering CSV reads.

import { NextResponse } from "next/server";
import { BUSINESS_INFO } from "@/lib/business-info";
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

// Map CSV category to an indexable SEO landing page for `link`.
const CATEGORY_TO_PATH: Record<string, string> = {
  SIGN: "/coroplast-signs-saskatoon",
  BANNER: "/banner-printing-saskatoon",
  RIGID: "/aluminum-signs-saskatoon",
  MAGNET: "/vehicle-magnets-saskatoon",
  FLYER: "/flyer-printing-saskatoon",
  BUSINESS_CARD: "/business-cards-saskatoon",
  FOAMBOARD: "/foamboard-printing-saskatoon",
  DISPLAY: "/retractable-banners-saskatoon",
  WINDOW_DECAL: "/window-decals-saskatoon",
  WINDOW_PERF: "/window-perf-saskatoon",
  VINYL_LETTERING: "/vinyl-lettering-saskatoon",
  STICKER: "/sticker-printing-saskatoon",
  POSTCARD: "/postcard-printing-saskatoon",
  BROCHURE: "/brochure-printing-saskatoon",
  PHOTO_POSTER: "/photo-poster-printing-saskatoon",
  BOOKLET: "/booklet-printing-saskatoon",
};

const CATEGORY_TO_IMAGE_PATH: Record<string, string> = {
  SIGN: "/images/products/product/coroplast-yard-sign-800x600.webp",
  BANNER: "/images/products/product/banner-vinyl-colorful-800x600.webp",
  RIGID: "/images/products/product/acp-aluminum-sign-800x600.webp",
  MAGNET: "/images/products/product/vehicle-magnets-800x600.webp",
  FLYER: "/images/products/product/flyers-stack-800x600.webp",
  BUSINESS_CARD: "/images/products/product/business-cards-800x600.webp",
  FOAMBOARD: "/images/products/product/foamboard-display-800x600.webp",
  DISPLAY: "/images/products/product/retractable-stand-600x900.webp",
  WINDOW_DECAL: "/images/products/product/window-decal-before-after-800x600.webp",
  WINDOW_PERF: "/images/products/product/window-perf-800x600.webp",
  VINYL_LETTERING: "/images/products/product/vinyl-lettering-800x600.webp",
  STICKER: "/images/products/product/stickers-800x600.webp",
  POSTCARD: "/images/products/product/postcards-800x600.webp",
  BROCHURE: "/images/products/product/brochures-800x600.webp",
  PHOTO_POSTER: "/images/products/product/photo-posters-800x600.webp",
  BOOKLET: "/images/products/product/coil-bound-booklet-hero-800x600.webp",
  MAGNET_CALENDAR: "/images/products/product/magnet-calendars-800x600.webp",
};

// Google product_type taxonomy (broad fallback — refine later)
const GOOGLE_PRODUCT_CATEGORY = "Office Supplies > General Office Supplies > Office & Business Forms";

export async function GET(): Promise<Response> {
  const products = getProducts();

  const items = products
    .filter((p) => p.is_active)
    .map((p) => {
      const path = CATEGORY_TO_PATH[p.category] ?? "/products";
      const link = `${SITE_URL}${path}`;
      const imagePath = CATEGORY_TO_IMAGE_PATH[p.category] ?? "/og-image.png";
      const imageLink = `${SITE_URL}${imagePath}`;
      const desc = `${p.product_name}. Printed in-house in Saskatoon. Standard turnaround ${BUSINESS_INFO.turnaround.standardBusinessDays}. Same-day rush +$${BUSINESS_INFO.sameDayRush.feeDollars}, order before ${BUSINESS_INFO.sameDayRush.cutoffHour} AM and call to confirm capacity.`;
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
