/**
 * Historical sticker quote fixtures — extracted from Albert's email replies
 * via info@true-color.ca, March 2025 → May 29 2026. These are the ground truth
 * for validating the new sticker pricing model.
 *
 * Pull methodology: gmail.py --account truecolor search "Total amount sticker"
 * and "Unit Price vinyl", filtering for Albert's "Material/Size/Qty/Unit Price"
 * quote block format.
 *
 * Conventions:
 *  - All sizes in INCHES (cm values from email converted: 1cm = 0.3937")
 *  - "50 x 2 designs" is recorded as qty=50 (per-design) because Albert prices
 *    each design independently. Total order = 2 × this fixture's total.
 *  - Material "3mil vinyl" = vinyl_white (default Albert material)
 *  - Material "3mil clear vinyl" = vinyl_clear
 *  - Material "8mil perforated vinyl" = perf_8mil (separate product class)
 *  - Process "Gloss lamination" = default for vinyl stickers (every quote)
 *  - Process "die cut lettering" = shape: die_cut (letters cut out of sheet)
 *  - "new client discount $10" cases: actual_total is AFTER discount
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

export type StickerMaterial = "vinyl_white" | "vinyl_clear" | "perf_8mil";
export type StickerShape = "square" | "die_cut" | "circle";
export type StickerFinish = "gloss_lam" | "matte_lam" | "no_lam";

export interface StickerQuoteFixture {
  date: string;
  customer: string;
  width_in: number;
  height_in: number;
  qty: number;
  material: StickerMaterial;
  shape: StickerShape;
  finish: StickerFinish;
  actual_unit_price: number;
  actual_total: number;
  source_email_id: string;
  notes?: string;
  /** Wholesale/discount accounts that don't represent retail pricing.
   *  Owner confirmed 2026-05-29: MOBO + Inkhouse get heavy discounts.
   *  Excluded from model fit calibration and pass-rate calculations. */
  excluded_wholesale?: boolean;
}

