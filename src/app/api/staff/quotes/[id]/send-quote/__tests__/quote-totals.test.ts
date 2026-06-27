import { describe, it, expect } from "vitest";
import { computeQuoteTotals } from "../route";

/**
 * Free-form staff quote totals. GST 5% applies to every line; PST 6% applies
 * only to non-exempt lines. Lines flagged exempt=true are design/rush/install
 * fees, which are PST-exempt per truecolor-domain.md. The Pay Now token and the
 * email body both read this function, so the customer is never over-charged PST
 * on a fee line.
 */
describe("computeQuoteTotals — PST exempts fee lines", () => {
  it("applies PST to a normal product line", () => {
    const t = computeQuoteTotals([{ description: "Banner", qty: "1", unitPrice: "100" }]);
    expect(t.subtotal).toBe(100);
    expect(t.gst).toBe(5);
    expect(t.pst).toBe(6);
    expect(t.grandTotal).toBe(111);
  });

  it("exempts a fee line from PST but still charges GST", () => {
    const t = computeQuoteTotals([{ description: "Design fee", qty: "1", unitPrice: "35", exempt: true }]);
    expect(t.subtotal).toBe(35);
    expect(t.gst).toBe(1.75);
    expect(t.pst).toBe(0);
    expect(t.grandTotal).toBe(36.75);
  });

  it("mixes a product and a fee line correctly", () => {
    // Product $100 (PST) + Rush $40 (no PST). GST on $140, PST on $100 only.
    const t = computeQuoteTotals([
      { description: "Coroplast signs", qty: "1", unitPrice: "100" },
      { description: "Same-day rush", qty: "1", unitPrice: "40", exempt: true },
    ]);
    expect(t.subtotal).toBe(140);
    expect(t.gst).toBe(7); // 140 * 0.05
    expect(t.pst).toBe(6); // 100 * 0.06 — rush excluded
    expect(t.grandTotal).toBe(153);
  });

  it("treats an unflagged line as taxable (backward compatible)", () => {
    const t = computeQuoteTotals([{ description: "Stickers", qty: "2", unitPrice: "25" }]);
    expect(t.subtotal).toBe(50);
    expect(t.pst).toBe(3); // 50 * 0.06
    expect(t.grandTotal).toBe(55.5);
  });
});
