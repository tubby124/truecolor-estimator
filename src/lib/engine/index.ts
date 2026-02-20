// True Color Pricing Engine — 11-step evaluation per RULE_ENGINE_SPEC.md
// Pure function: same inputs → same output always (idempotent)

import { getPricingRules, getProducts, getMaterials, getServices, getConfigNum } from "../data/loader";
import type { EstimateRequest, EstimateResponse, LineItem, CostBreakdown } from "./types";

const PRICING_VERSION = "v1_2026-02-19";

// ─── Utility ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function ceilCent(n: number): number {
  return Math.ceil(n * 100) / 100;
}

// ─── Main Estimate Function ───────────────────────────────────────────────────

export function estimate(req: EstimateRequest): EstimateResponse {
  const clarifications: string[] = [];
  const rulesFired: string[] = [];
  const lineItems: LineItem[] = [];

  // ── STEP 1: Validate inputs ───────────────────────────────────────────────
  if (!req.category) {
    return blocked("No category provided");
  }

  const category = req.category;
  const sides = req.sides ?? 1;
  const qty = req.qty ?? 1;
  const isRush = req.is_rush ?? false;
  const designStatus = req.design_status ?? "PRINT_READY";
  const addons = req.addons ?? [];

  // ── STEP 2: Compute sqft ──────────────────────────────────────────────────
  let sqft: number | null = null;
  if (req.width_in && req.height_in) {
    sqft = round2((req.width_in / 12) * (req.height_in / 12));
  }

  // ── STEP 3: Fixed-size product lookup ─────────────────────────────────────
  let basePricePerSqft: number | null = null;
  let basePrice: number | null = null;
  let tierLabel: string | null = null;
  let minCharge = 0;
  let matchedRuleId: string | null = null;
  let isFixedSize = false;

  const products = getProducts();
  const fixedMatch = products.find((p) => {
    if (p.category !== category) return false;
    if (req.material_code && p.material_code !== req.material_code) return false;
    if (p.sides !== sides) return false;
    if (req.width_in && Math.abs(p.width_in - req.width_in) > 0.5) return false;
    if (req.height_in && Math.abs(p.height_in - req.height_in) > 0.5) return false;
    if (p.qty !== qty) return false;
    return true;
  });

  if (fixedMatch) {
    basePrice = fixedMatch.price;
    matchedRuleId = fixedMatch.pricing_rule_ref || fixedMatch.product_id;
    tierLabel = "FIXED_SIZE";
    isFixedSize = true;
    rulesFired.push(matchedRuleId);
    // Look up the category minimum charge from pricing_rules even for fixed-size matches
    const categoryRule = getPricingRules().find(
      (r) => r.category === category && (r.material_code === req.material_code || r.material_code === fixedMatch.material_code)
    );
    if (categoryRule) minCharge = categoryRule.min_charge;
    lineItems.push({
      description: fixedMatch.product_name,
      qty: 1,
      unit_price: basePrice,
      line_total: basePrice,
      rule_id: matchedRuleId,
    });
  }

  // ── STEP 4: Sqft-tier pricing (if no fixed match) ─────────────────────────
  if (!isFixedSize && sqft !== null) {
    const rules = getPricingRules().filter(
      (r) =>
        r.category === category &&
        (r.sides === null || r.sides === sides) &&
        (!req.material_code || r.material_code === req.material_code || r.material_code === "GENERIC_FOAM" || r.material_code === "GENERIC")
    );

    // Find matching tier
    const tierRule = rules.find((r) => {
      if (r.price_per_sqft === null && r.price_per_unit === null) return false;
      if (r.sqft_min === null && r.sqft_max === null) {
        // Flat rate rule (no sqft range — e.g. decals, stickers by qty)
        if (r.qty_min !== null && qty < r.qty_min) return false;
        if (r.qty_max !== null && qty > r.qty_max) return false;
        return true;
      }
      const lo = r.sqft_min ?? 0;
      const hi = r.sqft_max ?? Infinity;
      return sqft! >= lo && sqft! <= hi;
    });

    if (tierRule) {
      minCharge = tierRule.min_charge;
      matchedRuleId = tierRule.rule_id;
      rulesFired.push(matchedRuleId);

      if (tierRule.price_per_sqft !== null) {
        basePricePerSqft = tierRule.price_per_sqft;
        basePrice = ceilCent(sqft * basePricePerSqft);
        tierLabel = tierRule.rule_id;
        lineItems.push({
          description: buildSqftDescription(category, req, sqft, basePricePerSqft),
          qty: 1,
          unit_price: basePrice,
          line_total: basePrice,
          rule_id: matchedRuleId,
        });
      } else if (tierRule.price_per_unit !== null) {
        basePrice = tierRule.price_per_unit;
        tierLabel = tierRule.rule_id;
        lineItems.push({
          description: buildUnitDescription(category, req, qty),
          qty: qty,
          unit_price: basePrice,
          line_total: basePrice * qty,
          rule_id: matchedRuleId,
        });
      }
    } else {
      // Fallback: PR-FALLBACK-ALL
      basePricePerSqft = getConfigNum("default_sqft_fallback_rate");
      basePrice = ceilCent(sqft * basePricePerSqft);
      minCharge = getConfigNum("default_minimum_fallback");
      matchedRuleId = "PR-FALLBACK-ALL";
      tierLabel = "FALLBACK";
      rulesFired.push("PR-FALLBACK-ALL");
      clarifications.push(`Product category or material not matched — using fallback rate $${basePricePerSqft.toFixed(2)}/sqft. Please verify.`);
      lineItems.push({
        description: `${category} – Custom – ${sqft.toFixed(2)} sqft @ $${basePricePerSqft.toFixed(2)}/sqft (FALLBACK)`,
        qty: 1,
        unit_price: basePrice,
        line_total: basePrice,
        rule_id: "PR-FALLBACK-ALL",
      });
    }
  }

  if (basePrice === null) {
    return blocked("Cannot compute price — no dimensions or fixed-size match");
  }

  // ── STEP 5: Add-ons ────────────────────────────────────────────────────────
  let addonTotal = 0;
  const services = getServices();

  // Grommets — auto-calculate from perimeter if banner
  if (addons.includes("GROMMETS") && req.width_in && req.height_in) {
    const widthFt = req.width_in / 12;
    const heightFt = req.height_in / 12;
    const perimeterFt = 2 * (widthFt + heightFt);
    const grommetSpacing = getConfigNum("grommet_spacing_ft");
    const grommetMin = getConfigNum("grommet_minimum_count");
    const grommetPrice = getConfigNum("grommet_price_per_unit");
    const grometCount = Math.max(grommetMin, Math.ceil(perimeterFt / grommetSpacing));
    const grometCharge = grometCount * grommetPrice;
    addonTotal += grometCharge;
    rulesFired.push("PR-ADDON-GROMMET");
    lineItems.push({
      description: `Grommets (${grometCount} × $${grommetPrice.toFixed(2)} — auto-calculated from perimeter)`,
      qty: grometCount,
      unit_price: grommetPrice,
      line_total: grometCharge,
      rule_id: "PR-ADDON-GROMMET",
    });
  }

  // H-Stake
  if (addons.includes("H_STAKE")) {
    const hstakeSvc = services.find((s) => s.service_id === "SVC-HSTAKE");
    const hstakePrice = hstakeSvc?.default_price ?? getConfigNum("hstake_price_per_unit");
    addonTotal += hstakePrice;
    rulesFired.push("PR-ADDON-HSTAKE");
    lineItems.push({
      description: `H-Stake (yard stake)`,
      qty: 1,
      unit_price: hstakePrice,
      line_total: hstakePrice,
      rule_id: "PR-ADDON-HSTAKE",
    });
  }

  // 16pt Card Upgrade
  if (addons.includes("CARD_STOCK_16PT")) {
    const upgPrice = getConfigNum("card_stock_16pt_upgrade_price");
    addonTotal += upgPrice;
    rulesFired.push("SVC-16PT-UPG");
    lineItems.push({
      description: "16pt Card Stock Upgrade",
      qty: 1,
      unit_price: upgPrice,
      line_total: upgPrice,
      rule_id: "SVC-16PT-UPG",
    });
  }

  // ── STEP 6: Apply minimum charge ──────────────────────────────────────────
  let effectiveBase = basePrice;
  let minChargeApplied = false;
  if (minCharge > 0 && basePrice < minCharge) {
    effectiveBase = minCharge;
    minChargeApplied = true;
    // Adjust the first line item to reflect the minimum
    if (lineItems.length > 0) {
      lineItems[0].unit_price = minCharge;
      lineItems[0].line_total = minCharge;
      lineItems[0].description += ` (min charge $${minCharge.toFixed(2)} applied)`;
    }
  }

  // ── STEP 7: Design fee ────────────────────────────────────────────────────
  let designFee = 0;
  let designRuleId: string | null = null;
  if (designStatus === "MINOR_EDIT") {
    designFee = getConfigNum("design_minor_edit_fee");
    designRuleId = "PR-DESIGN-BASIC";
  } else if (designStatus === "FULL_DESIGN") {
    designFee = getConfigNum("design_full_design_fee");
    designRuleId = "PR-DESIGN-FULL";
  } else if (designStatus === "LOGO_RECREATION") {
    designFee = getConfigNum("design_logo_recreation_fee");
    designRuleId = "PR-DESIGN-LOGO";
  } else if (designStatus === "UNKNOWN") {
    clarifications.push("Design status unknown — please confirm if files are print-ready.");
  }
  if (designFee > 0 && designRuleId) {
    rulesFired.push(designRuleId);
    lineItems.push({
      description: designStatusLabel(designStatus),
      qty: 1,
      unit_price: designFee,
      line_total: designFee,
      rule_id: designRuleId,
    });
  }

  // ── STEP 8: Rush fee ──────────────────────────────────────────────────────
  let rushFee = 0;
  if (isRush || addons.includes("RUSH")) {
    rushFee = getConfigNum("rush_fee_flat");
    rulesFired.push("PR-ADDON-RUSH");
    lineItems.push({
      description: "Rush Fee",
      qty: 1,
      unit_price: rushFee,
      line_total: rushFee,
      rule_id: "PR-ADDON-RUSH",
    });
  }

  // ── STEP 9: Total sell price ──────────────────────────────────────────────
  const gstRate = getConfigNum("gst_rate");
  const subtotal = round2(effectiveBase + addonTotal + designFee + rushFee);
  const gst = round2(subtotal * gstRate);
  const total = round2(subtotal + gst);

  // ── STEP 10: Cost estimate ────────────────────────────────────────────────
  const cost = computeCost(category, req.material_code, sqft, sides, qty, addons, rulesFired);

  const sellPrice = subtotal; // sell_price is pre-tax subtotal; UI shows GST separately

  // ── STEP 11: Wave line name ───────────────────────────────────────────────
  const waveName = isFixedSize && fixedMatch
    ? fixedMatch.product_name
    : buildWaveName(category, req, sqft);

  // Determine PLACEHOLDER state for UI warning banner
  const hasPlaceholder = cost?.is_partial ?? false;
  const placeholderMaterials: string[] = hasPlaceholder ? ["supplier cost pending — check materials.v1.csv"] : [];

  return {
    status: clarifications.length > 0 ? "NEEDS_CLARIFICATION" : "QUOTED",
    sell_price: sellPrice,
    line_items: lineItems,
    sqft_calculated: sqft,
    price_per_sqft: basePricePerSqft,
    tier_applied: tierLabel,
    min_charge_applied: minChargeApplied,
    min_charge_value: minChargeApplied ? minCharge : null,
    rules_fired: rulesFired,
    cost,
    wave_line_name: waveName,
    needs_clarification: clarifications.length > 0,
    clarification_notes: clarifications,
    pricing_version: PRICING_VERSION,
    has_placeholder: hasPlaceholder,
    placeholder_materials: placeholderMaterials,
    margin_green_threshold: getConfigNum("margin_green_threshold"),
    margin_yellow_threshold: getConfigNum("margin_yellow_threshold"),
  };
}

