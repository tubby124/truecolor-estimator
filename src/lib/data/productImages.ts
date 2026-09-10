/**
 * src/lib/data/productImages.ts
 *
 * Single source of truth for slug → product thumbnail image path.
 * Used by: cart/page.tsx, products/page.tsx, products/[slug]/page.tsx
 */

export const PRODUCT_IMAGES: Record<string, string> = {
  "vinyl-banners":       "/images/products/gallery/vinyl-banners/vinyl-banners-application-v1-1200w.webp",
  "coroplast-signs":     "/images/products/product/coroplast-yard-sign-800x600.webp",
  "vehicle-magnets":     "/images/products/gallery/vehicle-magnets/vehicle-magnets-application-v1-1200w.webp",
  "acp-signs":           "/images/products/gallery/acp-signs/acp-signs-application-v1-1200w.webp",
  "flyers":              "/images/products/gallery/flyers/flyers-application-v1-1200w.webp",
  "business-cards":      "/images/products/gallery/business-cards/business-cards-application-v1-1200w.webp",
  "foamboard-displays":  "/images/products/gallery/foamboard-displays/foamboard-displays-application-v1-1200w.webp",
  "retractable-banners": "/images/products/product/retractable-stand-600x900.webp",
  "window-decals":       "/images/products/product/window-decal-before-after-800x600.webp",
  "window-perf":         "/images/products/product/perf-vinyl-interior-seethrough-800x600.webp",
  "vinyl-lettering":     "/images/products/gallery/vinyl-lettering/vinyl-lettering-overview-v1-1200w.webp",
  "stickers":            "/images/products/product/stickers-800x600.webp",
  "postcards":           "/images/products/product/postcards-800x600.webp",
  "brochures":           "/images/products/product/brochures-800x600.webp",
  "photo-posters":       "/images/products/product/photo-posters-800x600.webp",
  "magnet-calendars":    "/images/products/product/magnet-calendars-800x600.webp",
  "coil-bound-booklets": "/images/products/product/coil-bound-booklet-hero-800x600.webp",
  "custom-shape-signs":  "/images/products/product/coroplast-diecut-sasknation-key-800x600.webp",
  "boat-registration-numbers": "/images/industries/boat-registration-numbers/boat-registration-number-decal-aluminum-bow-1200x800.webp",
  // Label family — same vinyl as stickers, separate slugs so customers can shop by the job.
  "product-labels":      "/images/products/product/product-labels-product-800x600.webp",
  "cosmetic-labels":     "/images/products/product/cosmetic-labels-product-800x600.webp",
  "freezer-labels":      "/images/products/product/freezer-labels-product-800x600.webp",
  "candle-jar-labels":   "/images/products/product/candle-jar-labels-product-800x600.webp",
  "roll-labels":         "/images/products/product/roll-labels-product-800x600.webp",
};