export const ALBERT_STICKER_QUOTES: StickerQuoteFixture[] = [
  {
    date: "2026-05-29", customer: "Luby Bower (Corrie)",
    width_in: 4, height_in: 1.5, qty: 50,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.90, actual_total: 45.00,
    source_email_id: "19e74a976425dbde",
    notes: "Order was 50 × 2 designs — fixture is per-design (qty 50). Total order $90.",
  },
  {
    date: "2026-05-27", customer: "La Troupe du Jour (Aida)",
    width_in: 3, height_in: 3, qty: 150,
    material: "vinyl_white", shape: "die_cut", finish: "gloss_lam",
    actual_unit_price: 0.80, actual_total: 120.00,
    source_email_id: "19e6665e39944d70",
    notes: "Gloss lamination + die cut. Off-tier qty 150 — engine snaps to 250 = $210 (75% over).",
  },
  {
    date: "2026-05-27", customer: "NextGen (Christa)",
    width_in: 37, height_in: 13, qty: 1,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 30.00, actual_total: 30.00,
    source_email_id: "19e6a7906bd91778",
    notes: "Large single piece — $25 floor exceeded by sqft-based price.",
  },
  {
    date: "2026-05-22", customer: "MOBO (Angela)",
    width_in: 1.25, height_in: 0.625, qty: 252,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.35, actual_total: 88.20,
    source_email_id: "19e50fe8d925e928",
    notes: "Very small tags — per_unit_floor dominates over sqft × rate.",
    excluded_wholesale: true,
  },
  {
    date: "2026-05-21", customer: "Jason wall decal (small)",
    width_in: 54, height_in: 24, qty: 5,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 85.00, actual_total: 425.00,
    source_email_id: "19e4b8322f1a34c7",
  },
  {
    date: "2026-05-21", customer: "Jason wall decal (large)",
    width_in: 105, height_in: 48, qty: 5,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 180.00, actual_total: 900.00,
    source_email_id: "19e4b62dfcee6e60",
    notes: "Largest sticker job in dataset — 35 sqft × 5 = $5.14/sqft equivalent.",
  },
  {
    date: "2026-05-20", customer: "Victor NSC numbers",
    width_in: 18, height_in: 2.5, qty: 4,
    material: "vinyl_white", shape: "die_cut", finish: "no_lam",
    actual_unit_price: 12.00, actual_total: 48.00,
    source_email_id: "19e463693f6273ef",
    notes: "Black die-cut lettering — no lamination needed for cut vinyl.",
  },
  {
    date: "2026-05-20", customer: "Christa hockey rink A",
    width_in: 16.34, height_in: 6.69, qty: 1,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 25.00, actual_total: 25.00,
    source_email_id: "19e46226781844de",
    notes: "Size was 41.5cm × 17cm — converted to in. $25 single-piece floor hit.",
  },
  {
    date: "2026-05-20", customer: "Christa hockey rink B",
    width_in: 13.98, height_in: 4.33, qty: 1,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 25.00, actual_total: 25.00,
    source_email_id: "19e45fc37cc06a1b",
    notes: "Size was 35.5cm × 11cm — converted to in. $25 single-piece floor.",
  },
  {
    date: "2026-05-15", customer: "TUDS windows (10)",
    width_in: 31.75, height_in: 67.5, qty: 10,
    material: "perf_8mil", shape: "square", finish: "no_lam",
    actual_unit_price: 120.00, actual_total: 1200.00,
    source_email_id: "19e2ca986b60987a",
    notes: "8mil perforated window vinyl — separate material class, no lamination.",
  },
  {
    date: "2026-05-15", customer: "TUDS windows (6)",
    width_in: 30, height_in: 67.5, qty: 6,
    material: "perf_8mil", shape: "square", finish: "no_lam",
    actual_unit_price: 100.00, actual_total: 600.00,
    source_email_id: "19e2ca986b60987a",
  },
  {
    date: "2026-05-13", customer: "Evolution Pet (small)",
    width_in: 10, height_in: 2, qty: 500,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.60, actual_total: 300.00,
    source_email_id: "19e2297ddaf38325",
  },
  {
    date: "2026-05-13", customer: "Evolution Pet (medium)",
    width_in: 10, height_in: 3.5, qty: 500,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.78, actual_total: 390.00,
    source_email_id: "19e2297ddaf38325",
  },
  {
    date: "2026-05-12", customer: "Amber Apl realty",
    width_in: 10, height_in: 6, qty: 24,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 3.00, actual_total: 72.00,
    source_email_id: "19e1e4977030f4db",
    notes: "Black and white print — same price as full color per other quotes.",
  },
  {
    date: "2026-05-12", customer: "Vmbp van door",
    width_in: 20, height_in: 12, qty: 4,
    material: "vinyl_white", shape: "die_cut", finish: "no_lam",
    actual_unit_price: 30.00, actual_total: 120.00,
    source_email_id: "19e1e076c4048abb",
    notes: "Die cut lettering for vehicle doors.",
  },
  {
    date: "2026-05-12", customer: "Mike boat",
    width_in: 3.5, height_in: 18, qty: 2,
    material: "vinyl_white", shape: "die_cut", finish: "no_lam",
    actual_unit_price: 25.00, actual_total: 50.00,
    source_email_id: "19e1d3f53b632706",
    notes: "Die cut + transfer permask tape. $50 quote with $10 new-client discount → final $40 invoiced.",
  },
  {
    date: "2026-05-05", customer: "MOBO Kim round",
    width_in: 4, height_in: 4, qty: 500,
    material: "vinyl_white", shape: "circle", finish: "gloss_lam",
    actual_unit_price: 0.79, actual_total: 395.00,
    source_email_id: "19df8bbaabb540b1",
    notes: "Round 4-inch — same per-sqft pricing as square per Albert.",
    excluded_wholesale: true,
  },
  {
    date: "2025-03-28", customer: "MOBO Aaron white bg",
    width_in: 3, height_in: 1.5, qty: 100,
    material: "vinyl_white", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.45, actual_total: 45.00,
    source_email_id: "19e6bacf9e7bcc37",
    notes: "Reference quote — happens to match engine PR-STICKER-100 area-scaled price; flagged wholesale 2026-05-29 (owner confirmed MOBO gets discount).",
    excluded_wholesale: true,
  },
  {
    date: "2025-03-28", customer: "MOBO Aaron clear bg",
    width_in: 3, height_in: 1.5, qty: 100,
    material: "vinyl_clear", shape: "square", finish: "gloss_lam",
    actual_unit_price: 0.65, actual_total: 65.00,
    source_email_id: "19e6bacf9e7bcc37",
    notes: "Only clear-vinyl data point in dataset — and it's a wholesale account. Clear vinyl premium (1.44×) is UNVERIFIED — needs retail comparison data.",
    excluded_wholesale: true,
  },

  // ─── Retail fixtures added 2026-05-29 PM after Hasan confirmed MOBO+Inkhouse
  // get wholesale discount. Older Mar-Apr 2026 quotes from retail customers. ───
  {
    date: "2026-04-28", customer: "Steve McCullough (buses)",
    width_in: 27.5, height_in: 27.5, qty: 40,
    material: "vinyl_white", shape: "die_cut", finish: "gloss_lam",
    actual_unit_price: 48.00, actual_total: 1920.00,
    source_email_id: "19dd5e5fff0f930c",
    notes: "20 buses × both sides = 40 stickers. 27.5×27.5 = 5.25 sqft per piece — wide-format mode case. (+ $800 install line item not in fixture.)",
  },
  {
    date: "2026-04-28", customer: "Samantha (Prairie Canna) LSD Square",
    width_in: 3, height_in: 2.56, qty: 50,
    material: "vinyl_white", shape: "die_cut", finish: "gloss_lam",
    actual_unit_price: 1.30, actual_total: 65.00,
    source_email_id: "19dd4bdf0de539f8",
    notes: "Cannabis brand stickers, retail account.",
  },
  {
    date: "2026-04-28", customer: "Samantha (Prairie Canna) LSD logo",
    width_in: 3, height_in: 1.86, qty: 50,
    material: "vinyl_white", shape: "die_cut", finish: "gloss_lam",
    actual_unit_price: 1.20, actual_total: 60.00,
    source_email_id: "19dd4bdf0de539f8",
  },
  {
    date: "2026-03-09", customer: "Sergio (Rayacom)",
    width_in: 3.5, height_in: 3.5, qty: 150,
    material: "vinyl_white", shape: "circle", finish: "gloss_lam",
    actual_unit_price: 0.70, actual_total: 105.00,
    source_email_id: "19cd38ce9f7720b3",
    notes: "Rayacom is a competing print shop ordering from True Color — possible B2B account. Price is below model prediction; flag as possible wholesale-style relationship if pattern persists.",
  },
  {
    date: "2026-04-20", customer: "Daphna (NRGene)",
    width_in: 4.41, height_in: 2.36, qty: 200,
    material: "vinyl_white", shape: "die_cut", finish: "matte_lam",
    actual_unit_price: 1.10, actual_total: 220.00,
    source_email_id: "19dac543fad57387",
    notes: "Size 11.2cm × 6cm converted to inches. Matte lam (Albert confirmed pricing same as gloss).",
  },
];