// ─── Cost Computation ─────────────────────────────────────────────────────────

function computeCost(
  category: string,
  material_code: string | undefined,
  sqft: number | null,
  sides: number,
  qty: number,
  addons: string[],
  rulesFired: string[]
): CostBreakdown | null {
  if (!sqft && category !== "BUSINESS_CARD" && category !== "FLYER" && category !== "BROCHURE") return null;

  const materials = getMaterials();
  const mat = material_code
    ? materials.find((m) => m.material_code === material_code)
    : materials.find((m) => m.keywords.toLowerCase().includes(category.toLowerCase()));

  const isKonica = ["BUSINESS_CARD", "FLYER", "BROCHURE", "POSTCARD"].includes(category);
  const wasteMultiplier = isKonica ? 1.0 : mat?.waste_multiplier ?? 1.05;

  let materialCost: number | "PLACEHOLDER" = "PLACEHOLDER";
  let inkCost = 0;
  let isPartial = false;

  if (mat && !mat.is_placeholder && mat.cost_per_sqft !== null && sqft) {
    materialCost = round2(sqft * wasteMultiplier * mat.cost_per_sqft);
  } else {
    isPartial = true;
  }

  if (isKonica) {
    // Konica: cost per sheet (click charge), assume 1 sheet per job (imposition TBD — Q4)
    const konicaRate = getConfigNum("konica_ink_cost_per_sheet");
    inkCost = round2(qty * sides * konicaRate);
    rulesFired.push("CR-PAPER-INK-COLOR");
  } else if (sqft) {
    // Roland wide-format ink cost
    const rolandRate = getConfigNum("roland_ink_cost_per_sqft");
    inkCost = round2(sqft * wasteMultiplier * rolandRate);
    rulesFired.push("CR-ROLAND-INK");
  }

  const laborMin = getConfigNum("labor_minutes_per_job");
  const laborRate = getConfigNum("labor_rate_per_hour");
  const laborCost = round2((laborMin / 60) * laborRate);
  const overheadCost = getConfigNum("overhead_flat_per_job");

  // H-Stake add-on cost
  let addonCost = 0;
  if (addons.includes("H_STAKE")) {
    addonCost += getConfigNum("hstake_cost_per_unit"); // material cost only
  }

  let totalCost: number | "PLACEHOLDER" = "PLACEHOLDER";
  let marginPct: number | null = null;

  if (materialCost !== "PLACEHOLDER") {
    totalCost = round2(materialCost + inkCost + laborCost + overheadCost + addonCost);
  } else {
    isPartial = true;
  }

  return {
    material_cost: materialCost,
    ink_cost: inkCost,
    labor_cost: laborCost,
    overhead_cost: overheadCost,
    total_cost: totalCost,
    margin_pct: marginPct,
    is_partial: isPartial,
  };
}

