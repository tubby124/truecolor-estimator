import { describe, expect, it } from "vitest";
import { COMMERCE_POLICY, COMMERCE_POLICY_VERSION, isPayableFulfillment } from "@/lib/commerce/policies";

describe("commerce policy truth", () => {
  it("keeps pickup, quote-only shipping, production, rush, and returns distinct", () => {
    expect(COMMERCE_POLICY_VERSION).toBe("2026-09-02");
    expect(COMMERCE_POLICY.pickup).toMatchObject({ price: "free", address: "216 33rd St W, Saskatoon, SK S7L 0V1" });
    expect(COMMERCE_POLICY.shipping.kind).toBe("quote_required");
    expect(COMMERCE_POLICY.production.standard).toBe("2–3 business days after both artwork approval and payment");
    expect(COMMERCE_POLICY.rush.kind).toBe("staff_confirmation_required");
    expect(COMMERCE_POLICY.returns.reportingWindowHours).toBe(48);
  });

  it("does not make an unquoted shipping request payable", () => {
    expect(isPayableFulfillment("pickup")).toBe(true);
    expect(isPayableFulfillment("shipping_quote")).toBe(false);
  });
});
