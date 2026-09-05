import { describe, expect, it } from "vitest";
import { buildPurchaseAmounts } from "../purchase-amounts";

describe("GA4 purchase amounts", () => {
  it("excludes tax and shipping, allocates a coupon, and preserves offer identity", () => {
    const purchase = buildPurchaseAmounts({
      total: "121.00", gst: "5", pst: "6", shipping: "20",
      order_items: [
        { merchant_offer_id: "tc-sign-offer", commerce_product_id: "coroplast", product_name: "Renamed sign", qty: 2, line_total: 60 },
        { commerce_product_id: "vinyl-banners", product_name: "Banner", qty: 1, line_total: 40 },
      ],
    });
    expect(purchase).toEqual({
      value: 90, tax: 11, shipping: 20,
      items: [
        { item_id: "tc-sign-offer", item_name: "Renamed sign", price: 27, quantity: 2 },
        { item_id: "vinyl-banners", item_name: "Banner", price: 36, quantity: 1 },
      ],
    });
  });

  it("keeps non-itemized rush separate from product revenue", () => {
    expect(buildPurchaseAmounts({
      total: 144.3, gst: 6.5, pst: 7.8, discount_amount: 10,
      order_items: [{ product_name: "Legacy sign", qty: 2, line_total: 100 }],
    })).toEqual({
      value: 130, tax: 14.3, shipping: 0,
      items: [
        { item_name: "Legacy sign", price: 45, quantity: 2 },
        { item_name: "Additional order charges", price: 40, quantity: 1 },
      ],
    });
  });

  it("allocates rounding pennies without changing the total", () => {
    const purchase = buildPurchaseAmounts({ total: 1, order_items: [
      { product_name: "A", line_total: 1, qty: 3 },
      { product_name: "B", line_total: 1, qty: 7 },
      { product_name: "C", line_total: 1, qty: 1 },
    ] });
    expect(purchase.items.map((item) => Math.round(item.price! * item.quantity! * 100))).toEqual([33, 34, 33]);
    expect(purchase.items.reduce((sum, item) => sum + item.price! * item.quantity!, 0)).toBeCloseTo(purchase.value, 8);
  });

  it("does not invent catalog identity for legacy items or create nonfinite prices", () => {
    const purchase = buildPurchaseAmounts({ total: 0, order_items: [
      { product_name: "Custom named item", qty: 0, line_total: 10 },
      { product_name: "Invalid quantity", qty: "NaN", line_total: 10 },
    ] });
    expect(purchase.items).toEqual([
      { item_name: "Custom named item", quantity: 1, price: 0 },
      { item_name: "Invalid quantity", quantity: 1, price: 0 },
    ]);
  });
});