// ─── Wave Line Name ───────────────────────────────────────────────────────────

function buildWaveName(category: string, req: EstimateRequest, sqft: number | null): string {
  const catLabel = categoryLabel(category);
  const matLabel = materialLabel(req.material_code);
  const sizeLabel = sqft
    ? dimensionLabel(req.width_in, req.height_in)
    : "CUSTOM";
  const sidesLabel = req.sides === 2 ? "Double" : "Single";
  const finishLabel = finishLabelStr(req.finish);

  const parts = [catLabel, matLabel, sizeLabel, sidesLabel];
  if (finishLabel) parts.push(finishLabel);
  return parts.join(" – ");
}

// ─── Label Helpers ────────────────────────────────────────────────────────────

function buildSqftDescription(category: string, req: EstimateRequest, sqft: number, rate: number): string {
  const dim = dimensionLabel(req.width_in, req.height_in);
  return `${categoryLabel(category)} – ${dim} – ${sqft.toFixed(2)} sqft @ $${rate.toFixed(2)}/sqft`;
}

function buildUnitDescription(category: string, req: EstimateRequest, qty: number): string {
  return `${categoryLabel(category)} – Qty ${qty}`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    SIGN: "SIGN – Coroplast 4mm",
    BANNER: "BANNER – Vinyl 13oz",
    RIGID: "RIGID – ACP 3mm",
    FOAMBOARD: "FOAMBOARD – 5mm",
    DISPLAY: "DISPLAY – Retractable Banner",
    STICKER: "STICKER",
    DECAL: "DECAL",
    VINYL_LETTERING: "VINYL LETTERING",
    PHOTO_POSTER: "PHOTO POSTER – 220gsm",
    MAGNET: "MAGNET SIGNAGE – 30mil",
    POSTCARD: "POSTCARD",
    BUSINESS_CARD: "BUSINESS CARD – 14pt",
    FLYER: "FLYER",
    BROCHURE: "BROCHURE",
    DESIGN: "DESIGN",
    INSTALLATION: "INSTALLATION",
    SERVICE: "SERVICE",
  };
  return map[cat] ?? cat;
}

