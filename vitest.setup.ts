/**
 * Vitest global setup — align the test environment with production env flags.
 *
 * vitest does NOT load .env.local, so without this file every engine test ran
 * the LEGACY fixed-SKU sticker path (products.v1.csv STICKER-* rows) while
 * Railway production runs the V2 model. That meant the main suites were
 * guarding prices that are dead in prod.
 *
 * The flag is read at CALL time (src/lib/flags.ts:60 →
 * `process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 === "true"`, invoked from
 * src/lib/engine/index.ts:46), not at module load — so a plain assignment here
 * is enough. No vi.stubEnv / module reset needed. Tests that deliberately
 * exercise the legacy path must stub the flag OFF themselves.
 *
 * Only flags the ENGINE reads are set here. The two UI rollout flags prod also
 * has ON — NEXT_PUBLIC_USE_PRODUCT_CONFIG_STICKER_STAFF and
 * ..._STICKER_PUBLIC — only gate which configurator component renders, so they
 * are intentionally left unset.
 */

process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 = "true";
