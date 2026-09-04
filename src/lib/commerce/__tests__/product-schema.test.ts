import { describe, expect, it } from "vitest";
import { getMerchantPilotOffer } from "@/lib/merchant/merchant-catalog";
import { merchantProductSchema } from "@/lib/commerce/product-schema";

describe("merchant product schema", () => {
  it("uses the exact offer identity and CAD price without invented ratings or policy claims", () => {
    const offer = getMerchantPilotOffer("https://truecolorprinting.ca");
    const schema = merchantProductSchema(offer);
    expect(schema).toMatchObject({ sku: offer.offerId, offers: { price: offer.price.toFixed(2), priceCurrency: "CAD", url: offer.link } });
    expect(JSON.stringify(schema)).not.toMatch(/rating|gtin|shipping|return/i);
  });
});
