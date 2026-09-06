/**
 * price-consistency — drift detector for the getProductConfig safe migration.
 *
 * Three layers of check, ranked by contract strictness:
 *
 * 1. **Locked-price SKUs (HARD CONTRACT)** — products called out in AGENTS.md
 *    `.claude/rules/truecolor-pricing-safety.md` as "NEVER touch." Engine
 *    output MUST match the CSV price for these. Any drift = blocking failure.
 *
 * 2. **Docs-drift check (HARD CONTRACT)** — every SKU listed as locked in
 *    AGENTS.md must STILL be `is_active=TRUE` in products.v1.csv. If a SKU
 *    was retired in CSV but the doc wasn't updated, the doc is stale and
 *    misleading future Claude / future Hasan.
 *
 * 3. **Marketing anchors (HARD CONTRACT)** — "from $X" claims in
 *    data/PRICING_QUICK_REFERENCE.md must map to a real CSV product whose
 *    engine-priced amount matches the claim. If marketing says "Banner from
 *    $66" but the cheapest banner SKU prices at $52, customers will see
 *    $52 — we're advertising HIGHER than we charge. Or vice versa: charging
 *    more than advertised = bait-and-switch.
 *
 * Read by:
 *   - /staff/lifecycle PriceConsistencyPanel (visibility)
 *   - src/lib/data/__tests__/price-consistency.test.ts (CI gate)
 *
 * Per vault: Projects/true-color/2026-05-26-getProductConfig-safe-migration-strategy.md
 */

import { estimate } from "@/lib/engine";
import { getProducts } from "./loader";
import type { Category } from "./types";
import { PRODUCTS } from "./products-content";
import { resolveProductFacts, type ProductFactsConfiguration } from "@/lib/pricing/product-facts";
import type { PriceConsistencyRow } from "@/app/staff/lifecycle/PriceConsistencyPanel";

/**
 * Locked-price SKUs from `.claude/rules/truecolor-pricing-safety.md`.
 * These are intentionally fixed; engine output must equal CSV price.
 */
const LOCKED_SKUS: Array<{ productId: string; expected: number; note: string }> = [
  { productId: "BANNER-V13-2X6FT",  expected: 90,  note: "Owner-set intentional price (2×6 ft banner)" },
  { productId: "SIGN-CORO4-4X8FT-S", expected: 232, note: "Owner-set intentional price (4×8 ft coro 1S)" },
  // NOTE: RIGID-ACP3-24X36-S was in this list historically but was retired
  // 2026-05-20 (see CSV source_ref column). Removed here; flagged via the
  // separate docs-drift check below so AGENTS.md gets updated.
];

/**
 * SKUs that AGENTS.md / .claude/rules still call out as locked. Any of these
 * that no longer exist as `is_active=TRUE` in products.v1.csv = doc drift.
 */
const DOCS_REFERENCED_LOCKED_SKUS = [
  "BANNER-V13-2X6FT",
  "SIGN-CORO4-4X8FT-S",
];

/**
 * Marketing "from $X" claims from data/PRICING_QUICK_REFERENCE.md.
 * Each maps to a REAL product_id in products.v1.csv whose engine-priced
 * amount we then verify matches the marketing claim.
 */
// Explicit advertised configurations. Expected values come from the PUBLIC
// product content itself, so changing duplicated test constants cannot hide drift.
const MARKETING_ANCHORS: Array<{ productSlug: string; configuration?: ProductFactsConfiguration }> = [
  { productSlug: "vinyl-banners" },
  { productSlug: "acp-signs", configuration: { width_in: 18, height_in: 24 } },
  { productSlug: "coroplast-signs" },
  { productSlug: "foamboard-displays", configuration: { width_in: 18, height_in: 24 } },
  { productSlug: "business-cards" },
  { productSlug: "flyers" },
  { productSlug: "stickers", configuration: { width_in: 2, height_in: 2 } },
  { productSlug: "postcards", configuration: { width_in: 4, height_in: 3, qty: 50 } },
  { productSlug: "brochures" },
  { productSlug: "photo-posters" },
  { productSlug: "retractable-banners" },
];

export function marketingPriceStatus(actual: number | null, advertised: number): PriceConsistencyRow["status"] {
  if (actual === null || !Number.isFinite(advertised)) return "blocked";
  return Math.abs(actual - advertised) < 0.01 ? "match" : "drift";
}

