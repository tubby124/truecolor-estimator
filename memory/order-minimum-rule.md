# Order Minimum Charge — Architecture (locked 2026-05-20)

## Rule

The customer-facing minimum charge is **per-ORDER, not per-PRODUCT**.

- `ORDER_MINIMUM_DOLLARS = 25` lives in `src/lib/pricing/order-min.ts`
- Per-product `min_charge` field in `pricing_rules.v1.csv` is **reference data only** — engine no longer enforces it (kept for documentation + easy revert if owner reverses).
- The order-total minimum fires at cart aggregation, not in the engine.

## Why

Owner decision 2026-05-19 → 2026-05-20:
> "Get rid of this minimum charge bullshit. Just fucking let them parse it... maybe there should be a minimum order amount for the total order."

The per-product min was hiding quantity scaling on small orders (1 sticker = $45 same as 100 stickers = $45). Customers compared True Color to competitors and saw confusing flat prices. The order-total min protects shop economics without distorting per-piece price visibility.

## How to apply

**Customer-facing checkout (apply surcharge):**
- `src/app/cart/page.tsx` — UI shows fee line + nudge
- `src/app/api/orders/route.ts` — adds surcharge to subtotal + creates "Small order setup fee" line in `order_items` + Wave invoice

**Staff-facing (concierge mode, NEVER surcharge):**
- `/staff` estimator — quotes raw calculated price
- `/api/staff/manual-order` — raw, staff picks the price
- Wave invoices generated from `/staff/quote/wave` — raw

**Verification gate:** Playwright spec `e2e-playwright/order-min-cart.spec.ts` locks in the cart UI behavior. Run before any pricing change.

## Don't

- Add per-product `min_charge` enforcement back to the engine.
- Add the surcharge to `/staff` or `/api/staff/manual-order` paths.
- Hardcode $25 elsewhere — always import `ORDER_MINIMUM_DOLLARS` from `src/lib/pricing/order-min.ts`.
- Add new fixed-size SKUs (like the retired RIGID-ACP3-24X36-S) at prices that contradict the sqft tier rules — causes per-unit price to go UP between qty 1 and qty 2.

## Retired SKUs (do not re-enable without explicit owner approval)

- `RIGID-ACP3-24X36-S` — retired 2026-05-20 (commit `b5e458e`). Frozen $66 intro caused per-unit price increase at qty ≥ 2. Engine now uses sqft tier consistently → $78 at every qty.
