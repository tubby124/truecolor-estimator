// SK tax computation for estimator results.
//
// Single source of truth — UI must NOT hardcode 0.05 / 0.06. Per CLAUDE.md:
//   GST  = sell_price × gst_rate (config-driven, currently 5%)
//   PST  = (sell_price − design_fee − rush_fee) × 0.06
//   Rush fee is PST-EXEMPT (truecolor-pricing-safety.md)
//   Design fee is PST-EXEMPT (engine Step 10)
//
// Always read gst_rate from the engine response — never hardcode it.

import type { EstimateResponse } from "@/lib/engine/types";

export interface TaxBreakdown {
  gst: number;
  pst: number;
  total: number;     // sell_price + gst + pst
  pstBase: number;   // sell_price − design_fee − rush_fee (the taxable-by-PST portion)
}

type TaxInput = Pick<EstimateResponse, "sell_price" | "design_fee" | "rush_fee" | "gst_rate">;

const PST_RATE = 0.06;
const GST_RATE_FALLBACK = 0.05;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTax(result: TaxInput): TaxBreakdown {
  const sell = result.sell_price ?? 0;
  const designFee = result.design_fee ?? 0;
  const rushFee = result.rush_fee ?? 0;
  const gstRate = result.gst_rate ?? GST_RATE_FALLBACK;
  const pstBase = Math.max(0, sell - designFee - rushFee);
  const gst = round2(sell * gstRate);
  const pst = round2(pstBase * PST_RATE);
  const total = round2(sell + gst + pst);
  return { gst, pst, total, pstBase };
}

// Cart aggregate — per-item PST then sum (rush is per-item exempt, not aggregate-exempt).
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
