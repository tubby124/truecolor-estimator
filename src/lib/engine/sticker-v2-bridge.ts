/**
 * Bridge — translates a StickerQuoteResult from sticker-model-v2 into the
 * EstimateResponse shape that the engine, UI, cart, and payment surfaces
 * all expect. Gated by `flags.useStickerPricingV2()` in engine/index.ts.
 *
 * Why a bridge instead of merging V2 into the engine's 11-step algorithm:
 * V2 has fundamentally different shape (qty-tier × per-unit-floor × sqft-rate
 * + wide-format-mode + material × shape) than the engine's existing
 * fixed-SKU-then-sqft-tier flow. Forcing V2 into 11 steps would gut the
 * existing engine for non-sticker categories. A clean branch + adapter
 * preserves the rest of the engine intact while letting STICKER pricing
 * be driven by the data-fitted model.
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import { getConfigNum } from "@/lib/data/loader";
import { quoteStickerV2 } from "@/lib/pricing/sticker-model-v2";
import type { EstimateRequest, EstimateResponse } from "./types";
import type { StickerMaterial, StickerShape, StickerFinish } from "@/lib/pricing/__tests__/sticker-fixtures";

const PRICING_VERSION = "v1_2026-02-19";

/** Translate engine material_code → V2 material classifier.
 *  ARLPMF7008 + all PLACEHOLDER_STICKER_* = vinyl_white (3mil vinyl).
 *  ARLPMF7008_CLEAR = vinyl_clear (clear-background variant, 1.44× premium).
 *  RMVN006 = perf_8mil (perforated window vinyl, 8mil — flat sqft rate).
 *  Anything else → default to vinyl_white. */
function v2Material(materialCode: string | undefined): StickerMaterial {
  if (!materialCode) return "vinyl_white";
  if (materialCode === "RMVN006") return "perf_8mil";
  if (materialCode === "ARLPMF7008_CLEAR") return "vinyl_clear";
  if (materialCode === "ARLPMF7008") return "vinyl_white";
  if (materialCode.startsWith("PLACEHOLDER_STICKER_")) return "vinyl_white";
  return "vinyl_white";
}

/** Sticker shape — passed through from EstimateRequest. Default "square". */
function v2Shape(req: EstimateRequest): StickerShape {
  return req.shape ?? "square";
}

/** Engine doesn't expose finish; default to gloss (matches Albert's data —
 *  every sticker quote in 3 weeks had gloss lamination as standard). */
function v2Finish(_req: EstimateRequest): StickerFinish {
  return "gloss_lam";
}

function blocked(reason: string): EstimateResponse {
  let greenThreshold = 50, yellowThreshold = 30;
  try {
    greenThreshold = getConfigNum("margin_green_threshold");
    yellowThreshold = getConfigNum("margin_yellow_threshold");
  } catch { /* config not loaded */ }
  return {
    status: "BLOCKED", sell_price: null, design_fee: 0, rush_fee: 0,
    gst_rate: 0.05, line_items: [], sqft_calculated: null,
    price_per_sqft: null, tier_applied: null, min_charge_applied: false,
    min_charge_value: null, min_charge_skipped: false, rules_fired: [],
    cost: null, wave_line_name: "", needs_clarification: true,
    clarification_notes: [reason], pricing_version: PRICING_VERSION,
    has_placeholder: false, placeholder_materials: [],
    margin_green_threshold: greenThreshold,
    margin_yellow_threshold: yellowThreshold,
    qty_discount_pct: null, qty_discount_applied: false,
    price_per_unit: null, pre_min_subtotal: null,
  };
}

/** Run V2 sticker model and wrap result as an EstimateResponse. Returns null
 *  when inputs are insufficient (missing dimensions) — caller falls through
 *  to the regular engine path. */
