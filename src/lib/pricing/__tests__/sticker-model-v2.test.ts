/**
 * Sticker model V2 validation — runs all 19 historical Albert quotes through
 * the new pricing model and reports a diff table. Does NOT fail the test
 * suite on diffs (the model is a fit, not a contract yet) — instead, asserts
 * that the fit stays within ±25% of actual on ≥80% of fixtures, and prints
 * a per-fixture table so we can eyeball the tier table.
 *
 * Once the model is tuned and approved, the contract assertions tighten.
 */

import { describe, it, expect } from "vitest";
import { ALBERT_STICKER_QUOTES, RETAIL_FIXTURES, type StickerQuoteFixture } from "./sticker-fixtures";
import { quoteStickerV2 } from "../sticker-model-v2";

interface Diff {
  fixture: StickerQuoteFixture;
  predicted_unit: number;
  predicted_total: number;
  unit_delta_pct: number;
  total_delta_dollars: number;
  total_delta_pct: number;
  within_25pct: boolean;
}

function computeDiffs(fixtures: StickerQuoteFixture[] = ALBERT_STICKER_QUOTES): Diff[] {
  return fixtures.map((f) => {
    const result = quoteStickerV2({
      width_in: f.width_in,
      height_in: f.height_in,
      qty: f.qty,
      material: f.material,
      shape: f.shape,
      finish: f.finish,
    });
    const unit_delta_pct = ((result.unit_price - f.actual_unit_price) / f.actual_unit_price) * 100;
    const total_delta_dollars = result.total - f.actual_total;
    const total_delta_pct = (total_delta_dollars / f.actual_total) * 100;
    return {
      fixture: f,
      predicted_unit: result.unit_price,
      predicted_total: result.total,
      unit_delta_pct,
      total_delta_dollars,
      total_delta_pct,
      within_25pct: Math.abs(total_delta_pct) <= 25,
    };
  });
}

function fmt(n: number, dp = 2): string {
  return n.toFixed(dp);
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function renderTable(diffs: Diff[], label: string) {
  console.log(`\n\n=== ${label} ===\n`);
  console.log("| Date | Customer | Size | Qty | Mat | Shape | Actual $/ea | Predicted $/ea | Δ% | Actual total | Predicted total | Δ$ | Δ% | ✓/✗ |");
  console.log("|------|----------|------|-----|-----|-------|------------:|---------------:|----|-------------:|----------------:|----|----|-----|");
  for (const d of diffs) {
    const f = d.fixture;
    const within = d.within_25pct ? "✓" : "✗";
    console.log(
      `| ${f.date} | ${f.customer.padEnd(28)} | ${f.width_in}×${f.height_in} | ${f.qty} | ${f.material} | ${f.shape} | $${fmt(f.actual_unit_price)} | $${fmt(d.predicted_unit)} | ${fmtPct(d.unit_delta_pct)} | $${fmt(f.actual_total)} | $${fmt(d.predicted_total)} | ${d.total_delta_dollars >= 0 ? "+" : ""}$${fmt(d.total_delta_dollars)} | ${fmtPct(d.total_delta_pct)} | ${within} |`
    );
  }

  const within = diffs.filter((d) => d.within_25pct).length;
  const totalAbsDeltaPct = diffs.reduce((s, d) => s + Math.abs(d.total_delta_pct), 0);
  const meanAbsErrorPct = totalAbsDeltaPct / diffs.length;

  console.log(`\n--- Summary ---`);
  console.log(`Fixtures: ${diffs.length}`);
  console.log(`Within ±25%: ${within} / ${diffs.length} (${((within / diffs.length) * 100).toFixed(1)}%)`);
  console.log(`Mean absolute error: ${meanAbsErrorPct.toFixed(1)}%`);
  console.log(`Engine OVERCHARGES (Δ > +5%): ${diffs.filter((d) => d.total_delta_pct > 5).length}`);
  console.log(`Engine UNDERCHARGES (Δ < -5%): ${diffs.filter((d) => d.total_delta_pct < -5).length}`);
  console.log(`Engine MATCHES (|Δ| ≤ 5%): ${diffs.filter((d) => Math.abs(d.total_delta_pct) <= 5).length}\n`);
}

describe("Sticker Model V2 — fit against Albert's RETAIL quotes (wholesale excluded)", () => {
  const retailDiffs = computeDiffs(RETAIL_FIXTURES);
  const allDiffs = computeDiffs();

  it("prints the retail-only diff table (canonical fit)", () => {
    renderTable(retailDiffs, "STICKER MODEL V2 — RETAIL-ONLY FIT (MOBO/Inkhouse excluded)");
  });

  it("prints the full diff table including wholesale (for reference)", () => {
    renderTable(allDiffs, "STICKER MODEL V2 — FULL DATASET INCL. WHOLESALE (reference only)");
    const wholesale = allDiffs.filter((d) => d.fixture.excluded_wholesale);
    console.log(`Wholesale fixtures excluded from canonical fit: ${wholesale.length}`);
    for (const d of wholesale) {
      console.log(`  - ${d.fixture.customer} (${d.fixture.date}): actual $${d.fixture.actual_total}, model $${d.predicted_total} (Δ ${fmtPct(d.total_delta_pct)})`);
    }
  });

  it("fits at least 80% of RETAIL fixtures within ±25% of Albert's actual quote", () => {
    const within = retailDiffs.filter((d) => d.within_25pct).length;
    const pct = (within / retailDiffs.length) * 100;
    expect(pct).toBeGreaterThanOrEqual(80);
  });

  it("never undercharges retail customers by more than 50% (revenue protection)", () => {
    for (const d of retailDiffs) {
      if (d.total_delta_pct < -50) {
        throw new Error(
          `Model undercharges by ${d.total_delta_pct.toFixed(1)}% on ${d.fixture.customer} (${d.fixture.date}): actual $${d.fixture.actual_total}, predicted $${d.predicted_total}`
        );
      }
    }
  });
});
