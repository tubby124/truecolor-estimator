import { describe, expect, it } from "vitest";
import { getMerchantPilotOffer } from "@/lib/merchant/merchant-catalog";
import { merchantPilotProductSchema } from "@/lib/commerce/product-schema";

describe("merchant pilot schema", () => {
  it("uses the exact offer identity and CAD price without invented ratings or policy claims", () => {
    const offer = getMerchantPilotOffer("https://truecolorprinting.ca");
    const schema = merchantPilotProductSchema(offer);
    expect(schema).toMatchObject({ sku: offer.offerId, offers: { price: offer.price.toFixed(2), priceCurrency: "CAD", url: offer.link } });
    expect(JSON.stringify(schema)).not.toMatch(/rating|gtin|shipping|return/i);
  });
});
