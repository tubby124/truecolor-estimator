import { describe, expect, it } from "vitest";
import {
  CANONICAL_MERCHANT_PRODUCT_SLUGS,
  getMerchantOfferSelection,
  getMerchantOffers,
  getMerchantPilotOffer,
  isMerchantOfferImageCleared,
  MERCHANT_CATALOG_SERVING_ENABLED,
  MERCHANT_OFFER_COUNT,
  type MerchantOfferSelection,
} from "./merchant-catalog";
import { PRODUCTS } from "@/lib/data/products-content";
import { estimate } from "@/lib/engine";
import type { Category } from "@/lib/data/types";

const SITE_URL = "https://truecolorprinting.ca";

// Mirrors ProductConfigurator's price derivation for a prefilled `initialSelection`
// (src/components/product/ProductConfigurator.tsx). Kept verbatim — including the
// sizePresets[0] and tierPresets[0] fallbacks — so this test fails loudly if the
// product content drifts away from what the feed seeds assume.
function productPagePrice(slug: string, selection: MerchantOfferSelection): number {
  const product = PRODUCTS[slug];

  const selectedSize =
    product.sizePresets.find((preset) => preset.label === selection.sizeLabel) ?? product.sizePresets[0];
  const sides = selection.sides ?? product.defaultSides;
  const qty = selection.qty ?? product.qtyPresets[0];

  const requestedTier =
    product.tierPresets?.findIndex((tier) => tier.material_code === selection.materialCode) ?? -1;
  const selectedTier = requestedTier >= 0 ? requestedTier : 0;

  const effectiveMaterialCode = product.tierPresets
    ? product.tierPresets[selectedTier]?.material_code ?? product.material_code
    : selectedSize?.material_code
      ? selectedSize.material_code
      : product.material_code;

  // No custom size / custom qty / addons on first paint, and designStatus starts PRINT_READY.
  const quote = estimate({
    category: product.category as Category,
    material_code: effectiveMaterialCode,
    width_in: selectedSize.width_in,
    height_in: selectedSize.height_in,
    sides,
    qty,
    design_status: "PRINT_READY",
  });

  if (quote.sell_price == null) {
    throw new Error(`Product page for ${slug} returns no price for the merchant selection`);
  }
  return quote.sell_price;
}

describe("Merchant catalog", () => {
  it("uses complete, priceable configurations across every canonical product family", () => {
    const offers = getMerchantOffers(SITE_URL);

    expect([...new Set(offers.map((offer) => offer.slug))]).toEqual(CANONICAL_MERCHANT_PRODUCT_SLUGS);
    expect(offers).toHaveLength(MERCHANT_OFFER_COUNT);
    expect(new Set(offers.map((offer) => offer.offerId)).size).toBe(offers.length);
    expect(offers.every((offer) => offer.offerId.length <= 50)).toBe(true);
    expect(offers.every((offer) => offer.price >= 25)).toBe(true);
    expect(offers.every((offer) => offer.link.includes(`merchant=${offer.offerId}`))).toBe(true);
    for (const offer of offers) {
      expect(isMerchantOfferImageCleared(offer), `${offer.slug}: ${offer.offerId}`).toBe(true);
    }
  });

  it("only activates the catalog configuration for its matching product-page offer", () => {
    expect(getMerchantOfferSelection("photo-posters", "tc-photo-posters")).toMatchObject({
      sizeLabel: "24×36\"",
      qty: 1,
      sides: 1,
    });
    expect(getMerchantOfferSelection("photo-posters", "tc-flyers")).toBeUndefined();
    expect(getMerchantOfferSelection("rack-cards", "tc-rack-cards")).toBeUndefined();
  });

  it("resolves every same-family variant to its exact landing-page selection", () => {
    expect(getMerchantOfferSelection("vinyl-banners", "tc-vinyl-banners-c29b4b917fc2")).toMatchObject({
      sizeLabel: "2×4 ft",
      qty: 1,
    });
    expect(getMerchantOfferSelection("vinyl-banners", "tc-vinyl-banners-284ff31492f0")).toMatchObject({
      sizeLabel: "3×6 ft",
      qty: 1,
    });
    expect(getMerchantOfferSelection("business-cards", "tc-business-cards-d6d62ed498b9")).toMatchObject({
      qty: 250,
      sides: 2,
    });
    expect(getMerchantOfferSelection("business-cards", "tc-business-cards-3ce49250f675")).toMatchObject({
      qty: 500,
      sides: 2,
    });
    expect(getMerchantOfferSelection("business-cards", "tc-vinyl-banners-284ff31492f0")).toBeUndefined();
  });

  it("groups variants with the exact differentiating attributes Google consumes", () => {
    const offers = getMerchantOffers(SITE_URL);
    const banners = offers.filter((offer) => offer.slug === "vinyl-banners");
    const cards = offers.filter((offer) => offer.slug === "business-cards");

    expect(banners.map((offer) => offer.itemGroupId)).toEqual(Array(2).fill("tc-family-vinyl-banners"));
    expect(banners.map((offer) => offer.size)).toEqual(["2×4 ft", "3×6 ft"]);
    expect(cards.map((offer) => offer.itemGroupId)).toEqual(Array(2).fill("tc-family-business-cards"));
    expect(cards.map((offer) => offer.multipack)).toEqual([250, 500]);
    expect(banners.map((offer) => offer.variantOption)).toEqual([
      { name: "Size", value: "2×4 ft" },
      { name: "Size", value: "3×6 ft" },
    ]);
    expect(cards.map((offer) => offer.variantOption)).toEqual([
      { name: "Pack quantity", value: "250" },
      { name: "Pack quantity", value: "500" },
    ]);

    const cards500 = cards.find((offer) => offer.qty === 500);
    expect(cards500?.description).toContain("500 full-colour business cards");
    expect(cards500?.description).not.toMatch(/250 cards|\$45/);
  });

  it("serves the rights-cleared catalog with the exact Economy retractable identity", () => {
    const pilot = getMerchantPilotOffer(SITE_URL);
    expect(MERCHANT_CATALOG_SERVING_ENABLED).toBe(true);
    expect(pilot.offerId).toBe("tc-retractable-banners-85e2542c9a34");
    expect(pilot.link).toContain(`merchant=${pilot.offerId}`);
    expect(isMerchantOfferImageCleared(pilot)).toBe(true);
  });

  it("prices every offer identically to the prefilled product page", () => {
    const offers = getMerchantOffers(SITE_URL);

    for (const offer of offers) {
      const selection = getMerchantOfferSelection(offer.slug, offer.offerId);
      expect(selection, `no prefill selection for ${offer.offerId}`).toBeDefined();

      expect(
        productPagePrice(offer.slug, selection as MerchantOfferSelection),
        `feed price for ${offer.offerId} does not match its product page`,
      ).toBe(offer.price);
    }
  });
});
