import { describe, it, expect } from "vitest";
import { buildQuoteHtml, buildQuotePlainText, computeQuoteTotals } from "../route";

/**
 * Free-form staff quote totals. GST 5% applies to every line; PST 6% applies
 * to every structured line under Saskatchewan PST-20. The Pay Now token and both
 * email bodies read this function, so the stored and displayed cents agree.
 */
describe("computeQuoteTotals — PST applies to every structured line", () => {
  const rates = { gstRate: 0.05, pstRate: 0.06 };
  it("applies PST to a normal product line", () => {
    const t = computeQuoteTotals([{ description: "Banner", qty: "1", unitPrice: "100", taxClass: "printed_good" }], rates);
    expect(t.subtotal).toBe(100);
    expect(t.gst).toBe(5);
    expect(t.pst).toBe(6);
    expect(t.grandTotal).toBe(111);
  });

  it("applies PST and GST to design service", () => {
    const t = computeQuoteTotals([{ description: "Design fee", qty: "1", unitPrice: "35", taxClass: "design_service" }], rates);
    expect(t.subtotal).toBe(35);
    expect(t.gst).toBe(1.75);
    expect(t.pst).toBe(2.1);
    expect(t.grandTotal).toBe(38.85);
  });

  it("applies PST and GST to rush service", () => {
    const t = computeQuoteTotals([
      { description: "Coroplast signs", qty: "1", unitPrice: "100", taxClass: "printed_good" },
      { description: "Same-day rush", qty: "1", unitPrice: "40", taxClass: "rush_service" },
    ], rates);
    expect(t.subtotal).toBe(140);
    expect(t.gst).toBe(7);
    expect(t.pst).toBe(8.4);
    expect(t.grandTotal).toBe(155.4);
  });

  it("applies PST to installation service", () => {
    const t = computeQuoteTotals([{ description: "Installation", qty: "2", unitPrice: "25", taxClass: "installation_service" }], rates);
    expect(t.subtotal).toBe(50);
    expect(t.pst).toBe(3);
    expect(t.grandTotal).toBe(55.5);
  });

  it("emphasizes the pre-tax subtotal consistently in HTML and plain text", () => {
    const opts = {
      customerName: "Ada Buyer",
      lineItems: [
        { description: "Rush", qty: "1", unitPrice: "40", taxClass: "rush_service" as const },
        { description: "Design", qty: "1", unitPrice: "35", taxClass: "design_service" as const },
      ],
      payUrl: "https://truecolorprinting.ca/pay/signed-token",
      payLabel: "$83.25",
      rates,
    };
    const html = buildQuoteHtml(opts);
    const text = buildQuotePlainText(opts);
    expect(html).toContain("Quote subtotal · before tax");
    expect(html).toContain("Quote subtotal (before tax)");
    expect(html).toContain("Payment total (tax included)");
    expect(html).toContain("Rush</td>");
    expect(html).not.toContain("no PST");
    expect(text).toContain("QUOTE SUBTOTAL (BEFORE TAX): $75.00 CAD");
    expect(text).toContain("Rush · Qty");
    expect(text).toContain("Design · Qty");
    expect(text).not.toContain("no PST");
  });
});
