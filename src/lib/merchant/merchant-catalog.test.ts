import { describe, expect, it } from "vitest";
import {
  CANONICAL_MERCHANT_PRODUCT_SLUGS,
  getMerchantOfferSelection,
  getMerchantOffers,
  getMerchantPilotOffer,
  isMerchantOfferImageCleared,
  MERCHANT_CATALOG_SERVING_ENABLED,
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
  it("uses one complete, priceable configuration per canonical product family", () => {
    const offers = getMerchantOffers(SITE_URL);

    expect(offers.map((offer) => offer.slug)).toEqual(CANONICAL_MERCHANT_PRODUCT_SLUGS);
    expect(offers).toHaveLength(16);
    expect(new Set(offers.map((offer) => offer.offerId)).size).toBe(16);
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

  it("serves the rights-cleared catalog with the exact Economy retractable identity", () => {
    const pilot = getMerchantPilotOffer(SITE_URL);
    expect(MERCHANT_CATALOG_SERVING_ENABLED).toBe(true);
    expect(pilot.offerId).toBe("tc-retractable-banners-85e2542c9a34");
    expect(pilot.link).toContain(`merchant=${pilot.offerId}`);
    expect(isMerchantOfferImageCleared(pilot)).toBe(true);
  });

  it("prices every offer identically to the prefilled product page", () => {
    const offers = getMerchantOffers(SITE_URL);

    for (const slug of CANONICAL_MERCHANT_PRODUCT_SLUGS) {
      const offer = offers.find((candidate) => candidate.slug === slug);
      expect(offer, `no merchant offer for ${slug}`).toBeDefined();

      const selection = getMerchantOfferSelection(slug, offer!.offerId);
      expect(selection, `no prefill selection for ${slug}`).toBeDefined();

      expect(
        productPagePrice(slug, selection as MerchantOfferSelection),
        `feed price for ${slug} does not match its product page`,
      ).toBe(offer!.price);
    }
  });
});
