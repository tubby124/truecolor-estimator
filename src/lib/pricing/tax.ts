// SK tax computation for estimator results.
//
// Single source of truth — UI must NOT hardcode 0.05 / 0.06. Per CLAUDE.md:
//   GST  = sell_price × gst_rate (config-driven, currently 5%)
//   PST  = sell_price × 0.06 for taxable printed-material sales.
// Saskatchewan PST-20 (revised July 2024) makes the total customer charge
// taxable, including design, materials, and printing.
//
// Always read gst_rate from the engine response — never hardcode it.

import type { EstimateResponse } from "@/lib/engine/types";

export interface TaxBreakdown {
  gst: number;
  pst: number;
  total: number;     // sell_price + gst + pst
  pstBase: number;   // sell_price for taxable printed-material sales
}

type TaxInput = Pick<EstimateResponse, "sell_price" | "design_fee" | "rush_fee" | "gst_rate"> & {
  /** Standalone service line (design, vectorization, upscale) — GST only, no PST. */
  pst_exempt?: boolean;
};

const PST_RATE = 0.06;
const GST_RATE_FALLBACK = 0.05;

/**
 * Engine categories that are pure services with no tangible printed goods
 * attached. PST-20 taxes the full charge on a printed-material sale, but a
 * standalone design or imaging job ships no goods — so it is GST only.
 * Matches taxable_pst=FALSE on the SVC-* rows in data/tables/services.v1.csv.
 * Owner decision 2026-08-06.
 */
const PST_EXEMPT_CATEGORIES = new Set(["DESIGN", "SERVICE"]);

/**
 * A line is exempt only when it is a real standalone service SKU: the category
 * says DESIGN/SERVICE *and* the material code carries the `SVC-` prefix the
 * engine already uses to identify services (see engine buildWaveName).
 *
 * The material-code half is load-bearing, not belt-and-braces. `SERVICE` is an
 * overloaded category — the "Small order setup fee" line is written with
 * category SERVICE and IS PST-taxable (it's setup on tangible goods; see
 * order TC-2026-0166). Keying the exemption off the category alone would zero
 * the PST on any order that fee ever reaches.
 */
export function isPstExemptCategory(
  category: string | undefined | null,
  materialCode?: string | undefined | null,
): boolean {
  if (!category || !PST_EXEMPT_CATEGORIES.has(category.toUpperCase())) return false;
  return !!materialCode && materialCode.toUpperCase().startsWith("SVC-");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Single source of truth for the order-level PST base. Checkout's total preview
 * and POST /api/orders MUST both call this — a mismatch between them is the exact
 * failure mode that produced the 2026-03-09 PST bug (staff quoting a total the
 * API didn't charge). See .claude/rules/payment-tax.md.
 *
 * Service-only order  → 0 (no tangible goods, so rush and setup aren't taxed either).
 * Mixed cart          → everything except the service lines stays taxable, which
 *                       keeps the PST-20 treatment intact for the printed portion.
 */
export function computePstBase(opts: {
  items: { category?: string | null; sell_price: number; config?: { material_code?: string | null } | null }[];
  discountedSubtotal: number;
  rush: number;
}): number {
  const { items, discountedSubtotal, rush } = opts;
  const exemptLine = (i: (typeof items)[number]) =>
    isPstExemptCategory(i.category, i.config?.material_code);
  if (items.length > 0 && items.every(exemptLine)) return 0;
  const exempt = items.filter(exemptLine).reduce((s, i) => s + i.sell_price, 0);
  return Math.max(0, round2(discountedSubtotal + rush - exempt));
}

export function computeTax(result: TaxInput): TaxBreakdown {
  const sell = result.sell_price ?? 0;
  const gstRate = result.gst_rate ?? GST_RATE_FALLBACK;
  const pstBase = result.pst_exempt ? 0 : Math.max(0, sell);
  const gst = round2(sell * gstRate);
  const pst = round2(pstBase * PST_RATE);
  const total = round2(sell + gst + pst);
  return { gst, pst, total, pstBase };
}

// Cart aggregate — compute and round tax per taxable printed item, then sum.
export function computeTaxForCart(results: TaxInput[]): TaxBreakdown {
  let sell = 0;
  let gstSum = 0;
  let pstSum = 0;
  let pstBaseSum = 0;
  for (const r of results) {
    const t = computeTax(r);
    sell += r.sell_price ?? 0;
    gstSum += t.gst;
    pstSum += t.pst;
    pstBaseSum += t.pstBase;
  }
  const gst = round2(gstSum);
  const pst = round2(pstSum);
  const total = round2(sell + gst + pst);
  return { gst, pst, total, pstBase: round2(pstBaseSum) };
}
