import { describe, expect, it } from "vitest";
import { getMerchantOffers, getMerchantPilotOffer } from "@/lib/merchant/merchant-catalog";
import { merchantProductSchema } from "@/lib/commerce/product-schema";

describe("merchant product schema", () => {
  it("uses the exact offer identity and CAD price without invented ratings or policy claims", () => {
    const offer = getMerchantPilotOffer("https://truecolorprinting.ca");
    const schema = merchantProductSchema(offer);
    expect(schema).toMatchObject({ sku: offer.offerId, offers: { price: offer.price.toFixed(2), priceCurrency: "CAD", url: offer.link } });
    expect(JSON.stringify(schema)).not.toMatch(/rating|gtin|shipping|return/i);
  });

  it("connects grouped variants to the same Merchant product family", () => {
    const banner = getMerchantOffers("https://truecolorprinting.ca")
      .find((offer) => offer.offerId === "tc-vinyl-banners-284ff31492f0");
    expect(banner).toBeDefined();
    expect(merchantProductSchema(banner!)).toMatchObject({
      sku: banner!.offerId,
      inProductGroupWithID: "tc-family-vinyl-banners",
    });
  });
});
