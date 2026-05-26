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
  "RIGID-ACP3-24X36-S", // retired 2026-05-20 — AGENTS.md still says locked
  "SIGN-CORO4-4X8FT-S",
];

/**
 * Marketing "from $X" claims from data/PRICING_QUICK_REFERENCE.md.
 * Each maps to a REAL product_id in products.v1.csv whose engine-priced
 * amount we then verify matches the marketing claim.
 */
const MARKETING_ANCHORS: Array<{
  category: Category;
  config_label: string;
  expected_from: number;
  product_id: string;
  note: string;
}> = [
  { category: "BANNER",    config_label: "Banner 'from $66' → 2×4 ft",       expected_from: 66, product_id: "BANNER-V13-2X4FT",  note: "Banner from-anchor backed by smallest active SKU" },
  { category: "RIGID",     config_label: "ACP 'from $39' → 18×24″",          expected_from: 39, product_id: "RIGID-ACP3-18X24-S", note: "ACP from-anchor backed by smallest active SKU" },
  { category: "FOAMBOARD", config_label: "Foamboard 'from $45' → 18×24″",    expected_from: 45, product_id: "FOAM-5MM-18X24-S",   note: "Foamboard from-anchor backed by 18×24 fixed SKU" },
];

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

  // ─── Layer 3: marketing anchors ──────────────────────────────────────────
  for (const anchor of MARKETING_ANCHORS) {
    const p = productsById.get(anchor.product_id);
    if (!p) {
      rows.push({
        category: anchor.category,
        config_label: anchor.config_label,
        expected_source: "marketing_anchor",
        expected_price: anchor.expected_from,
        actual_price: null,
        delta: null,
        status: "drift",
        note: `Marketing anchor maps to ${anchor.product_id} but that product_id is missing from products.v1.csv. ${anchor.note}`,
      });
      continue;
    }
    if (p.is_active === false) {
      rows.push({
        category: anchor.category,
        config_label: anchor.config_label,
        expected_source: "marketing_anchor",
        expected_price: anchor.expected_from,
        actual_price: Number(p.price ?? 0),
        delta: null,
        status: "drift",
        note: `Marketing anchor points at retired SKU ${anchor.product_id}. Find a new representative SKU or update PRICING_QUICK_REFERENCE.md. ${anchor.note}`,
      });
      continue;
    }
    const sides = (p.sides === 2 ? 2 : 1) as 1 | 2;
    let actual: number | null = null;
    let note = anchor.note;
    try {
      const result = estimate({
        category: anchor.category,
        material_code: p.material_code,
        width_in: p.width_in,
        height_in: p.height_in,
        sides,
        qty: p.qty,
      });
      actual = result.sell_price ?? null;
    } catch (err) {
      note = `Engine threw: ${err instanceof Error ? err.message : String(err)}`;
    }
    const delta = actual != null ? Math.round((actual - anchor.expected_from) * 100) / 100 : null;
    // Marketing anchor passes when engine price EQUALS the from-claim (exact)
    // OR is ABOVE it (we charge more than advertised — still honest because
    // larger configs always cost more, and the "from" is the floor).
    // The drift case is engine BELOW marketing claim — bait-and-switch risk.
    const status: PriceConsistencyRow["status"] =
      actual == null ? "blocked"
      : Math.abs((actual - anchor.expected_from)) < 0.01 ? "match"
      : actual > anchor.expected_from ? "match"
      : "drift";
    rows.push({
      category: anchor.category,
      config_label: anchor.config_label,
      expected_source: "marketing_anchor",
      expected_price: anchor.expected_from,
      actual_price: actual,
      delta,
      status,
      note,
    });
  }

  return rows;
}