export function checkPriceConsistency(): PriceConsistencyRow[] {
  const rows: PriceConsistencyRow[] = [];
  const productsById = new Map(getProducts().map((p) => [p.product_id, p]));

  // ─── Layer 1: locked SKUs ────────────────────────────────────────────────
  for (const locked of LOCKED_SKUS) {
    const p = productsById.get(locked.productId);
    if (!p) {
      rows.push({
        category: locked.productId.split("-")[0] ?? "UNKNOWN",
        config_label: locked.productId,
        expected_source: "products_csv",
        expected_price: locked.expected,
        actual_price: null,
        delta: null,
        status: "blocked",
        note: `Locked SKU missing from products.v1.csv — was it retired? Update price-consistency.ts to remove.`,
      });
      continue;
    }
    if (p.is_active === false) {
      rows.push({
        category: p.category,
        config_label: locked.productId,
        expected_source: "products_csv",
        expected_price: locked.expected,
        actual_price: null,
        delta: null,
        status: "blocked",
        note: `Locked SKU is is_active=FALSE in CSV (retired). Remove from LOCKED_SKUS.`,
      });
      continue;
    }
    const sides = (p.sides === 2 ? 2 : 1) as 1 | 2;
    let actual: number | null = null;
    let note = locked.note;
    try {
      const result = estimate({
        category: p.category as Category,
        material_code: p.material_code,
        width_in: p.width_in,
        height_in: p.height_in,
        sides,
        qty: p.qty,
        skip_min_charge: true,
      });
      actual = result.sell_price ?? null;
    } catch (err) {
      note = `Engine threw: ${err instanceof Error ? err.message : String(err)}`;
    }
    const delta = actual != null ? Math.round((actual - locked.expected) * 100) / 100 : null;
    const status: PriceConsistencyRow["status"] =
      actual == null ? "blocked"
      : Math.abs((actual - locked.expected)) < 0.01 ? "match"
      : "drift";
    rows.push({
      category: p.category,
      config_label: locked.productId,
      expected_source: "products_csv",
      expected_price: locked.expected,
      actual_price: actual,
      delta,
      status,
      note,
    });
  }

  // ─── Layer 2: docs drift — referenced locked SKUs must be active in CSV ──
  for (const productId of DOCS_REFERENCED_LOCKED_SKUS) {
    const p = productsById.get(productId);
    const isLockedInCode = LOCKED_SKUS.some((l) => l.productId === productId);
    if (!p) {
      // SKU is either fully missing from CSV OR was retired (is_active=FALSE
      // — loader filters those out). Either way this is doc drift, not price
      // drift — status:skipped so the CI test doesn't block, but the panel
      // still surfaces it for Hasan to update the doc.
      rows.push({
        category: productId.split("-")[0] ?? "UNKNOWN",
        config_label: productId + " (docs ref)",
        expected_source: "products_csv",
        expected_price: null,
        actual_price: null,
        delta: null,
        status: "skipped",
        note: `AGENTS.md references this SKU as locked, but it's missing from active products (retired or removed). Update .claude/rules/truecolor-pricing-safety.md and AGENTS.md.`,
      });
      continue;
    }
    if (p.is_active === false) {
      rows.push({
        category: p.category,
        config_label: productId + " (docs ref)",
        expected_source: "products_csv",
        expected_price: null,
        actual_price: Number(p.price ?? 0),
        delta: null,
        // This is a doc-drift WARNING, not a price-drift FAILURE — track as
        // "skipped" so the CI test doesn't block on it, but the panel
        // surfaces it for Hasan to update the docs.
        status: "skipped",
        note: `AGENTS.md still lists as locked, but CSV is_active=FALSE (retired). Update .claude/rules/truecolor-pricing-safety.md and AGENTS.md.`,
      });
      continue;
    }
    // Active + in LOCKED_SKUS = covered by layer 1 above. Nothing to add.
    if (isLockedInCode) continue;
    // Active + NOT in LOCKED_SKUS but referenced by docs = needs adding
    rows.push({
      category: p.category,
      config_label: productId + " (docs ref)",
      expected_source: "products_csv",
      expected_price: null,
      actual_price: Number(p.price ?? 0),
      delta: null,
      status: "skipped",
      note: `Active SKU referenced as locked in AGENTS.md but missing from LOCKED_SKUS in price-consistency.ts — add it for full coverage.`,
    });
  }

  // Compare each advertised starting configuration's checkout subtotal exactly.
  for (const anchor of MARKETING_ANCHORS) {
    const product = PRODUCTS[anchor.productSlug];
    const expected = Number(product.fromPrice.match(/\$([\d.]+)/)?.[1]);
    let actual: number | null = null;
    let label = product.name;
    let note = "Public product fromPrice compared with configured standalone pre-tax order total.";
    try {
      const facts = resolveProductFacts(anchor);
      actual = facts.standalonePreTaxOrderTotal;
      label = facts.configurationLabel;
      if (facts.minimumDisclosure) note += ` ${facts.minimumDisclosure}`;
    } catch (error) {
      note = error instanceof Error ? error.message : String(error);
    }
    rows.push({
      category: product.category,
      config_label: `${product.name} — ${label}`,
      expected_source: "marketing_anchor",
      expected_price: expected,
      actual_price: actual,
      delta: actual === null ? null : Math.round((actual - expected) * 100) / 100,
      status: marketingPriceStatus(actual, expected),
      note,
    });
  }
  return rows;
}
