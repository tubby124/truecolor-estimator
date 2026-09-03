import { createHash } from "node:crypto";
import type { CartItem } from "@/lib/cart/cart";
import type { EstimateResponse } from "@/lib/engine/types";
import { COMMERCE_POLICY_VERSION } from "@/lib/commerce/policies";

export const COMMERCE_OFFER_VERSION = "2026-09-02.1";

const FAMILY_BY_SLUG: Record<string, string> = {
  "coroplast-signs": "tc:family:coroplast-signs",
  "vinyl-banners": "tc:family:vinyl-banners",
  "acp-signs": "tc:family:acp-signs",
  "vehicle-magnets": "tc:family:vehicle-magnets",
  "foamboard-displays": "tc:family:foamboard-displays",
  "retractable-banners": "tc:family:retractable-banners",
  "window-decals": "tc:family:window-decals",
  "window-perf": "tc:family:window-perf",
  "vinyl-lettering": "tc:family:vinyl-lettering",
  stickers: "tc:family:stickers",
  postcards: "tc:family:postcards",
  brochures: "tc:family:brochures",
  flyers: "tc:family:flyers",
  "business-cards": "tc:family:business-cards",
  "photo-posters": "tc:family:photo-posters",
  "magnet-calendars": "tc:family:magnet-calendars",
};

export interface CommerceIdentity {
  commerceProductId: string | null;
  variantKey: string | null;
  merchantOfferId: string | null;
  offerVersion: string | null;
  configurationFingerprint: string | null;
  pricingVersion: string | null;
  pricingRuleId: string | null;
  policyVersion: string;
  classificationReason: string | null;
}

type Config = CartItem["config"];

function token(value: string | number | undefined): string {
  return String(value ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function canonicalVariantKey(config: Config): string | null {
  if (!config.material_code || !config.width_in || !config.height_in || !config.qty || !config.sides) return null;
  const addons = [...(config.addons ?? [])].map(token).sort().join("+") || "none";
  return [
    `${token(config.width_in)}x${token(config.height_in)}`,
    `${config.sides}s`,
    `q${token(config.qty)}`,
    `mat-${token(config.material_code)}`,
    `shape-${token(config.shape ?? "square")}`,
    `addons-${addons}`,
  ].join("--");
}

export function deriveCommerceIdentity(
  item: Pick<CartItem, "product_slug" | "config">,
  quote?: Pick<EstimateResponse, "pricing_version" | "line_items">,
): CommerceIdentity {
  const commerceProductId = FAMILY_BY_SLUG[item.product_slug] ?? null;
  const variantKey = canonicalVariantKey(item.config);
  if (!commerceProductId || !variantKey) {
    return {
      commerceProductId: null,
      variantKey: null,
      merchantOfferId: null,
      offerVersion: null,
      configurationFingerprint: null,
      pricingVersion: quote?.pricing_version ?? null,
      pricingRuleId: quote?.line_items?.[0]?.rule_id ?? null,
      policyVersion: COMMERCE_POLICY_VERSION,
      classificationReason: "unclassified: missing deterministic product family or configuration",
    };
  }
  const configurationFingerprint = createHash("sha256")
    .update(`${commerceProductId}|${variantKey}`)
    .digest("hex");
  return {
    commerceProductId,
    variantKey,
    merchantOfferId: `tc-${token(item.product_slug)}--${variantKey}`,
    offerVersion: COMMERCE_OFFER_VERSION,
    configurationFingerprint,
    pricingVersion: quote?.pricing_version ?? null,
    pricingRuleId: quote?.line_items?.[0]?.rule_id ?? null,
    policyVersion: COMMERCE_POLICY_VERSION,
    classificationReason: null,
  };
}

export function merchantPilotIdentity(): CommerceIdentity {
  return deriveCommerceIdentity({
    product_slug: "retractable-banners",
    config: {
      category: "DISPLAY",
      material_code: "RBS33507875S",
      width_in: 33.5,
      height_in: 80,
      sides: 1,
      qty: 1,
    },
  });
}
