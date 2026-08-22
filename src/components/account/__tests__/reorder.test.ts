import { describe, expect, it } from "vitest";
import { toReorderCartItems } from "../reorder";
import type { Order } from "../types";

const order: Order = {
  id: "order-1",
  order_number: "TC-101",
  status: "complete",
  subtotal: 100,
  gst: 5,
  pst: 6,
  total: 111,
  discount_code: null,
  discount_amount: null,
  notes: null,
  created_at: "2026-08-22T00:00:00.000Z",
  is_rush: false,
  payment_method: "clover_card",
  receipt_token: null,
  paid_at: "2026-08-22T00:00:00.000Z",
  wave_payment_recorded_at: null,
  pay_url: null,
  proof_storage_path: null,
  proof_storage_paths: null,
  proof_sent_at: null,
  file_storage_paths: null,
  order_items: [
    {
      id: "item-1",
      product_name: "Coroplast sign",
      qty: 4,
      width_in: 24,
      height_in: 18,
      sides: 2,
      design_status: "PRINT_READY",
      line_total: 100,
      category: "COROPLAST_SIGNS",
      material_code: "CORO4",
      addons: ["H_STAKE", "GROMMETS"],
      line_items_json: [
        { description: "Coroplast sign", qty: 4, unit_price: 20, line_total: 80, rule_id: "SIGN" },
        { description: "H-stakes", qty: 4, unit_price: 5, line_total: 20, rule_id: "H_STAKE" },
      ],
      file_storage_path: null,
    },
  ],
};

describe("toReorderCartItems", () => {
  it("preserves the original customer configuration and lets checkout revalidate the current price", () => {
    const [item] = toReorderCartItems(order);

    expect(item.product_slug).toBe("coroplast-signs");
    expect(item.config).toMatchObject({
      category: "COROPLAST_SIGNS",
      material_code: "CORO4",
      width_in: 24,
      height_in: 18,
      sides: 2,
      qty: 4,
      design_status: "PRINT_READY",
      addons: ["H_STAKE", "GROMMETS"],
    });
    expect(item.line_items).toEqual(order.order_items[0].line_items_json);
    expect(item.gst_rate).toBe(0.05);
    expect(item.sell_price).toBe(100);
  });

  it("does not inject a tax rate when a legacy order has no taxable subtotal", () => {
    const [item] = toReorderCartItems({ ...order, subtotal: 0, gst: 0 });

    expect(item.gst_rate).toBe(0);
  });
});
