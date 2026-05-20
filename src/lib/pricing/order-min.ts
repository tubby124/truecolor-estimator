// Order-total minimum surcharge.
//
// Customer-facing replacement for the per-product minimum charge that was killed
// 2026-05-19. The engine returns honest per-piece prices for everything (1 sticker
// = $0.44, 100 stickers = $30, etc.) — but the shop still needs a floor to cover
// setup time on tiny orders.
//
// Floor lives on the WHOLE ORDER, not per-product. So a customer can buy 100
// stickers at $30 (no surcharge) but a customer buying 1 sticker at $0.44 sees a
// "Small order setup" fee that tops the order up to ORDER_MINIMUM_DOLLARS.
//
// Owner decision 2026-05-20: $25 floor. Below industry norm for a digital print
// shop (StickerYou ~$10, VistaPrint $0, local shops $20–30). Low enough not to
// scare browsers, high enough to cover Roland setup + cut + bag + wrapping time.
//
// Skipped on:
//   - /staff manual-order path — concierge mode, Hasan/Albert quote anything
//   - Wave invoices generated from /staff quotes — same reason
// Applied on:
//   - Customer self-service cart → /api/orders checkout
//   - Wave invoices generated FROM that customer-checkout flow

export const ORDER_MINIMUM_DOLLARS = 25;
export const SMALL_ORDER_FEE_LABEL = "Small order setup fee";

export interface OrderMinResult {
  subtotal: number;        // pre-surcharge subtotal as provided
  surcharge: number;       // 0 if subtotal >= min, else (min - subtotal)
  effectiveSubtotal: number; // subtotal + surcharge
  applied: boolean;        // surcharge > 0
  shortfall: number;       // how much more product would skip the surcharge (same as surcharge)
}

export function computeOrderMinSurcharge(subtotal: number, min: number = ORDER_MINIMUM_DOLLARS): OrderMinResult {
  const safeSubtotal = Math.max(0, Math.round(subtotal * 100) / 100);
  const surcharge = safeSubtotal >= min ? 0 : Math.round((min - safeSubtotal) * 100) / 100;
  return {
    subtotal: safeSubtotal,
    surcharge,
    effectiveSubtotal: Math.round((safeSubtotal + surcharge) * 100) / 100,
    applied: surcharge > 0,
    shortfall: surcharge,
  };
}
