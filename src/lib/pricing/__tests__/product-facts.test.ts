import { describe, it, expect } from "vitest";
import { resolveProductFacts, ProductFactsError } from "../product-facts";
import { getProducts } from "@/lib/data/loader";
import { estimate } from "@/lib/engine";

describe("source-backed product facts", () => {
  it("separates raw poster price from the standalone order minimum", () => {
    expect(resolveProductFacts({ productSlug: "photo-posters" })).toMatchObject({
      rawSubtotal: 15, standalonePreTaxOrderTotal: 25, orderMinimum: 25,
      minimumDisclosure: expect.stringContaining("$25 order-total minimum"),
      priceBasis: "configured_quantity", currency: "CAD", availability: "made_to_order",
    });
  });
  it("round-trips stored facts through freshness verification", () => {
    const facts = resolveProductFacts({ productSlug: "flyers" });
    expect(resolveProductFacts({ productSlug: facts.productSlug, configuration: facts.configuration })).toEqual(facts);
    expect(() => resolveProductFacts({ productSlug: "acp-signs", configuration: facts.configuration })).toThrow(ProductFactsError);
  });
  it("uses the real retractable price and suppresses unresolved dimensions in claims", () => {
    const facts = resolveProductFacts({ productSlug: "retractable-banners" });
    expect(facts.rawSubtotal).toBe(219);
    expect(facts.allowedClaims.join(" ")).not.toMatch(/33|24.?80/);
  });
  it("uses the explicit ACP configuration and current engine instead of retired $66 lock", () => {
    const facts = resolveProductFacts({ productSlug: "acp-signs", configuration: { width_in: 24, height_in: 36 } });
    expect(facts.rawSubtotal).toBe(78);
    expect(facts.configuration).toMatchObject({ width_in: 24, height_in: 36 });
  });
  it.each(["business-cards", "flyers", "brochures", "postcards", "stickers", "vinyl-banners", "coroplast-signs"])(
    "%s facts use the same engine and preserve lot quantity", (productSlug) => {
      const facts = resolveProductFacts({ productSlug });
      expect(facts.rawSubtotal).toBe(estimate(facts.configuration).sell_price);
      expect(facts.quantity).toBe(facts.configuration.qty);
      expect(facts.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    });
  it("stable same-config calls; price/config changes invalidate facts without dated version change", () => {
    const input = { productSlug: "business-cards" };
    const first = resolveProductFacts(input);
    expect(resolveProductFacts(input)).toEqual(first);
    const row = getProducts().find((row) => row.product_id === "BC-14PT-250-2S")!;
    const originalPrice = row.price;
    try {
      row.price += 1;
      const changed = resolveProductFacts(input);
      expect(changed.pricingVersion).toBe(first.pricingVersion);
      expect(changed.sourceFingerprint).not.toBe(first.sourceFingerprint);
    } finally { row.price = originalPrice; }
    expect(resolveProductFacts({ ...input, configuration: { qty: 500 } }).sourceFingerprint).not.toBe(first.sourceFingerprint);
  });
  it.each([
    { productSlug: "unknown" }, { productSlug: "custom-shape-signs" }, { productSlug: "__proto__" },
    { productSlug: "business-cards", configuration: { qty: 1500 } },
    { productSlug: "acp-signs", configuration: { material_code: "MPHCC020" } },
    { productSlug: "postcards", configuration: { sides: 1 as const } },
    { productSlug: "photo-posters", configuration: { width_in: 1 } },
    { productSlug: "acp-signs", configuration: { qty: NaN } },
  ])("fails closed for unavailable or mismatched selection %j", (input) => {
    expect(() => resolveProductFacts(input)).toThrow(ProductFactsError);
  });
});
