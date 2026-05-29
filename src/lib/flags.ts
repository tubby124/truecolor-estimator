/**
 * Feature flags for the Product Configurator Unification rollout.
 *
 * Two flags per category to allow phased exposure (staff first, observe, then
 * public). Both default false → legacy code path until the flag is explicitly
 * set "true" on Railway env.
 *
 * NEXT_PUBLIC_ prefix is required because these flags are read by client
 * components ("use client"). NOT secrets — they're public switches.
 *
 * Rollout pattern (per vault: 2026-05-29-product-configurator-unification-wave1-plan):
 *   1. Flip _STAFF=true → Albert sees the new staff configurator
 *   2. Watch 3–4 days. If clean, flip _PUBLIC=true → customers see the new product page
 *   3. If anything breaks on either side: flip that flag to "false" — 30-second rollback
 */

function readBoolFlag(name: string): boolean {
  // process.env is inlined at build time for NEXT_PUBLIC_ vars — safe in client.
  const raw = process.env[name];
  return raw === "true";
}

export const flags = {
  // Wave 1 — Stickers
  useProductConfigStickerStaff: () => readBoolFlag("NEXT_PUBLIC_USE_PRODUCT_CONFIG_STICKER_STAFF"),
  useProductConfigStickerPublic: () => readBoolFlag("NEXT_PUBLIC_USE_PRODUCT_CONFIG_STICKER_PUBLIC"),
};
