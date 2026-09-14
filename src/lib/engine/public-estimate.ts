import type { EstimateResponse, PublicEstimateResponse } from "./types";

/**
 * Explicit public allowlist for /api/estimate. Never spread an engine response
 * here: new internal engine fields must stay private until intentionally added.
 */
export function toPublicEstimateResponse(result: EstimateResponse): PublicEstimateResponse {
  return {
    status: result.status,
    sell_price: result.sell_price,
    design_fee: result.design_fee,
    rush_fee: result.rush_fee,
    pst_exempt: result.pst_exempt,
    pst_rate: result.pst_rate,
    gst_rate: result.gst_rate,
    line_items: result.line_items.map(({ description, qty, unit_price, line_total }) => ({
      description,
      qty,
      unit_price,
      line_total,
    })),
    min_charge_applied: result.min_charge_applied,
    min_charge_value: result.min_charge_value,
    qty_discount_pct: result.qty_discount_pct,
    qty_discount_applied: result.qty_discount_applied,
    price_per_unit: result.price_per_unit,
    pre_min_subtotal: result.pre_min_subtotal,
    needs_clarification: result.needs_clarification,
    clarification_notes: result.clarification_notes,
    pricing_version: result.pricing_version,
  };
}
