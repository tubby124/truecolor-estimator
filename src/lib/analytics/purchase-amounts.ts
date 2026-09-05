import type { MpItem } from "./measurementProtocol";

type Amount = number | string | null | undefined;

export interface PurchaseOrderItem {
  merchant_offer_id?: string | null;
  commerce_product_id?: string | null;
  product_name?: string | null;
  qty?: Amount;
  line_total?: Amount;
}

interface PurchaseOrderAmounts {
  total: Amount;
  gst?: Amount;
  pst?: Amount;
  discount_amount?: Amount;
  // Current checkout is pickup-only. A future shipping flow must supply its
  // separately stored charge here; never infer shipping from a product name.
  shipping?: Amount;
  order_items?: PurchaseOrderItem[] | null;
}

function cents(value: Amount): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

/** GA4 revenue excludes tax/shipping and must reconcile to net item revenue. */
export function buildPurchaseAmounts(order: PurchaseOrderAmounts): {
  value: number;
  tax: number;
  shipping: number;
  items: MpItem[];
} {
  const tax = cents(order.gst) + cents(order.pst);
  const shipping = cents(order.shipping);
  const net = Math.max(0, cents(order.total) - tax - shipping);
  const rows = Array.isArray(order.order_items) ? order.order_items : [];
  const gross = rows.reduce((sum, item) => sum + cents(item.line_total), 0);
  const itemNet = Math.min(net, Math.max(0, gross - cents(order.discount_amount)));
  let grossSoFar = 0;
  let allocated = 0;

  const items: MpItem[] = rows.map((item) => {
    grossSoFar += cents(item.line_total);
    // Cumulative cent allocation avoids losing/adding pennies across coupons.
    const cumulative = gross > 0 ? Math.round(itemNet * grossSoFar / gross) : 0;
    const lineNet = cumulative - allocated;
    allocated = cumulative;
    const rawQty = Number(item.qty ?? 1);
    const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    const itemId = item.merchant_offer_id?.trim() || item.commerce_product_id?.trim();
    return {
      ...(itemId ? { item_id: itemId } : {}),
      item_name: item.product_name || "Unclassified order item",
      price: lineNet / 100 / quantity,
      quantity,
    };
  });

  // Rush is stored in the order total outside its item lines. Keep this
  // residual separate rather than claiming it is additional product revenue.
  if (net > itemNet) {
    items.push({ item_name: "Additional order charges", price: (net - itemNet) / 100, quantity: 1 });
  }

  return { value: net / 100, tax: tax / 100, shipping: shipping / 100, items };
}
