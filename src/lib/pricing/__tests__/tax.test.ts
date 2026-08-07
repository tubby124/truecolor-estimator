import { describe, expect, it } from "vitest";
import { computeTax, computeTaxForCart, computePstBase, isPstExemptCategory } from "../tax";

describe("taxable printed-material tax", () => {
  it("applies PST to the full sell price including bundled design and rush", () => {
    expect(computeTax({
      sell_price: 140,
      design_fee: 25,
      rush_fee: 15,
      gst_rate: 0.05,
    })).toEqual({ gst: 7, pst: 8.4, total: 155.4, pstBase: 140 });
  });

  it("sums rounded per-item tax across a cart", () => {
    expect(computeTaxForCart([
      { sell_price: 25, design_fee: 5, rush_fee: 0, gst_rate: 0.05 },
      { sell_price: 40, design_fee: 0, rush_fee: 10, gst_rate: 0.05 },
    ])).toEqual({ gst: 3.25, pst: 3.9, total: 72.15, pstBase: 65 });
  });
});

// Standalone services ship no tangible goods — GST only. Owner decision 2026-08-06,
// matching taxable_pst=FALSE on the SVC-* rows in data/tables/services.v1.csv.
describe("standalone service PST exemption", () => {
  it("flags only DESIGN and SERVICE categories as exempt", () => {
    expect(isPstExemptCategory("DESIGN", "SVC-DESIGN-LOGO")).toBe(true);
    expect(isPstExemptCategory("SERVICE", "SVC-UPSCALE")).toBe(true);
    expect(isPstExemptCategory("design", "svc-design-full")).toBe(true);
    expect(isPstExemptCategory("SIGN", "MPHCC020")).toBe(false);
    expect(isPstExemptCategory(undefined, "SVC-UPSCALE")).toBe(false);
    // The "Small order setup fee" line is category SERVICE but has no SVC- code
    // and IS PST-taxable — it must never be treated as exempt.
    expect(isPstExemptCategory("SERVICE", null)).toBe(false);
    expect(isPstExemptCategory("SERVICE", undefined)).toBe(false);
  });

  it("charges GST but no PST on a $40 vectorization", () => {
    expect(computeTax({ sell_price: 40, gst_rate: 0.05, pst_exempt: true }))
      .toEqual({ gst: 2, pst: 0, total: 42, pstBase: 0 });
  });

  it("returns a zero PST base for a service-only order, including rush", () => {
    expect(computePstBase({
      items: [{ category: "DESIGN", sell_price: 40, config: { material_code: "SVC-DESIGN-LOGO" } }, { category: "SERVICE", sell_price: 20, config: { material_code: "SVC-UPSCALE" } }],
      discountedSubtotal: 60,
      rush: 40,
    })).toBe(0);
  });

  it("still taxes the printed portion of a mixed cart", () => {
    // $100 coroplast + $40 vectorization, no rush → only the sign is PST-taxable
    expect(computePstBase({
      items: [{ category: "SIGN", sell_price: 100 }, { category: "DESIGN", sell_price: 40, config: { material_code: "SVC-DESIGN-LOGO" } }],
      discountedSubtotal: 140,
      rush: 0,
    })).toBe(100);
  });

  it("keeps rush and setup taxable when any printed item is present", () => {
    expect(computePstBase({
      items: [{ category: "SIGN", sell_price: 20 }, { category: "DESIGN", sell_price: 40, config: { material_code: "SVC-DESIGN-LOGO" } }],
      discountedSubtotal: 60,
      rush: 40,
    })).toBe(60);
  });

  it("never returns a negative base when a discount exceeds the taxable portion", () => {
    expect(computePstBase({
      items: [{ category: "SIGN", sell_price: 10 }, { category: "DESIGN", sell_price: 40, config: { material_code: "SVC-DESIGN-LOGO" } }],
      discountedSubtotal: 20, // $30 discount applied
      rush: 0,
    })).toBe(0);
  });

  it("treats an empty cart as taxable-by-default rather than exempt", () => {
    expect(computePstBase({ items: [], discountedSubtotal: 25, rush: 0 })).toBe(25);
  });
});
