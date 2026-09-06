import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/engine";
import { getCanonicalTaxRates } from "@/lib/pricing/canonical-rates";
import { computeTax, computeTaxForCart } from "@/lib/pricing/tax";
import { computeTaxCents } from "@/lib/payment/tax-math";
import { manualBreakdownCents, scaleManualPricing } from "@/lib/payment/manual-pricing";
import { computeStructuredQuoteTotals, STRUCTURED_TAX_POLICY_VERSION } from "@/lib/payment/structured-quote-tax";

const rates = getCanonicalTaxRates();
const active = { ...rates, structuredTaxPolicyVersion: STRUCTURED_TAX_POLICY_VERSION };
describe("canonical tax parity", () => {
  it("uses the real engine's same printed job across estimate, checkout, manual and active structured quote", () => {
    const result = estimate({ category: "BANNER", width_in: 24, height_in: 72, qty: 1, sides: 1, design_status: "PRINT_READY" });
    expect(result.status).toBe("QUOTED");
    const amount = result.sell_price!;
    expect(result).toMatchObject({ gst_rate: rates.gstRate, pst_rate: rates.pstRate });
    const engineTax = computeTax(result);
    const checkout = computeTaxCents(Math.round(amount * 100), rates);
    const manual = manualBreakdownCents([{ amount }], rates);
    const structured = computeStructuredQuoteTotals([{ description: "Banner", qty: "1", unitPrice: amount.toFixed(2), taxClass: "printed_good" }], active);
    expect(engineTax.total * 100).toBe(checkout.totalCents);
    expect(manual.totalCents).toBe(checkout.totalCents);
    expect(structured.grandTotal * 100).toBe(checkout.totalCents);
  });
  it("rounds once at the order base instead of accumulating per-line tax pennies", () => {
    const inputs = Array.from({ length: 4 }, () => ({ sell_price: .1, gst_rate: rates.gstRate, pst_rate: rates.pstRate }));
    expect(computeTaxForCart(inputs)).toEqual({ gst: .02, pst: .02, total: .44, pstBase: .4 });
    expect(manualBreakdownCents(inputs.map((item) => ({ amount: item.sell_price })), rates).totalCents).toBe(44);
  });
  it("keeps old policy active without the DB capability, and changes only a newly marked revision", () => {
    const lines = [
      { description: "Print", qty: "1", unitPrice: "100", taxClass: "printed_good" as const },
      { description: "Design", qty: "1", unitPrice: "35", taxClass: "design_service" as const },
    ];
    expect(computeStructuredQuoteTotals(lines, rates).pst).toBe(6);
    expect(computeStructuredQuoteTotals(lines, active).pst).toBe(8.1);
    expect(computeStructuredQuoteTotals(lines, active, true).pst).toBe(0);
  });
  it("preserves bespoke no-floor overrides and standalone service exemptions", () => {
    const service = [{ amount: 10, qty: 3, unitPrice: 99, taxClass: "design_service" as const }];
    expect(manualBreakdownCents(service, rates)).toEqual({ subtotalCents: 1000, gstCents: 50, pstCents: 0, totalCents: 1050 });
    const scaled = scaleManualPricing(service, rates, 5.25);
    expect(scaled.breakdown.totalCents).toBe(525);
    expect(scaled.items[0].unitPrice).toBeUndefined();
  });
  it("rejects nonfinite, negative or unavailable rates", () => {
    expect(() => computeTaxCents(100, { gstRate: -1, pstRate: .06 })).toThrow();
    expect(() => computeTaxCents(100, { gstRate: 5, pstRate: .06 })).toThrow();
    expect(() => computeTax({ sell_price: 100, gst_rate: .05 })).toThrow("refresh");
    expect(() => computeTaxCents(100, rates, false, 101)).toThrow("PST base");
  });
});
