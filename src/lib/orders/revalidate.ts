/**
 * Server-side price revalidation for checkout — pure function over cart items.
 * Extracted from src/app/api/orders/route.ts (2026-08-16) so the quote-surface
 * parity test can exercise the EXACT request the checkout builds without
 * importing the route's server-only dependencies. Behaviour unchanged.
 */

import { estimate } from "@/lib/engine";
import type { CartItem } from "@/lib/cart/cart";
import { deriveCommerceIdentity } from "@/lib/commerce/catalog";

/**
 * Server-side price revalidation.
 * Re-runs the pricing engine for each cart item and overrides the client-submitted
 * sell_price with the authoritative server price. Prevents price manipulation attacks
 * where a malicious user submits fake prices (e.g. sell_price: 0.01).
 *
 * If the engine can't price an item, checkout is rejected. Custom/unusual work
 * must use the quote flow; public client prices are never authoritative.
 *
 * NOTE: is_rush is intentionally NOT passed to the engine here. Rush is a flat $40
 * per-order fee applied at the order level (line 246), not per-item. Passing is_rush
 * to estimate() would add $40 to EACH item's sell_price, then the order-level rush
 * would add another $40, resulting in overcharging.
 */
export function revalidateItemPrices(items: CartItem[]): CartItem[] {
  return items.map((item) => {
    try {
      const result = estimate({
        category: item.category as Parameters<typeof estimate>[0]["category"],
        material_code: item.config.material_code,
        width_in: item.config.width_in,
        height_in: item.config.height_in,
        sides: item.config.sides as 1 | 2 | undefined,
        qty: item.qty,
        addons: item.config.addons as Parameters<typeof estimate>[0]["addons"],
        design_status: item.config.design_status as Parameters<typeof estimate>[0]["design_status"],
        // Sticker V2: shape carries a price multiplier (circle). Without it the
        // server re-priced every circle order as square and silently overwrote
        // the customer's price downward.
        shape: item.config.shape,
        is_rush: false,
      });

      if (result.status === "QUOTED" && result.sell_price != null) {
        const serverPrice = result.sell_price;
        const clientPrice = item.sell_price;
        const diff = Math.abs(serverPrice - clientPrice);
        const diffPct = clientPrice > 0 ? diff / clientPrice : 1;

        if (diffPct > 0.01 || diff > 0.5) {
          // Log manipulation attempt or stale client-side price
          console.warn(
            `[orders] price revalidation: client=$${clientPrice.toFixed(2)} server=$${serverPrice.toFixed(2)} diff=$${diff.toFixed(2)} (${(diffPct * 100).toFixed(1)}%) — using server price | item: ${item.product_name}`
          );
        }
        return {
          ...item,
          sell_price: serverPrice,
          design_fee: result.design_fee ?? 0,
          line_items: result.line_items,
          commerce_identity: deriveCommerceIdentity(item, result),
        };
      }
      throw new Error(`Pricing engine returned ${result.status}`);
    } catch (err) {
      console.error(`[orders] price revalidation error for ${item.product_name}:`, err);
      throw new Error(`Unable to price ${item.product_name}. Please request a custom quote.`);
    }
  });
}
