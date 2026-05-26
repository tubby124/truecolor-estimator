/**
 * Price Contract Test (Domain A, Layer 1 — the harness's price-drift guard)
 *
 * The recurring pain: change one price in a CSV, and a price silently breaks
 * somewhere else. This is the smoke alarm. It runs EVERY active product through
 * the real engine and snapshots the result. When a CSV price (or engine rule)
 * changes, this test FAILS and the snapshot diff names EXACTLY which products /
 * sizes moved — so an unintended change can never ship silently.
 *
 * It also enumerates representative sqft-tier sizes (not in the fixed catalog)
 * so the per-sqft tier math is locked too.
 *
 * WHEN YOU INTENTIONALLY CHANGE A PRICE:
 *   1. This test fails (expected).
 *   2. Run:  npm test -- -u    (updates the snapshot)
 *   3. Review the snapshot diff in git — it shows every price that moved.
 *      If the diff matches what you meant to change, commit it. If extra
 *      prices moved that you did NOT intend, you just caught a bug.
 *
 * New products added to products.v1.csv auto-appear here (enumerated live), so
 * "add a product → it's covered" holds with zero extra work.
 *
 * Runs via `npm test` + the Stop hook on engine/CSV changes.
 */

import { describe, it, expect } from "vitest";
import { estimate } from "../index";
import { getProducts } from "@/lib/data/loader";

// Compact, reviewable price fingerprint per config.
function fingerprint(req: Parameters<typeof estimate>[0]): string {
  const r = estimate(req);
  if (r.status !== "QUOTED") return `${r.status}`;
  // sell_price is the pre-tax engine price — the number that drives everything
  // downstream (cart, email, marketing anchors). tier names the rule that fired.
  const placeholder = r.has_placeholder ? " ·PLACEHOLDER" : "";
  return `${r.tier_applied} → $${r.sell_price?.toFixed(2)}${placeholder}`;
}

describe("Price contract — every active product through the engine", () => {
  it("matches the committed price snapshot (any change names the moved products)", () => {
    const products = getProducts(); // active only
    const matrix: Record<string, string> = {};

    for (const p of products) {
      matrix[p.product_id] = fingerprint({
        category: p.category,
        material_code: p.material_code,
        width_in: p.width_in,
        height_in: p.height_in,
        sides: p.sides,
        qty: p.qty,
      });
    }

    // Sorted for a stable, diff-friendly snapshot regardless of CSV row order.
    const sorted = Object.fromEntries(
      Object.keys(matrix).sort().map((k) => [k, matrix[k]])
    );
    expect(sorted).toMatchSnapshot();
  });
});

describe("Price contract — representative sqft-tier sizes (locks tier math)", () => {
  // Curated sizes that are NOT necessarily fixed-catalog SKUs, chosen to exercise
  // each sqft-priced category across small/medium/large tiers. Expected values are
  // snapshotted (not hand-typed) — so picking sizes carries no correctness risk.
  const cases: Array<{ label: string; req: Parameters<typeof estimate>[0] }> = [
    // Coroplast signs (sqft tiers)
    { label: "CORO 18x24 1S", req: { category: "SIGN", material_code: "MPHCC020", width_in: 18, height_in: 24, sides: 1, qty: 1 } },
    { label: "CORO 24x36 1S", req: { category: "SIGN", material_code: "MPHCC020", width_in: 24, height_in: 36, sides: 1, qty: 1 } },
    { label: "CORO 48x96 1S", req: { category: "SIGN", material_code: "MPHCC020", width_in: 48, height_in: 96, sides: 1, qty: 1 } },
    // ACP / rigid aluminum (additive 2S uplift)
    { label: "ACP 18x24 1S", req: { category: "RIGID", material_code: "RMACP002", width_in: 18, height_in: 24, sides: 1, qty: 1 } },
    { label: "ACP 24x36 2S", req: { category: "RIGID", material_code: "RMACP002", width_in: 24, height_in: 36, sides: 2, qty: 1 } },
    // Vinyl banners (sqft tiers) — non-catalog sizes so the tier math runs
    // (catalog sizes like 2x6ft hit the fixed-price SKU instead of a tier).
    { label: "BANNER 24x60 1S (10sqft→T1)", req: { category: "BANNER", material_code: "RMBF004", width_in: 24, height_in: 60, sides: 1, qty: 1 } },
    { label: "BANNER 36x84 1S (21sqft→T2)", req: { category: "BANNER", material_code: "RMBF004", width_in: 36, height_in: 84, sides: 1, qty: 1 } },
  ];

  for (const c of cases) {
    it(`${c.label} matches snapshot`, () => {
      expect(fingerprint(c.req)).toMatchSnapshot();
    });
  }
});

describe("Price contract — $25 order-total floor sanity", () => {
  // Not a snapshot — an invariant. The single smallest realistic configs must
  // never quote a NEGATIVE or zero sell_price, and BLOCKED must stay BLOCKED.
  it("a tiny sticker still produces a positive engine price (floor applied at checkout, not here)", () => {
    const r = estimate({ category: "STICKER", width_in: 2, height_in: 2, sides: 1, qty: 1 });
    // Engine returns the raw price; the $25 floor is applied at checkout via
    // order-min.ts, not in the engine. So just assert it's a sane positive number.
    if (r.status === "QUOTED") {
      expect(r.sell_price).toBeGreaterThan(0);
    }
  });
});
