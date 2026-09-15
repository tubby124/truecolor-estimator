import { describe, expect, it } from "vitest";
import { getCanonicalTaxRates } from "@/lib/pricing/canonical-rates";
import { buildCatalogWaveInvoicePlan } from "../catalog-wave-plan";

const rates = getCanonicalTaxRates();

function plan(overrides: Partial<Parameters<typeof buildCatalogWaveInvoicePlan>[0]> = {}) {
  return buildCatalogWaveInvoicePlan({
    items: [],
    discount: 0,
    smallOrderFee: 0,
    rush: 0,
    rates,
    ...overrides,
  });
}

describe("catalog Wave invoice plan", () => {
  it("uses Wave's per-line rounding for two distinct $337.50 rows", () => {
    const result = plan({
      items: [
        { description: "Banner A", qty: 1, sellPrice: 337.5, category: "BANNER", materialCode: "BANNER-V13-5X10FT" },
        { description: "Banner B", qty: 1, sellPrice: 337.5, category: "BANNER", materialCode: "BANNER-V13-5X10FT" },
      ],
    });

    expect(result.waveItems).toEqual([
      expect.objectContaining({ description: "Banner A", unitPrice: 337.5, qty: 1, applyPst: true }),
      expect.objectContaining({ description: "Banner B", unitPrice: 337.5, qty: 1, applyPst: true }),
    ]);
    expect(result.financials).toEqual({ subtotalCents: 67500, gstCents: 3376, pstCents: 4050, totalCents: 74926 });
  });

  it("keeps a divisible quantity as one exact provider line", () => {
    const result = plan({
      items: [{ description: "Two banners", qty: 2, sellPrice: 675, category: "BANNER", materialCode: "BANNER-V13-5X10FT" }],
    });

    expect(result.waveItems).toEqual([
      expect.objectContaining({ description: "Two banners", unitPrice: 337.5, qty: 2 }),
    ]);
    expect(result.financials).toEqual({ subtotalCents: 67500, gstCents: 3375, pstCents: 4050, totalCents: 74925 });
  });

  it("does not let Wave's two-decimal unit serialization lose a fractional quantity total", () => {
    const result = plan({
      items: [{ description: "Three labels", qty: 3, sellPrice: 10, category: "LABEL", materialCode: "LABEL-1" }],
    });

    expect(result.waveItems).toEqual([
      expect.objectContaining({ description: "Three labels — Quantity: 3", unitPrice: 10, qty: 1 }),
    ]);
    expect(result.financials).toEqual({ subtotalCents: 1000, gstCents: 50, pstCents: 60, totalCents: 1110 });
  });

  it("keeps standalone services GST-only while taxable goods retain PST", () => {
    const result = plan({
      items: [
        { description: "Printed sign", qty: 1, sellPrice: 100, category: "SIGN", materialCode: "SIGN-1" },
        { description: "Vector cleanup", qty: 1, sellPrice: 40, category: "SERVICE", materialCode: "SVC-VECTOR" },
      ],
    });

    expect(result.waveItems.map(({ applyPst }) => applyPst)).toEqual([true, false]);
    expect(result.financials).toEqual({ subtotalCents: 14000, gstCents: 700, pstCents: 600, totalCents: 15300 });
  });

  it("includes discount, setup, and rush with the tax classes Wave receives", () => {
    const result = plan({
      items: [{ description: "Printed sign", qty: 1, sellPrice: 20, category: "SIGN", materialCode: "SIGN-1" }],
      discount: 2,
      discountDescription: "Discount (SAVE2)",
      smallOrderFee: 7,
      rush: 40,
    });

    expect(result.isRush).toBe(false);
    expect(result.waveItems).toEqual([
      expect.objectContaining({ description: "Printed sign", unitPrice: 20, applyPst: true }),
      expect.objectContaining({ description: "Discount (SAVE2)", unitPrice: -2, applyPst: true }),
      expect.objectContaining({ description: "Small order setup fee", unitPrice: 7, applyPst: true }),
      expect.objectContaining({ description: "Rush production fee — same-day turnaround", unitPrice: 40, applyPst: true }),
    ]);
    expect(result.financials).toEqual({ subtotalCents: 6500, gstCents: 325, pstCents: 390, totalCents: 7215 });
  });

  it("puts a mixed-cart discount remainder on a GST-only Wave line", () => {
    const result = plan({
      items: [
        { description: "Print", qty: 1, sellPrice: 10, category: "SIGN", materialCode: "SIGN-1" },
        { description: "Design", qty: 1, sellPrice: 20, category: "DESIGN", materialCode: "SVC-DESIGN" },
      ],
      discount: 15,
    });

    expect(result.waveItems.slice(-2)).toEqual([
      expect.objectContaining({ description: "Discount", unitPrice: -10, applyPst: true }),
      expect.objectContaining({ description: "Discount (service portion)", unitPrice: -5, applyPst: false }),
    ]);
    expect(result.financials).toEqual({ subtotalCents: 1500, gstCents: 75, pstCents: 0, totalCents: 1575 });
  });
});
