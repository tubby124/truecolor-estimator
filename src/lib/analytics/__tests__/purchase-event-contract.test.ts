import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("PurchaseEvent Ads privacy contract", () => {
  it("does not wire email-marketing consent or customer email into Google Ads", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/order-confirmed/PurchaseEvent.tsx"),
      "utf8",
    );

    expect(source).not.toContain("NEXT_PUBLIC_GOOGLE_ADS_ENHANCED_CONVERSIONS_ENABLED");
    expect(source).not.toContain("enhancedConversion");
    expect(source).not.toContain("marketingConsent");
    expect(source).not.toContain("customerEmail");
    expect(source).not.toContain("sendGoogleAdsPurchase");
    expect(source).not.toContain("NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_LABEL");
    expect(source).not.toContain("NEXT_PUBLIC_GOOGLE_ADS_QUOTE_WON_CONVERSION_LABEL");
    expect(source).toContain("durable server outbox");
    expect(source).toContain("orderNumber");
    expect(source.match(/metaTrackPurchase\(/g)).toHaveLength(1);
    expect(source).toContain("eventId: orderNumber");
    expect(source).not.toContain('window.fbq("track", "Purchase"');
  });
});
