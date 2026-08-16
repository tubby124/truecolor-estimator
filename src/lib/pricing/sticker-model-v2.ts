/**
 * Sticker pricing model V2 — reverse-engineered from Albert's email quotes.
 *
 * Replaces the existing engine path (fixed-size lot SKUs at 4×4 reference with
 * area-scaling fallback) with a continuous (qty_tier × sqft × material × shape)
 * model that matches Albert's actual mental math across the full size/qty
 * spectrum.
 *
 * This file is STANDALONE — not yet wired into the engine. It exists so we can
 * validate against historical quotes (see __tests__/sticker-model-v2.test.ts +
 * sticker-fixtures.ts) before touching CSV or engine code.
 *
 * Model:
 *   unit_price = max(per_unit_floor[qty_tier], sqft × rate_per_sqft[qty_tier])
 *   unit_price *= material_multiplier (clear vinyl = 1.44)
 *   unit_price *= shape_multiplier (die_cut = 1.15)
 *   total = max(ORDER_MIN, qty × unit_price)
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import type { StickerMaterial, StickerShape, StickerFinish } from "./__tests__/sticker-fixtures";

export interface StickerInputs {
  width_in: number;
  height_in: number;
  qty: number;
  material: StickerMaterial;
  shape: StickerShape;
  finish: StickerFinish;
}

export interface StickerQuoteResult {
  unit_price: number;
  total: number;
  sqft: number;
  qty_tier_label: string;
  per_unit_floor: number;
  sqft_rate: number;
  size_based_unit: number;
  floor_dominated: boolean;
  material_multiplier: number;
  shape_multiplier: number;
  modifiers_applied: string[];
}

interface VinylTier {
  qty_max: number;
  label: string;
  per_unit_floor: number;
  rate_per_sqft: number;
}

// Qty-tier base rates — "catalog mode" for stickers ≤2 sqft per piece.
// Calibrated against Albert's small-bulk reference quotes. Stickers above
// 2 sqft per piece switch to WIDE-FORMAT mode (see below) — Albert prices
// large wall surfaces by sqft regardless of qty tier.
//
// 2026-08-06 recalibration: the original fit crammed the small-sticker size
// effect into rate_per_sqft for the 50–99 and 100–249 tiers (22 and 14 $/sqft,
// fit against tiny 3–4" reference quotes). That extrapolated brutally for
// larger stickers — a 4×4" went $25 @ qty 25 → $122 @ qty 50. The floor now
// carries small-sticker pricing (as Albert's actual quotes behave) and the
// catalog rate stays continuous at $8/sqft through the mid tiers, so per-unit
// price never spikes upward when the customer orders MORE.
// Known remaining cliff (pre-existing, out of scope): 499→500 total drops
// because rate steps 8→4 — flag for the next /pricing-review.
const VINYL_TIERS: VinylTier[] = [
  { qty_max: 1,        label: "qty_1",        per_unit_floor: 25.00, rate_per_sqft: 9  },
  { qty_max: 9,        label: "qty_2_9",      per_unit_floor: 25.00, rate_per_sqft: 18 },
  // 2026-08-16 PM recalibration (owner direction: raise the website engine
  // where it undercharges, constants only, no restructure):
  //  - qty 10-99 floor 1.00 -> 1.20. Five retail floor-dominated fixtures
  //    (Olivia q40 $1.25, Luby q50 $0.90, Samantha q50 $1.30/$1.20, Michaela
  //    q50 $1.20 invoice-verified) have median $1.20; four land within 8%,
  //    Luby is the one overcharged (+33%). This retires the "$25 for 25x 2x2"
  //    anchor -> smallest order is now 25 x $1.20 = $30 ("from $30").
  //  - qty 10-249 rate 8 -> 9 $/sqft. Fixes Arieanna Barsi (4x4 q100
  //    invoice-verified $1.20; was $0.89 -> $1.00) and makes the catalog rate
  //    equal to the wide-format <=10 sqft rate so the 2.0 sqft mode boundary is
  //    rate-continuous. Applied to all three tiers 10-249 together so per-unit
  //    stays monotone across 49->50 and 99->100 for every size. Cost: Amber
  //    Apl (10x6 q24 $3.00) goes +11% -> +25% (edge of band).
  //  Known: total still drops at custom qty 99->100 for small stickers
  //  (99 x $1.20 = $119 vs 100 x $0.65 = $65) - pre-existing shape of the
  //  stepped floors (Albert himself quotes ~$60 for either 50 or 100 3x3s);
  //  presets are 50/100 so it only shows on typed off-tier qty. Real fix is a
  //  continuous floor curve = structural, next /pricing-review.
  { qty_max: 49,       label: "qty_10_49",    per_unit_floor: 1.20,  rate_per_sqft: 9  },
  { qty_max: 99,       label: "qty_50_99",    per_unit_floor: 1.20,  rate_per_sqft: 9  },
  // 2026-08-16 recalibration: floor raised 0.55->0.65 against expanded fixture
  // set (52 quotes incl. 28 pulled 2026-05-29->2026-08-16). Fixes a confirmed
  // undercharge (La Troupe du Jour, 3x3 qty150 die_cut: was -31.3%, now -18.8%)
  // without pushing this tier's worst-performing fixture (Sergio/Rayacom,
  // suspected non-retail account, +75.7% overcharge) any further wrong - 0.65
  // deliberately stays under Sergio's $0.6806 rate-crossover point. Does NOT
  // fix the Arieanna Barsi ground-truth case (4x4 qty100: actual $120, engine
  // $89) - that fixture is rate-dominated (sqft*rate=$0.89 > any reasonable
  // floor), so a floor change can't reach it. Needs a rate_per_sqft change,
  // deferred to the next /pricing-review pending a check of whether Sergio's
  // overcharge is actually a CIRCLE_SHAPE_MULTIPLIER issue instead.
  { qty_max: 249,      label: "qty_100_249",  per_unit_floor: 0.65,  rate_per_sqft: 9  },
  { qty_max: 499,      label: "qty_250_499",  per_unit_floor: 0.35,  rate_per_sqft: 8  },
  // 2026-08-16 PM: 500-999 floor 0.20 -> 0.33 against David Hodges (3x3 q500
  // square, paid, $0.42 - was -40.5%) and Assem Sethi (2x2 q500 circle $0.50 -
  // was -28%); 0.33 is the value that brings BOTH inside +/-25%. Rate-dominated
  // fixtures (Evolution Pet 10x2/10x3.5, MOBO Kim 4x4) unaffected. 1000+ floor
  // 0.15 -> 0.20 (no fixture data at 1000+) purely so 1000 x floor >= 500 x
  // 0.33 - keeps the order TOTAL non-decreasing between the 500 and 1000
  // preset buttons.
  { qty_max: 999,      label: "qty_500_999",  per_unit_floor: 0.33,  rate_per_sqft: 4  },
  { qty_max: Infinity, label: "qty_1000_plus",per_unit_floor: 0.20,  rate_per_sqft: 3  },
];

// WIDE-FORMAT MODE — applies when per-piece sqft > 2.0. Albert's large-sticker
// pricing tracks the wall-decal data points (37×13 qty 1 = $30, 54×24 qty 5 =
// $85, 105×48 qty 5 = $180). Rate-per-sqft drops as the per-piece surface
// grows because fixed setup amortizes over more material. Qty doesn't change
// the rate in this mode — large surface IS the cost driver.
const WIDE_FORMAT_THRESHOLD_SQFT = 2.0;
const WIDE_FORMAT_TIERS = [
  { sqft_max: 10,        rate_per_sqft: 9 }, // 3-10 sqft per piece
  { sqft_max: 30,        rate_per_sqft: 7 }, // 10-30 sqft
  { sqft_max: Infinity,  rate_per_sqft: 5 }, // 30+ sqft (huge wall jobs)
];

// perf_8mil IS live - the sticker configurator's "Perforated / 8mil window"
// chip (RMVN006) routes here. Rate $8/sqft is fit to TUDS (14-15 sqft x qty
// 6/10, 2026-05-15). Floor: was $50 (untested - both TUDS pieces are
// rate-dominated); raised to $70 on 2026-08-16 against Juliana Ionescu's two
// paid window decals (3.61 sqft -> $68, 4.49 sqft -> $72, 2026-06-09), which
// the $50 floor undercharged ~30%. Still n=4 from 2 customers; nothing yet
// between ~5 and ~12 sqft (crossover is 8.75 sqft) - revisit when data lands.
const PERF_8MIL_RATE_PER_SQFT = 8;
const PERF_8MIL_MIN_TOTAL_PER_UNIT = 70;

const CLEAR_VINYL_MULTIPLIER = 1.44;
// DIE_CUT shape: removed as a multiplier — Albert's email data shows die-cut
// gets quoted at the same per-unit price as square shapes in ~70% of cases
// (3×3 qty 150 die_cut: $0.80 vs catalog $0.875 — slight discount; Vmbp 20×12
// qty 4 die_cut: $30 ≈ catalog $30.06). Setup overhead for die-cut is real
// but inconsistent enough that hardcoding 1.15× over-charged 3 of 4 die-cut
// fixtures. Staff override stays available for die-cut shape jobs.
// CIRCLE: was 1.80 (tuned to MOBO Kim 4" circle q500 = $0.79/ea - a wholesale
// account). Retail circle evidence is thin and split: Sergio/Rayacom 3.5"
// q150 $0.70 and Rayacom 2" q50 $0.80 (msg 19afee5b2d50f803) show NO premium
// vs squares; Assem Sethi 2" q250/q500 ($0.60/$0.50, unconfirmed quote) need
// ~1.4x over the tier floor. 2026-08-16 PM: 1.80 -> 1.40 - keeps both Assem
// rows in band, cuts Sergio from +97% to +53% overcharge (still the worst
// retail circle miss). Revisit with the next confirmed retail circle order.
const CIRCLE_SHAPE_MULTIPLIER = 1.40;
const ORDER_MIN = 25;

function pickVinylTier(qty: number): VinylTier {
  return VINYL_TIERS.find((t) => qty <= t.qty_max) ?? VINYL_TIERS[VINYL_TIERS.length - 1];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function quoteStickerV2(inputs: StickerInputs): StickerQuoteResult {
  const sqft = (inputs.width_in * inputs.height_in) / 144;
  const modifiers: string[] = [];

  if (inputs.material === "perf_8mil") {
    const base_unit = Math.max(PERF_8MIL_MIN_TOTAL_PER_UNIT, sqft * PERF_8MIL_RATE_PER_SQFT);
    const unit_price = round2(base_unit);
    const total = round2(Math.max(ORDER_MIN, inputs.qty * unit_price));
    modifiers.push("perf_8mil_flat_rate");
    return {
      unit_price, total, sqft,
      qty_tier_label: "perf_flat",
      per_unit_floor: PERF_8MIL_MIN_TOTAL_PER_UNIT,
      sqft_rate: PERF_8MIL_RATE_PER_SQFT,
      size_based_unit: round2(sqft * PERF_8MIL_RATE_PER_SQFT),
      floor_dominated: sqft * PERF_8MIL_RATE_PER_SQFT < PERF_8MIL_MIN_TOTAL_PER_UNIT,
      material_multiplier: 1,
      shape_multiplier: 1,
      modifiers_applied: modifiers,
    };
  }

  // Mode selection — wide-format for large surfaces (>2 sqft per piece) where
  // Albert prices by sqft regardless of qty. Catalog otherwise.
  let tier_label: string;
  let per_unit_floor: number;
  let effective_rate: number;

  if (sqft > WIDE_FORMAT_THRESHOLD_SQFT) {
    const wfTier = WIDE_FORMAT_TIERS.find((t) => sqft <= t.sqft_max)!;
    tier_label = `wide_format_sqft_${wfTier.sqft_max === Infinity ? "30plus" : "≤" + wfTier.sqft_max}`;
    // 2026-08-16 fix: this used to be ORDER_MIN ($25) - the ORDER-level minimum
    // applied as a PER-PIECE floor. At qty>1 that inflated every wide-format
    // piece under 25/rate sqft (e.g. 2.1 sqft x qty 100 = $2,500 vs $1,520 for
    // a 1.9 sqft piece at the same qty - a 64% jump for a marginally bigger
    // item). The order minimum is already enforced on `total` below. The
    // per-piece floor now inherits the catalog tier's floor for that qty
    // (identical for qty 1 and 2-9, where the tier floor IS $25), so the
    // 2.0 sqft mode boundary stays floor-continuous.
    per_unit_floor = pickVinylTier(inputs.qty).per_unit_floor;
    effective_rate = wfTier.rate_per_sqft;
    modifiers.push("wide_format_mode");
  } else {
    const tier = pickVinylTier(inputs.qty);
    tier_label = tier.label;
    per_unit_floor = tier.per_unit_floor;
    effective_rate = tier.rate_per_sqft;
  }

  const size_based = sqft * effective_rate;
  let unit = Math.max(per_unit_floor, size_based);
  const floor_dominated = per_unit_floor > size_based;

  let material_mult = 1;
  if (inputs.material === "vinyl_clear") {
    material_mult = CLEAR_VINYL_MULTIPLIER;
    unit *= material_mult;
    modifiers.push(`clear_vinyl_×${CLEAR_VINYL_MULTIPLIER}`);
  }

  // shape "die_cut" is a no-op — Albert's data shows die-cut is quoted at the
  // same per-unit price as square in the majority of cases (see note above).
  let shape_mult = 1;
  if (inputs.shape === "circle") {
    shape_mult = CIRCLE_SHAPE_MULTIPLIER;
    unit *= shape_mult;
    modifiers.push(`circle_×${CIRCLE_SHAPE_MULTIPLIER}`);
  }

  const unit_price = round2(unit);
  const total = round2(Math.max(ORDER_MIN, inputs.qty * unit_price));

  return {
    unit_price, total, sqft,
    qty_tier_label: tier_label,
    per_unit_floor: per_unit_floor,
    sqft_rate: effective_rate,
    size_based_unit: round2(size_based),
    floor_dominated,
    material_multiplier: material_mult,
    shape_multiplier: shape_mult,
    modifiers_applied: modifiers,
  };
}