export function runStickerV2(req: EstimateRequest): EstimateResponse | null {
  if (!req.width_in || !req.height_in || req.width_in <= 0 || req.height_in <= 0) {
    return blocked("Stickers need width and height — enter dimensions to get a quote.");
  }
  const qty = req.qty ?? 1;
  if (qty < 1) {
    return blocked("Quantity must be at least 1.");
  }

  const result = quoteStickerV2({
    width_in: req.width_in,
    height_in: req.height_in,
    qty,
    material: v2Material(req.material_code),
    shape: v2Shape(req),
    finish: v2Finish(req),
  });

  // Design + rush fees layered on top of V2 unit price × qty (V2 itself
  // doesn't include design/rush — keeps the model focused on physical pricing).
  let designFee = 0;
  let designRuleId: string | null = null;
  const designStatus = req.design_status ?? "PRINT_READY";
  if (designStatus === "MINOR_EDIT") {
    designFee = getConfigNum("design_minor_edit_fee");
    designRuleId = "PR-DESIGN-BASIC";
  } else if (designStatus === "FULL_DESIGN") {
    designFee = getConfigNum("design_full_design_fee");
    designRuleId = "PR-DESIGN-FULL";
  } else if (designStatus === "LOGO_RECREATION") {
    designFee = getConfigNum("design_logo_recreation_fee");
    designRuleId = "PR-DESIGN-LOGO";
  }

  let rushFee = 0;
  if (req.is_rush || (req.addons ?? []).includes("RUSH")) {
    rushFee = getConfigNum("rush_fee_flat");
  }

  const subtotal = Math.round((result.total + designFee + rushFee) * 100) / 100;
  const gstRate = getConfigNum("gst_rate");

  const lineItems = [];
  lineItems.push({
    description: `STICKER – ${req.width_in}″×${req.height_in}″ – Qty ${qty} (${result.qty_tier_label})${result.modifiers_applied.length > 0 ? ` [${result.modifiers_applied.join(", ")}]` : ""}`,
    qty,
    unit_price: result.unit_price,
    line_total: result.total,
    rule_id: `STICKER-V2-${result.qty_tier_label}`,
  });
  if (designFee > 0 && designRuleId) {
    lineItems.push({
      description: designStatus === "FULL_DESIGN" ? "Design – Full Custom Design"
        : designStatus === "LOGO_RECREATION" ? "Design – Logo Recreation / Vectorization"
        : "Design – Basic Artwork Setup",
      qty: 1, unit_price: designFee, line_total: designFee, rule_id: designRuleId,
    });
  }
  if (rushFee > 0) {
    lineItems.push({
      description: "Rush Fee", qty: 1, unit_price: rushFee, line_total: rushFee,
      rule_id: "PR-ADDON-RUSH",
    });
  }

  return {
    status: "QUOTED",
    sell_price: subtotal,
    design_fee: designFee,
    rush_fee: rushFee,
    gst_rate: gstRate,
    line_items: lineItems,
    sqft_calculated: result.sqft,
    price_per_sqft: result.sqft_rate,
    tier_applied: result.qty_tier_label,
    min_charge_applied: result.floor_dominated,
    min_charge_value: result.per_unit_floor,
    min_charge_skipped: false,
    rules_fired: [`STICKER-V2-${result.qty_tier_label}`, ...result.modifiers_applied],
    cost: null, // V2 doesn't compute cost yet; UI will show margin badge as N/A
    wave_line_name: `STICKER – Vinyl ${req.width_in}×${req.height_in} in – Qty ${qty}`,
    needs_clarification: false,
    clarification_notes: [],
    pricing_version: PRICING_VERSION,
    has_placeholder: false,
    placeholder_materials: [],
    margin_green_threshold: getConfigNum("margin_green_threshold"),
    margin_yellow_threshold: getConfigNum("margin_yellow_threshold"),
    qty_discount_pct: null,
    qty_discount_applied: false,
    price_per_unit: result.unit_price,
    pre_min_subtotal: null,
  };
}