function materialLabel(code: string | undefined): string {
  if (!code) return "";
  const map: Record<string, string> = {
    MPHCC020: "Coroplast 4mm",
    RMBF004: "Vinyl 13oz",
    RMACP002: "ACP 3mm",
    RMVN006: "Perf Vinyl 70/30",
    ARLPMF7008: "Matte Vinyl",
    MAG302437550M: "Magnet 30mil",
    RMPS002: "Photo Paper 220gsm",
  };
  return map[code] ?? code;
}

function dimensionLabel(w?: number, h?: number): string {
  if (!w || !h) return "CUSTOM";
  const wFt = w / 12;
  const hFt = h / 12;
  if (Number.isInteger(wFt) && Number.isInteger(hFt)) return `${wFt}x${hFt} ft`;
  // Show in inches if sub-foot
  if (w < 24 || h < 24) return `${w}x${h} in`;
  return `${wFt.toFixed(1)}x${hFt.toFixed(1)} ft`;
}

function finishLabelStr(finish?: string): string {
  if (!finish || finish === "NONE") return "";
  const map: Record<string, string> = {
    GLOSS_LAM: "Gloss Lam",
    MATTE_LAM: "Matte Lam",
    HEMMED: "Hemmed",
    DIE_CUT: "Die Cut",
  };
  return map[finish] ?? finish;
}

