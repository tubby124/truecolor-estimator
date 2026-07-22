import { describe, expect, it } from "vitest";
import { computeTax, computeTaxForCart } from "../tax";

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
