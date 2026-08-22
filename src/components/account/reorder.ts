import type { CartItem } from "@/lib/cart/cart";
import type { Order } from "./types";

/**
 * Turns a previously completed order into cart entries.
 *
 * The checkout route revalidates the cart against the current pricing tables,
 * so a reorder never silently honours a historical price. We still carry the
 * historical configuration, addons, and line-item breakdown so the customer
 * sees exactly what they asked to repeat before that revalidation happens.
 */
export function toReorderCartItems(order: Order): Array<Omit<CartItem, "id">> {
  const gstRate = Number(order.subtotal) > 0
    ? Number(order.gst) / Number(order.subtotal)
    : 0;

  return order.order_items.map((item) => ({
    product_name: item.product_name,
    product_slug: item.category.toLowerCase().replace(/_/g, "-"),
    category: item.category,
    label: `${
      item.width_in && item.height_in
        ? `${item.width_in}×${item.height_in}" — `
        : ""
    }${item.category === "BOOKLET" ? "~80 pages" : item.sides === 2 ? "Double-sided" : "Single-sided"} × ${item.qty}`,
    config: {
      category: item.category,
      material_code: item.material_code ?? undefined,
      width_in: item.width_in ?? undefined,
      height_in: item.height_in ?? undefined,
      sides: item.sides,
      qty: item.qty,
      design_status: item.design_status,
      addons: item.addons ?? undefined,
    },
    sell_price: item.line_total,
    // This value is display metadata only; the server recalculates taxes and
    // price at checkout. Derive it from the original order instead of copying
    // a tax constant into the customer account.
    gst_rate: gstRate,
    qty: item.qty,
    line_items: item.line_items_json ?? undefined,
  }));
}
