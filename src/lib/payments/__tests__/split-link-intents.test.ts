import { describe, expect, it } from "vitest";
import { buildSplitPaymentLinkIntents } from "../split-link-intents";

describe("split payment link intents", () => {
  it("creates payer-specific link intents for one shared order", () => {
    const intents = buildSplitPaymentLinkIntents({
      orderId: "11111111-1111-4111-8111-111111111111",
      orderNumber: "TC-2026-9999",
      orderTotal: 1000,
      siteUrl: "https://truecolorprinting.ca",
      allocations: [
        {
          amount: 500,
          method: "clover",
          payer: { company: "Company A", email: "ap@company-a.test" },
        },
        {
          amount: 500,
          method: "clover",
          payer: { company: "Company B", email: "ap@company-b.test" },
        },
      ],
    });

    expect(intents).toHaveLength(2);
    expect(intents[0]).toMatchObject({
      orderId: "11111111-1111-4111-8111-111111111111",
      orderNumber: "TC-2026-9999",
      amount: 500,
      amountCents: 50000,
      payer: { company: "Company A", email: "ap@company-a.test" },
      successRedirectUrl: "https://truecolorprinting.ca/order-confirmed?oid=11111111-1111-4111-8111-111111111111",
    });
    expect(intents[0].description).toContain("TC-2026-9999");
    expect(intents[0].description).toContain("Company A");
    expect(intents.map((intent) => intent.externalReference)).toEqual([
      "split:11111111-1111-4111-8111-111111111111:1",
      "split:11111111-1111-4111-8111-111111111111:2",
    ]);
  });

  it("rejects split payment link intents for non-Clover allocations", () => {
    expect(() => buildSplitPaymentLinkIntents({
      orderId: "11111111-1111-4111-8111-111111111111",
      orderNumber: "TC-2026-9999",
      orderTotal: 1000,
      siteUrl: "https://truecolorprinting.ca",
      allocations: [
        { amount: 500, method: "etransfer", payer: { company: "Company A" } },
      ],
    })).toThrow("Clover link intents can only be generated for Clover allocations");
  });
});
