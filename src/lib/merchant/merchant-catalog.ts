import type { Category } from "@/lib/data/types";
import { PRODUCTS, type ProductContent } from "@/lib/data/products-content";
import { estimate } from "@/lib/engine";
import { ORDER_MINIMUM_DOLLARS } from "@/lib/pricing/order-min";
import { findChannelClearedImage } from "@/lib/data/image-rights";

const MIN_CHECKOUT_TOTAL = ORDER_MINIMUM_DOLLARS;

export const CANONICAL_MERCHANT_PRODUCT_SLUGS = [
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

type CanonicalMerchantProductSlug = (typeof CANONICAL_MERCHANT_PRODUCT_SLUGS)[number];

// Broad Google taxonomy shared by every offer — the feed spans signage, decals,
// and business print, and no single leaf node covers all of them. Same value the
// pre-refactor feed submitted, so existing Merchant Center categorisation holds.
const GOOGLE_PRODUCT_CATEGORY = "Office Supplies > General Office Supplies > Office & Business Forms";

export interface MerchantOfferSelection {
  offerId: string;
  sizeLabel: string;
  widthIn: number;
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  materialCode: string;
}

export interface MerchantOffer extends MerchantOfferSelection {
  slug: CanonicalMerchantProductSlug;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: "in_stock";
  price: number;
  productType: string;
}

/**
 * A code switch is not an external Merchant approval. The source is empty by
 * default so a deploy cannot begin a pilot before account/readback, image, and
 * policy gates have separately passed.
 */
export const MERCHANT_PILOT_SERVING_ENABLED = false;
// Intentionally unset until a rights receipt binds the exact public image file.
export const MERCHANT_PILOT_IMAGE_SHA256: string | null = null;

type MerchantOfferSeed = {
  slug: CanonicalMerchantProductSlug;
  sizeLabel: string;
  qty: number;
  sides?: 1 | 2;
  tierMaterialCode?: string;
};

// Each offer is intentionally a specific, complete product configuration. This
// lets the feed price match the selected configuration on its landing page and
// keeps it above the site-wide $25 checkout minimum.
const MERCHANT_OFFER_SEEDS: MerchantOfferSeed[] = [
  { slug: "coroplast-signs", sizeLabel: "24×36\"", qty: 1 },
  { slug: "vinyl-banners", sizeLabel: "2×4 ft", qty: 1 },
  { slug: "acp-signs", sizeLabel: "24×36\"", qty: 1 },
  { slug: "vehicle-magnets", sizeLabel: "18×24\"", qty: 1 },
  { slug: "foamboard-displays", sizeLabel: "24×36\"", qty: 1 },
  { slug: "retractable-banners", sizeLabel: "33.5×80\"", qty: 1, tierMaterialCode: "RBS33507875S" },
  { slug: "window-decals", sizeLabel: "24×36\"", qty: 1 },
  { slug: "window-perf", sizeLabel: "24×36\"", qty: 1 },
  { slug: "vinyl-lettering", sizeLabel: "48×12\"", qty: 1 },
  { slug: "stickers", sizeLabel: "2×2\"", qty: 25 },
  { slug: "postcards", sizeLabel: "4×6\"", qty: 50 },
  { slug: "brochures", sizeLabel: "Tri-fold (6 panels)", qty: 100 },
  { slug: "flyers", sizeLabel: "80lb — Full 8.5×11\"", qty: 100 },
  { slug: "business-cards", sizeLabel: "3.5×2\"", qty: 250 },
  { slug: "photo-posters", sizeLabel: "24×36\"", qty: 1 },
  { slug: "magnet-calendars", sizeLabel: "8.5×11\"", qty: 25 },
];

function selectionFor(seed: MerchantOfferSeed, product: ProductContent): MerchantOfferSelection {
  const size = product.sizePresets.find((preset) => preset.label === seed.sizeLabel);
  if (!size) {
    throw new Error(`Merchant offer ${seed.slug} refers to an unavailable size: ${seed.sizeLabel}`);
  }

  const materialCode = seed.tierMaterialCode ?? size.material_code ?? product.material_code;
  if (!materialCode) {
    throw new Error(`Merchant offer ${seed.slug} has no priceable material code`);
  }

  return {
    offerId: `tc-${seed.slug}`,
    sizeLabel: size.label,
    widthIn: size.width_in,
    heightIn: size.height_in,
    qty: seed.qty,
    sides: seed.sides ?? product.defaultSides,
    materialCode,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sideLabel(sides: 1 | 2): string {
  return sides === 2 ? "Double-sided" : "Single-sided";
}

export function getMerchantOfferSelection(
  slug: string,
  offerId: string | undefined,
): MerchantOfferSelection | undefined {
  const seed = MERCHANT_OFFER_SEEDS.find((candidate) => candidate.slug === slug);
  const pilotId = "tc-retractable-banners--33-5x80--1s--q1--mat-rbs33507875s";
  if (!seed || (offerId !== `tc-${seed.slug}` && !(seed.slug === "retractable-banners" && offerId === pilotId))) return undefined;

  const product = PRODUCTS[seed.slug];
  return selectionFor(seed, product);
}

export function getMerchantOffers(siteUrl: string): MerchantOffer[] {
  return MERCHANT_OFFER_SEEDS.map((seed) => {
    const product = PRODUCTS[seed.slug];
    const selection = selectionFor(seed, product);
    const quote = estimate({
      category: product.category as Category,
      material_code: selection.materialCode,
      width_in: selection.widthIn,
      height_in: selection.heightIn,
      qty: selection.qty,
      sides: selection.sides,
      design_status: "PRINT_READY",
    });

    if (quote.status !== "QUOTED" || quote.sell_price == null) {
      throw new Error(`Merchant offer ${seed.slug} is not currently priceable`);
    }
    if (quote.sell_price < MIN_CHECKOUT_TOTAL) {
      throw new Error(`Merchant offer ${seed.slug} falls below the $${MIN_CHECKOUT_TOTAL} checkout minimum`);
    }

    const configuration = `${selection.sizeLabel}, ${sideLabel(selection.sides)}, Qty ${selection.qty}`;

    return {
      ...selection,
      slug: seed.slug,
      title: `${product.name} — ${configuration}`,
      description: `${product.tagline} This offer is ${configuration}.`,
      // Decision: link to /products/<slug>?merchant= so the landing-page price is exactly the prefilled configurator price.
      // Risk: /products/:path+ is served X-Robots-Tag "noindex, follow" (next.config.ts) and Merchant Center's crawler may refuse noindex landing pages.
      // If items are disapproved for "landing page/crawl": exempt ?merchant= URLs from the noindex header + metadata, or repoint links to /<product>-saskatoon.
      link: `${siteUrl}/products/${seed.slug}?merchant=${selection.offerId}`,
      imageLink: `${siteUrl}${product.heroImage}`,
      availability: "in_stock",
      price: quote.sell_price,
      productType: `True Color > ${product.name}`,
    };
  });
}

export function getMerchantPilotOffer(siteUrl: string): MerchantOffer {
  const pilot = getMerchantOffers(siteUrl).find((offer) => offer.slug === "retractable-banners");
  if (!pilot) throw new Error("Configured Merchant pilot is missing");
  return {
    ...pilot,
    offerId: "tc-retractable-banners--33-5x80--1s--q1--mat-rbs33507875s",
    link: `${siteUrl}/products/retractable-banners?merchant=tc-retractable-banners--33-5x80--1s--q1--mat-rbs33507875s`,
  };
}

export function isMerchantPilotImageCleared(offer: MerchantOffer): boolean {
  return MERCHANT_PILOT_IMAGE_SHA256 !== null
    && Boolean(findChannelClearedImage(MERCHANT_PILOT_IMAGE_SHA256, "merchant", offer.offerId));
}

export function renderMerchantFeedXml(siteUrl: string): string {
  const pilot = getMerchantPilotOffer(siteUrl);
  const offers = MERCHANT_PILOT_SERVING_ENABLED && isMerchantPilotImageCleared(pilot) ? [pilot] : [];
  const items = offers
    .map((offer) => `
    <item>
      <g:id>${escapeXml(offer.offerId)}</g:id>
      <g:title>${escapeXml(offer.title)}</g:title>
      <g:description>${escapeXml(offer.description)}</g:description>
      <g:link>${escapeXml(offer.link)}</g:link>
      <g:image_link>${escapeXml(offer.imageLink)}</g:image_link>
      <g:availability>${offer.availability}</g:availability>
      <g:price>${offer.price.toFixed(2)} CAD</g:price>
      <g:brand>True Color Display Printing</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(offer.productType)}</g:product_type>
      <g:google_product_category>${escapeXml(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>True Color Display Printing</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Custom signs, banners, business cards, decals, and large-format print — Saskatoon, SK.</description>${items}
  </channel>
</rss>`;
}
