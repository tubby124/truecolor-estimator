import { describe, it, expect } from "vitest";
import { buildQuoteHtml, buildQuotePlainText, computeQuoteTotals } from "../route";

/**
 * Free-form staff quote totals. GST applies to every line. PST excludes
 * separately itemized design and rush services. The Pay Now token and both
 * email bodies read this function, so the stored and displayed cents agree.
 */
describe("computeQuoteTotals — PST eligibility by structured tax class", () => {
  const rates = { gstRate: 0.05, pstRate: 0.06 };
  it("applies PST to a normal product line", () => {
    const t = computeQuoteTotals([{ description: "Banner", qty: "1", unitPrice: "100", taxClass: "printed_good" }], rates);
    expect(t.subtotal).toBe(100);
    expect(t.gst).toBe(5);
    expect(t.pst).toBe(6);
    expect(t.grandTotal).toBe(111);
  });

  it("applies GST but not PST to design service", () => {
    const t = computeQuoteTotals([{ description: "Design fee", qty: "1", unitPrice: "35", taxClass: "design_service" }], rates);
    expect(t.subtotal).toBe(35);
    expect(t.gst).toBe(1.75);
    expect(t.pst).toBe(0);
    expect(t.grandTotal).toBe(36.75);
  });

  it("excludes rush service from the PST base", () => {
    const t = computeQuoteTotals([
      { description: "Coroplast signs", qty: "1", unitPrice: "100", taxClass: "printed_good" },
      { description: "Same-day rush", qty: "1", unitPrice: "40", taxClass: "rush_service" },
    ], rates);
    expect(t.subtotal).toBe(140);
    expect(t.gst).toBe(7);
    expect(t.pst).toBe(6);
    expect(t.grandTotal).toBe(153);
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
      payLabel: "$78.75",
      rates,
    };
    const html = buildQuoteHtml(opts);
    const text = buildQuotePlainText(opts);
    expect(html).toContain("Quote subtotal · before tax");
    expect(html).toContain("Quote subtotal (before tax)");
    expect(html).toContain("Payment total (tax included)");
    expect(html).toContain("Rush</td>");
    expect(html).toContain("Payment total (tax included)</span><span>$78.75 CAD");
    expect(text).toContain("QUOTE SUBTOTAL (BEFORE TAX): $75.00 CAD");
    expect(text).toContain("Rush · Qty");
    expect(text).toContain("Design · Qty");
    expect(text).toContain("PST (6%): $0.00");
    expect(text).toContain("Payment total (tax included): $78.75 CAD");
  });
});
