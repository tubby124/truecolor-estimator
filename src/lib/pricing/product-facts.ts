/** Server-only catalogue facts. Node crypto/fs + the CSV loader keep this off clients.
 * Never use catalogue suggestions to overwrite a customer's issued quote snapshot.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { estimate } from "@/lib/engine";
import type { EstimateRequest } from "@/lib/engine/types";
import { getConfig, getProducts, getPricingRules, getQtyDiscounts } from "@/lib/data/loader";
import { PRODUCTS } from "@/lib/data/products-content";
import { computeOrderMinSurcharge, ORDER_MINIMUM_DOLLARS } from "./order-min";

export type ProductFactsConfiguration = Pick<EstimateRequest,
  "material_code" | "width_in" | "height_in" | "sides" | "qty" | "shape" | "addons">;

export interface ProductFacts {
  schemaVersion: 1;
  productSlug: string;
  productName: string;
  productUrl: string;
  configuration: EstimateRequest;
  configurationLabel: string;
  availability: "made_to_order";
  currency: "CAD";
  priceBasis: "configured_quantity";
  quantity: number;
  rawSubtotal: number;
  standalonePreTaxOrderTotal: number;
  orderMinimum: number;
  minimumDisclosure: string | null;
  allowedClaims: string[];
  sourceFingerprint: string;
  pricingVersion: string;
  sourceRuleIds: string[];
}

export class ProductFactsError extends Error {
  constructor(message: string) { super(message); this.name = "ProductFactsError"; }
}

// Included in standalone output by next.config.ts. Hash actual model source, not
// the dated CSV version label. Cache only immutable executable sources per process;
// table inputs below are the SAME loaded snapshots used by estimate().
let modelFingerprint: string | undefined;
function getModelFingerprint(): string {
  return modelFingerprint ??= createHash("sha256").update([
    "src/lib/engine/index.ts", "src/lib/engine/sticker-v2-bridge.ts",
    "src/lib/engine/design-fee.ts", "src/lib/pricing/sticker-model-v2.ts",
    "src/lib/pricing/order-min.ts",
  ].map((file) => readFileSync(path.join(process.cwd(), file), "utf8")).join("\n")).digest("hex");
}

/** Defaults are the website's named first preset, never the cheapest unrelated SKU.
 * Only published presets are eligible for automated promotion; custom work can
 * still be estimated/quoted separately. No model may supply prices or categories.
 */
