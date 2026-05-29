/**
 * Feature flags for the Product Configurator Unification rollout.
 *
 * Two flags per category to allow phased exposure (staff first, observe, then
 * public). Both default false → legacy code path until the flag is explicitly
 * set "true" on Railway env (or .env.local for dev).
 *
 * NEXT_PUBLIC_ prefix is required because these flags are read by client
 * components ("use client"). NOT secrets — they're public switches.
 *
 * CRITICAL: each access MUST be a LITERAL property reference like
 * `process.env.NEXT_PUBLIC_FOO`. Next.js' webpack replaces these at build
 * time via static analysis — dynamic access like `process.env[name]` would
 * fall through to runtime, where on the client process.env is empty {} and
 * the flag silently reads OFF. That bug shipped in c71f2a1 and caused
 * stickers to never appear in dev even with .env.local set. Fixed here.
 *
 * Rollout pattern (per vault 2026-05-29-product-configurator-unification-wave1):
 *   1. Flip _STAFF=true → Albert sees the new staff configurator
 *   2. Watch 3–4 days. If clean, flip _PUBLIC=true → customers see the new product page
 *   3. If anything breaks: flip the failing flag to "false" — 30-second rollback
 */

export const flags = {
  // Wave 1 — Stickers
  useProductConfigStickerStaff: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_STICKER_STAFF === "true",
  useProductConfigStickerPublic: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_STICKER_PUBLIC === "true",

  // Wave 2 — Booklets
  useProductConfigBookletStaff: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_BOOKLET_STAFF === "true",
  useProductConfigBookletPublic: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_BOOKLET_PUBLIC === "true",

  // Wave 3 — Display (retractable banners)
  useProductConfigDisplayStaff: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_DISPLAY_STAFF === "true",
  useProductConfigDisplayPublic: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_DISPLAY_PUBLIC === "true",

  // Wave 4 — Decals (window-decals + window-perf)
  useProductConfigDecalStaff: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_DECAL_STAFF === "true",
  useProductConfigDecalPublic: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_DECAL_PUBLIC === "true",

  // Wave 5 — Brochures
  useProductConfigBrochureStaff: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_BROCHURE_STAFF === "true",
  useProductConfigBrochurePublic: () =>
    process.env.NEXT_PUBLIC_USE_PRODUCT_CONFIG_BROCHURE_PUBLIC === "true",

  // STICKER pricing model V2 — replaces engine's catalog/area-scale path with
  // the data-driven model from sticker-model-v2.ts (90% retail fit against
  // Albert's email history). When ON, engine routes STICKER quotes through
  // quoteStickerV2 regardless of qty/size — no more snap-to-tier blocks, no
  // more 4×4 reference baseline. Per vault 2026-05-29 wave1 plan path A.
  useStickerPricingV2: () =>
    process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 === "true",
};
