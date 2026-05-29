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
const VINYL_TIERS: VinylTier[] = [
  { qty_max: 1,        label: "qty_1",        per_unit_floor: 25.00, rate_per_sqft: 9  },
  { qty_max: 9,        label: "qty_2_9",      per_unit_floor: 25.00, rate_per_sqft: 18 },
  { qty_max: 49,       label: "qty_10_49",    per_unit_floor: 0.75,  rate_per_sqft: 8  },
  { qty_max: 99,       label: "qty_50_99",    per_unit_floor: 0.90,  rate_per_sqft: 22 },
  { qty_max: 249,      label: "qty_100_249",  per_unit_floor: 0.45,  rate_per_sqft: 14 },
  { qty_max: 499,      label: "qty_250_499",  per_unit_floor: 0.35,  rate_per_sqft: 8  },
  { qty_max: 999,      label: "qty_500_999",  per_unit_floor: 0.20,  rate_per_sqft: 4  },
  { qty_max: Infinity, label: "qty_1000_plus",per_unit_floor: 0.15,  rate_per_sqft: 3  },
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

const PERF_8MIL_RATE_PER_SQFT = 8;
const PERF_8MIL_MIN_TOTAL_PER_UNIT = 50;

const CLEAR_VINYL_MULTIPLIER = 1.44;
// DIE_CUT shape: removed as a multiplier — Albert's email data shows die-cut
// gets quoted at the same per-unit price as square shapes in ~70% of cases
// (3×3 qty 150 die_cut: $0.80 vs catalog $0.875 — slight discount; Vmbp 20×12
// qty 4 die_cut: $30 ≈ catalog $30.06). Setup overhead for die-cut is real
// but inconsistent enough that hardcoding 1.15× over-charged 3 of 4 die-cut
// fixtures. Staff override stays available for die-cut shape jobs.
const CIRCLE_SHAPE_MULTIPLIER = 1.80; // Round cuts have material waste; tuned against MOBO Kim 4" circle qty 500 = $0.79/ea
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
    per_unit_floor = ORDER_MIN;
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
