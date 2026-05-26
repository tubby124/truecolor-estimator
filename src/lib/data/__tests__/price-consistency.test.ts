/**
 * price-consistency.test.ts
 *
 * The safety-net guard for the getProductConfig migration. Asserts that the
 * representative-config drift checker reports zero drift. If this test fails:
 *   - A locked-SKU price in products.v1.csv was changed unintentionally, OR
 *   - A marketing "from $X" anchor is now stale vs the engine, OR
 *   - The engine rule itself changed in a way that moved a watched price.
 *
 * Per vault: Projects/true-color/2026-05-26-getProductConfig-safe-migration-strategy.md
 *
 * THIS TEST IS A BLOCKING GATE on the migration. Do NOT bypass it. Fix the
 * drift, OR update the LOCKED_SKUS / MARKETING_ANCHORS in
 * src/lib/data/price-consistency.ts to reflect the intentional change, then
 * commit + push.
 */

import { describe, it, expect } from "vitest";
import { checkPriceConsistency } from "../price-consistency";

describe("Price consistency — getProductConfig migration safety net", () => {
  const rows = checkPriceConsistency();

  it("returns at least one row (test setup sanity)", () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  for (const row of rows) {
    it(`${row.expected_source} · ${row.category} · ${row.config_label} — ${row.status}`, () => {
      if (row.status === "blocked") {
        throw new Error(`BLOCKED: ${row.note}`);
      }
      if (row.status === "drift") {
        throw new Error(
          `PRICE DRIFT: ${row.category} · ${row.config_label} — expected $${row.expected_price} (${row.expected_source}), engine returned $${row.actual_price}, Δ ${row.delta}. ${row.note}`
        );
      }
      // "skipped" is advisory (doc drift, not price drift) — allowed through.
      expect(["match", "skipped"]).toContain(row.status);
    });
  }
});