/** Retail-only fixtures — drops wholesale-discounted accounts (MOBO, Inkhouse).
 *  This is the canonical fit dataset since the model represents retail pricing. */
export const RETAIL_FIXTURES = ALBERT_STICKER_QUOTES.filter((f) => !f.excluded_wholesale);

/** Subset for pure-vinyl (most common) tests — excludes the 2 perf rows. */
export const VINYL_FIXTURES = ALBERT_STICKER_QUOTES.filter((f) => f.material !== "perf_8mil");

/** Subset for the perforated window vinyl product (different price curve). */
export const PERF_FIXTURES = ALBERT_STICKER_QUOTES.filter((f) => f.material === "perf_8mil");

/** Bucketed by qty tier for tier-targeted tests. */
export function fixturesByQtyTier(): Record<string, StickerQuoteFixture[]> {
  const buckets: Record<string, StickerQuoteFixture[]> = {
    "qty_1": [], "qty_2_9": [], "qty_10_49": [], "qty_50_99": [],
    "qty_100_249": [], "qty_250_499": [], "qty_500_999": [], "qty_1000_plus": [],
  };
  for (const f of ALBERT_STICKER_QUOTES) {
    const q = f.qty;
    if (q === 1) buckets.qty_1.push(f);
    else if (q <= 9) buckets.qty_2_9.push(f);
    else if (q <= 49) buckets.qty_10_49.push(f);
    else if (q <= 99) buckets.qty_50_99.push(f);
    else if (q <= 249) buckets.qty_100_249.push(f);
    else if (q <= 499) buckets.qty_250_499.push(f);
    else if (q <= 999) buckets.qty_500_999.push(f);
    else buckets.qty_1000_plus.push(f);
  }
  return buckets;
}