export function resolveProductFacts({ productSlug, configuration = {} }: {
  productSlug: string;
  configuration?: ProductFactsConfiguration;
}): ProductFacts {
  const product = Object.hasOwn(PRODUCTS, productSlug) ? PRODUCTS[productSlug] : undefined;
  if (!product || product.comingSoon || product.serviceMode || productSlug === "custom-shape-signs" || !product.sizePresets.length) {
    throw new ProductFactsError("Select an available physical catalogue product.");
  }
  const allowedKeys = ["material_code", "width_in", "height_in", "sides", "qty", "shape", "addons",
    "category", "design_status", "is_rush"];
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration) ||
      Object.keys(configuration).some((key) => !allowedKeys.includes(key))) {
    throw new ProductFactsError("Unsupported catalogue configuration fields.");
  }
  // Returned snapshots can be re-resolved directly at approval/publication.
  // These bound engine fields may round-trip, but cannot override product truth.
  const bound = configuration as Partial<EstimateRequest>;
  if ((bound.category !== undefined && bound.category !== product.category) ||
      (bound.design_status !== undefined && bound.design_status !== "PRINT_READY") ||
      (bound.is_rush !== undefined && bound.is_rush !== false)) {
    throw new ProductFactsError("Configuration conflicts with the catalogue price basis.");
  }
  // Resolve material together with the selected size (flyer/postcard size aliases
  // are financially significant). A material may select an explicit tier.
  const preset = product.sizePresets.find((size) =>
    (configuration.width_in === undefined || size.width_in === configuration.width_in) &&
    (configuration.height_in === undefined || size.height_in === configuration.height_in) &&
    (configuration.material_code === undefined ||
      configuration.material_code === (size.material_code ?? product.material_code) ||
      product.tierPresets?.some((tier) => tier.material_code === configuration.material_code)));
  if (!preset) throw new ProductFactsError("Configuration is not a published product preset.");
  const sides = configuration.sides ?? product.defaultSides;
  const qty = configuration.qty ?? product.qtyPresets[0];
  if (![1, 2].includes(sides) || (!product.sideOptions && sides !== product.defaultSides) ||
      !Number.isSafeInteger(qty) || qty < 1 || !product.qtyPresets.includes(qty)) {
    throw new ProductFactsError("Choose a published quantity and side option.");
  }
  if (configuration.shape !== undefined &&
      (product.category !== "STICKER" || !["square", "circle", "die_cut"].includes(configuration.shape))) {
    throw new ProductFactsError("Unsupported shape for this product.");
  }
  const addons = configuration.addons ?? [];
  if (!Array.isArray(addons) || new Set(addons).size !== addons.length || addons.some((addon) =>
    !product.addons?.some((option) => option.engineCode === addon))) {
    throw new ProductFactsError("Unsupported product add-on.");
  }
  const request: EstimateRequest = {
    category: product.category as EstimateRequest["category"],
    material_code: configuration.material_code ?? preset.material_code ?? product.material_code,
    width_in: preset.width_in, height_in: preset.height_in, sides, qty,
    ...(product.category === "STICKER" ? { shape: configuration.shape ?? "square" } : {}),
    addons: [...addons].sort(), design_status: "PRINT_READY", is_rush: false,
  };
  // The engine can extrapolate some legacy lot categories beyond sellable SKUs.
  // Promotion eligibility is stricter: an active lot with this quantity/stock
  // must exist (stickers use the live V2 model, not retired sticker SKU prices).
  if (product.lotPriced && product.category !== "STICKER" && !getProducts().some((row) =>
    row.category === request.category && row.material_code === request.material_code &&
    row.qty === qty && row.sides === sides && row.width_in === request.width_in &&
    row.height_in === request.height_in)) {
    throw new ProductFactsError("No active catalogue lot exists for this configuration.");
  }
  const result = estimate(request);
  if (result.status !== "QUOTED" || result.sell_price === null ||
      !Number.isFinite(result.sell_price) || result.sell_price <= 0) {
    throw new ProductFactsError("This configuration cannot currently be purchased at a verified price.");
  }
  const minimum = computeOrderMinSurcharge(result.sell_price);
  const minimumDisclosure = minimum.applied
    ? `$${minimum.subtotal.toFixed(2)} for this configuration; a standalone order totals $${minimum.effectiveSubtotal.toFixed(2)} before tax because of the $${ORDER_MINIMUM_DOLLARS} order-total minimum.`
    : null;
  const tier = product.tierPresets?.find((entry) => entry.material_code === request.material_code);
  // Catalogue and CSV disagree on retractable dimensions. Do not feed those to
  // creative generation as supported copy; retain only the buyable config input.
  const configurationLabel = productSlug === "retractable-banners"
    ? `${tier?.label.split(/\s*[—–-]\s*\$/)[0] ?? "Economy"} stand + print, quantity ${qty}`
    : `${preset.label}, ${sides} side${sides === 1 ? "" : "s"}, quantity ${qty}`;
  const allowedClaims = [product.name, configurationLabel, "Made to order", "Prices in CAD before tax",
    `$${minimum.effectiveSubtotal.toFixed(2)} before tax for this configured standalone order`,
    ...(minimumDisclosure ? [minimumDisclosure] : [])];
  const facts = {
    schemaVersion: 1 as const, productSlug, productName: product.name,
    productUrl: `https://truecolorprinting.ca/products/${productSlug}`,
    configuration: request, configurationLabel, availability: "made_to_order" as const,
    currency: "CAD" as const, priceBasis: "configured_quantity" as const, quantity: qty,
    rawSubtotal: minimum.subtotal, standalonePreTaxOrderTotal: minimum.effectiveSubtotal,
    orderMinimum: ORDER_MINIMUM_DOLLARS, minimumDisclosure, allowedClaims,
    pricingVersion: result.pricing_version,
    sourceRuleIds: [...new Set(result.line_items.map((line) => line.rule_id))],
  };
  const sourceFingerprint = createHash("sha256").update(JSON.stringify({
    facts, model: getModelFingerprint(),
    stickerV2: process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 === "true",
    config: getConfig(),
    products: getProducts().filter((row) => row.category === request.category && row.material_code === request.material_code),
    rules: getPricingRules().filter((row) => row.category === request.category &&
      (row.material_code === request.material_code || row.material_code === "ALL")),
    discounts: getQtyDiscounts().filter((row) => row.category === request.category),
    result: { sell_price: result.sell_price, line_items: result.line_items, rules_fired: result.rules_fired },
  })).digest("hex");
  return { ...facts, sourceFingerprint };
}