function designStatusLabel(status: string): string {
  const map: Record<string, string> = {
    MINOR_EDIT: "Design – Basic Artwork Setup",
    FULL_DESIGN: "Design – Full Custom Design",
    LOGO_RECREATION: "Design – Logo Recreation / Vectorization",
  };
  return map[status] ?? "Design Service";
}

function blocked(reason: string): EstimateResponse {
  // Safe config reads with fallback for blocked responses (config may not be loaded yet)
  let greenThreshold = 50;
  let yellowThreshold = 30;
  try {
    greenThreshold = getConfigNum("margin_green_threshold");
    yellowThreshold = getConfigNum("margin_yellow_threshold");
  } catch {
    // Config not available — use defaults
  }
  return {
    status: "BLOCKED",
    sell_price: null,
    line_items: [],
    sqft_calculated: null,
    price_per_sqft: null,
    tier_applied: null,
    min_charge_applied: false,
    min_charge_value: null,
    rules_fired: [],
    cost: null,
    wave_line_name: "",
    needs_clarification: true,
    clarification_notes: [reason],
    pricing_version: "v1_2026-02-19",
    has_placeholder: false,
    placeholder_materials: [],
    margin_green_threshold: greenThreshold,
    margin_yellow_threshold: yellowThreshold,
  };
}
