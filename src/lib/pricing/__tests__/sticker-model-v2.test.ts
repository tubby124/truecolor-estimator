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

  // 2026-08-16: the fixture set grew from 19 to 40 retail quotes (a gap-fill
  // sweep pulled every real Albert quote from 2026-05-29 -> 2026-08-16, since
  // the model had gone 2.5 months stale). The expanded, more representative
  // data set the true pass rate at 71.4%, below the original 80% bar the
  // model was fit to hit on a much smaller sample. A same-day fix (qty_100_249
  // per_unit_floor 0.55->0.65) recovered one real failure without regressing
  // any passing fixture, but does not single-handedly restore 80% - the
  // remaining gap is real, tracked debt (see failing clusters: qty_2-9
  // overcharges, qty_500-999 misfires on sub-0.1-sqft pieces, perf_8mil n=2,
  // wide-format qty>1 n=1), not a fudge. Lowered to 70% to keep this gate
  // honest and failing on any FURTHER regression, rather than leaving it
  // permanently red (which would block the repo's mandatory `npm test` gate
  // for unrelated work) or silently raising it back to a number the model
  // doesn't actually hit. Tighten it again only as each cluster gets a real
  // fix, not by moving the number to match wherever the code happens to land.
  // 2026-08-16 (later same day): perf_8mil floor 50->70 fixed the perf cluster
  // (both Juliana window decals now within 3%) -> 32/42 = 76.2%. Bar 70->75.
  // 2026-08-16 PM recalibration (floor 50-99 -> 1.20, rates 10-249 -> 9,
  // floor 500-999 -> 0.33, circle 1.8 -> 1.4): Michaela exact, Arieanna, David
  // Hodges, Assem-500 all in band; Luby out (+33%) -> 34/42 = 81.0%. Bar 75->80.
  // (qty_10_49 floor kept at 1.00 to preserve the live "25 stickers from $25" ads claim.)
  it("fits at least 80% of RETAIL fixtures within ±25% of Albert's actual quote", () => {
    const within = retailDiffs.filter((d) => d.within_25pct).length;
    const pct = (within / retailDiffs.length) * 100;
    expect(pct).toBeGreaterThanOrEqual(80);
  });

  // 2026-08-16: locks the configurator-facing invariant that ordering MORE
  // never costs LESS in total across the preset qty buttons, for every size
  // preset + a fine custom-size grid, every material and shape. (Per-unit is
  // allowed to step up once, 25->50, to keep "25 stickers from $25" true.)
  it("order total never decreases across preset quantities (25/50/100/250/500/1000)", () => {
    const presets = [25, 50, 100, 250, 500, 1000];
    const sizes: [number, number][] = [[1,3],[2,2],[2,3],[2,4],[3,3],[4,4],[4,6],[5,5],[6,6],[8,8]];
    for (let w = 1; w <= 24; w += 0.5) for (let h = w; h <= 24; h += 0.5) sizes.push([w, h]);
    const combos: Array<[StickerQuoteFixture["material"], StickerQuoteFixture["shape"]]> = [
      ["vinyl_white", "square"], ["vinyl_white", "die_cut"], ["vinyl_white", "circle"],
      ["vinyl_clear", "square"], ["vinyl_clear", "circle"], ["perf_8mil", "square"],
    ];
    const violations: string[] = [];
    for (const [material, shape] of combos) for (const [w, h] of sizes) {
      let prev = -1;
      for (const qty of presets) {
        const r = quoteStickerV2({ width_in: w, height_in: h, qty, material, shape, finish: "gloss_lam" });
        if (r.total < prev - 1e-9) violations.push(`${material}/${shape} ${w}x${h} qty ${qty}: $${prev} -> $${r.total}`);
        prev = r.total;
      }
    }
    expect(violations, violations.slice(0, 10).join("\n")).toEqual([]);
  });

  // ---------------------------------------------------------------------
  // Quantity envelope (2026-08-16). The preset test above only covers the six
  // buttons; a TYPED qty could land mid-tier and cost more than a larger order
  // (99 × 4×4 = $118.80 vs 100 × 4×4 = $100). The envelope caps every qty >= 10
  // at the cheapest tier-start total above it. qty 1-9 is deliberately excluded
  // (owner declined restructuring those tiers).
  // ---------------------------------------------------------------------

  it("order total never decreases across EVERY integer quantity 10..1100", () => {
    const sizes: [number, number][] = [[2,2],[3,3],[4,4],[5,5],[8,8],[12,1.5]];
    const materials: StickerQuoteFixture["material"][] = ["vinyl_white", "vinyl_clear"];
    const shapes: StickerQuoteFixture["shape"][] = ["square", "circle"];
    const violations: string[] = [];
    for (const material of materials) for (const shape of shapes) for (const [w, h] of sizes) {
      let prev = quoteStickerV2({ width_in: w, height_in: h, qty: 10, material, shape, finish: "gloss_lam" }).total;
      for (let qty = 11; qty <= 1100; qty++) {
        const total = quoteStickerV2({ width_in: w, height_in: h, qty, material, shape, finish: "gloss_lam" }).total;
        if (total < prev - 1e-9) {
          violations.push(`${material}/${shape} ${w}x${h} qty ${qty - 1}->${qty}: $${prev} -> $${total}`);
        }
        prev = total;
      }
    }
    expect(violations, violations.slice(0, 10).join("\n")).toEqual([]);
  });

  it("does NOT apply the envelope below qty 10 — qty 9 keeps its qty_2_9 tier price", () => {
    for (let qty = 1; qty <= 9; qty++) {
      const r = quoteStickerV2({ width_in: 4, height_in: 4, qty, material: "vinyl_white", shape: "square", finish: "gloss_lam" });
      expect(r.qty_envelope_applied, `qty ${qty}`).toBe(false);
      expect(r.qty_envelope_from_qty, `qty ${qty}`).toBeNull();
      expect(r.qty_tier_label, `qty ${qty}`).toBe(qty === 1 ? "qty_1" : "qty_2_9");
      // $25/ea floor dominates a 4×4 in both qty 1-9 tiers — unchanged by the envelope.
      expect(r.unit_price, `qty ${qty}`).toBe(25);
      expect(r.total, `qty ${qty}`).toBe(25 * qty);
    }
  });

  it("caps 99 × 4×4 at the 100 × 4×4 total (the cliff this envelope exists for)", () => {
    const base = { width_in: 4, height_in: 4, material: "vinyl_white" as const, shape: "square" as const, finish: "gloss_lam" as const };
    const q99 = quoteStickerV2({ ...base, qty: 99 });
    const q100 = quoteStickerV2({ ...base, qty: 100 });
    expect(q100.total).toBe(100);
    expect(q99.total).toBe(q100.total);
    expect(q99.qty_envelope_applied).toBe(true);
    expect(q99.qty_envelope_from_qty).toBe(100);
    expect(q99.unit_price).toBe(1.01); // 100 / 99, rounded to the cent
    expect(q100.qty_envelope_applied).toBe(false);
  });

  it("preset quantities never trigger the envelope (they were already monotone)", () => {
    for (const qty of [25, 50, 100, 250, 500, 1000]) {
      const r = quoteStickerV2({ width_in: 4, height_in: 4, qty, material: "vinyl_white", shape: "square", finish: "gloss_lam" });
      expect(r.qty_envelope_applied, `qty ${qty}`).toBe(false);
      expect(r.qty_envelope_from_qty, `qty ${qty}`).toBeNull();
    }
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
