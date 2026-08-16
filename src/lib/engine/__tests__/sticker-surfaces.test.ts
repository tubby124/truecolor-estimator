/**
 * Sticker quote-surface parity — every place that produces a sticker price
 * must agree for the same inputs.
 *
 * Surfaces (all route through estimate() -> runStickerV2 when the V2 flag is on):
 *   1. Public product configurator + staff estimator (UnifiedConfigurator):
 *      POST /api/estimate with { category, material_code, width_in, height_in,
 *      qty, sides:1, design_status, is_rush, shape }.
 *   2. Checkout server revalidation: revalidateItemPrices(CartItem[]) in
 *      src/lib/orders/revalidate.ts (called by /api/orders) rebuilds the request from CartItem.config
 *      and OVERWRITES the client price with the server price.
 *   3. Email quote / Pay Now: reuse the in-memory EstimateResponse from (1).
 *
 * The 2026-08-16 trace found (2) dropped `shape`, so a circle configured on
 * the website was re-priced as a square at checkout. This test pins parity.
 *
 * Note: vitest does not load .env.local, so the V2 flag is stubbed here —
 * production (Railway) runs with NEXT_PUBLIC_USE_STICKER_PRICING_V2=true.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { estimate } from "../index";
import type { EstimateRequest } from "../types";
import type { CartItem } from "@/lib/cart/cart";
import { revalidateItemPrices } from "@/lib/orders/revalidate";

const MATERIALS = ["ARLPMF7008", "ARLPMF7008_CLEAR", "RMVN006", "PLACEHOLDER_STICKER_4X4"] as const;
const SHAPES = ["square", "circle", "die_cut"] as const;
const SIZES: [number, number][] = [[2, 2], [3, 3], [4, 4], [4, 6], [8, 8], [12, 18], [24, 24]];
const QTYS = [1, 5, 25, 50, 99, 100, 250, 500, 1000];

function configuratorRequest(
  material_code: string, w: number, h: number, qty: number, shape: EstimateRequest["shape"],
): EstimateRequest {
  // Mirrors UnifiedConfigurator.tsx's debounced /api/estimate body for STICKER.
  return { category: "STICKER", material_code, width_in: w, height_in: h, qty, sides: 1,
    design_status: "PRINT_READY", is_rush: false, shape };
}

function cartItemFrom(req: EstimateRequest, clientPrice: number): CartItem {
  // Mirrors ProductPageClient.tsx addToCart() config for a sticker.
  return {
    id: "test", product_name: "Vinyl Stickers", product_slug: "stickers", category: "STICKER",
    label: `${req.width_in}×${req.height_in}" — Single-sided × ${req.qty}`,
    config: { category: "STICKER", material_code: req.material_code, width_in: req.width_in,
      height_in: req.height_in, sides: 1, qty: req.qty, design_status: "PRINT_READY", shape: req.shape },
    sell_price: clientPrice, gst_rate: 0.05, design_fee: 0, qty: req.qty ?? 1,
  } as CartItem;
}

describe("Sticker quote surfaces agree (V2 on)", () => {
  beforeAll(() => { vi.stubEnv("NEXT_PUBLIC_USE_STICKER_PRICING_V2", "true"); });
  afterAll(() => { vi.unstubAllEnvs(); });

  it("configurator price === checkout revalidation price for every material/shape/size/qty", () => {
    const mismatches: string[] = [];
    let checked = 0;
    for (const material of MATERIALS) for (const shape of SHAPES) for (const [w, h] of SIZES) for (const qty of QTYS) {
      const req = configuratorRequest(material, w, h, qty, shape);
      const shown = estimate(req);
      expect(shown.status, `${material} ${shape} ${w}x${h} q${qty}`).toBe("QUOTED");
      // Deliberately feed the WRONG client price so the test proves the server
      // recomputes from config, not from what the client sent.
      const [item] = revalidateItemPrices([cartItemFrom(req, 1)]);
      if (item.sell_price !== shown.sell_price) {
        mismatches.push(`${material} ${shape} ${w}x${h} q${qty}: configurator $${shown.sell_price} vs checkout $${item.sell_price}`);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(500);
    expect(mismatches, mismatches.slice(0, 8).join("\n")).toEqual([]);
  });

  it("circle is priced above square on both surfaces (the multiplier survives checkout)", () => {
    const sq = configuratorRequest("ARLPMF7008", 3.5, 3.5, 150, "square");
    const ci = configuratorRequest("ARLPMF7008", 3.5, 3.5, 150, "circle");
    const shownSq = estimate(sq).sell_price!, shownCi = estimate(ci).sell_price!;
    expect(shownCi).toBeGreaterThan(shownSq);
    const [ckSq] = revalidateItemPrices([cartItemFrom(sq, shownSq)]);
    const [ckCi] = revalidateItemPrices([cartItemFrom(ci, shownCi)]);
    expect(ckSq.sell_price).toBe(shownSq);
    expect(ckCi.sell_price).toBe(shownCi);
  });

  it("response is internally consistent: sell_price === line total; unit x qty === total unless the $25 order-min applied", () => {
    for (const [w, h] of SIZES) for (const qty of QTYS) {
      const r = estimate(configuratorRequest("ARLPMF7008", w, h, qty, "square"));
      const line = r.line_items[0];
      expect(r.sell_price).toBe(line.line_total);
      expect(r.price_per_unit).toBe(line.unit_price);
      const unitTimesQty = Math.round(line.unit_price * qty * 100) / 100;
      if (r.min_charge_applied) {
        // $25 order-min pinned the total; UI shows "Your items $X -> You pay $25".
        expect(r.min_charge_value).toBe(r.sell_price);
        expect(r.pre_min_subtotal).toBe(unitTimesQty);
        expect(unitTimesQty).toBeLessThan(r.sell_price!);
      } else {
        expect(unitTimesQty).toBe(r.sell_price);
        expect(r.min_charge_value).toBeNull();
        expect(r.pre_min_subtotal).toBeNull();
      }
    }
  });

  it("does not misreport the per-unit tier floor as an order-level small-order fee", () => {
    // 50 x 3x3 = $60: floor-dominated per unit ($1.20 floor) but well above the
    // $25 order-min. Before 2026-08-16 this surfaced min_charge_value=1.20 and
    // the product page rendered "You pay $1.20".
    const r = estimate(configuratorRequest("ARLPMF7008", 3, 3, 50, "die_cut"));
    expect(r.sell_price).toBe(60);
    expect(r.min_charge_applied).toBe(false);
    expect(r.min_charge_value).toBeNull();
  });
});
