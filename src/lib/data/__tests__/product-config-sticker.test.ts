/**
 * STICKER product-config tests — Wave 1 of Product Configurator Unification.
 *
 * Guards the "math math" for stickers across every UI surface that will read
 * from getProductConfig("STICKER"). Two layers:
 *   1. snapQtyToTier helper — UX contract (rounds up never down, flags exceed).
 *   2. Engine round-trip — pick each public preset, confirm the engine returns
 *      the same price the public product page would have returned. Includes
 *      the catch-all area-scaling path (1.25" custom) and the $15 floor.
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import { describe, it, expect } from "vitest";
import { estimate } from "@/lib/engine";
import { getProductConfig, snapQtyToTier } from "../product-config";

describe("snapQtyToTier", () => {
  const tiers = [25, 50, 100, 250, 500, 1000];

  it("returns snapped=false when qty is already on a tier", () => {
    expect(snapQtyToTier(100, tiers)).toEqual({ snapped: false, from: 100, to: 100, exceeded_max: false });
  });

  it("snaps UP to the nearest tier above the requested qty", () => {
    expect(snapQtyToTier(99, tiers)).toEqual({ snapped: true, from: 99, to: 100, exceeded_max: false });
    expect(snapQtyToTier(150, tiers)).toEqual({ snapped: true, from: 150, to: 250, exceeded_max: false });
    expect(snapQtyToTier(26, tiers)).toEqual({ snapped: true, from: 26, to: 50, exceeded_max: false });
  });

  it("never snaps DOWN — even when the lower tier is numerically closer", () => {
    // 51 is closer to 50 than to 100, but snap UP rule wins (customer should
    // never get a price for fewer than they asked for).
    expect(snapQtyToTier(51, tiers)).toEqual({ snapped: true, from: 51, to: 100, exceeded_max: false });
  });

  it("clamps to max tier + flags exceeded_max when qty above largest tier", () => {
    expect(snapQtyToTier(1500, tiers)).toEqual({ snapped: true, from: 1500, to: 1000, exceeded_max: true });
  });

  it("snaps UP to the smallest tier when qty is below it", () => {
    expect(snapQtyToTier(10, tiers)).toEqual({ snapped: true, from: 10, to: 25, exceeded_max: false });
  });

  it("returns identity when tier list is empty", () => {
    expect(snapQtyToTier(50, [])).toEqual({ snapped: false, from: 50, to: 50, exceeded_max: false });
  });
});

describe("getProductConfig('STICKER')", () => {
  const cfg = getProductConfig("STICKER");

  it("is live, lot-priced, and snaps off-tier qty", () => {
    expect(cfg.status).toBe("live");
    expect(cfg.isLotCategory).toBe(true);
    expect(cfg.isSqftCategory).toBe(false);
    expect(cfg.qty_snap_to_tier).toBe(true);
    expect(cfg.qty_tiers).toEqual([25, 50, 100, 250, 500, 1000]);
  });

  it("exposes a size_preset control with 11 choices (10 sizes + Custom)", () => {
    const sizeCtrl = cfg.controls.find((c) => c.key === "size_preset");
    expect(sizeCtrl).toBeDefined();
    expect(sizeCtrl?.choices).toHaveLength(11);
    const custom = sizeCtrl?.choices?.find((c) => c.custom);
    expect(custom).toBeDefined();
    expect(custom?.material_code).toBe("ARLPMF7008");
  });

  it("every non-Custom preset carries width_in + height_in + material_code", () => {
    const sizeCtrl = cfg.controls.find((c) => c.key === "size_preset");
    const presets = sizeCtrl?.choices?.filter((c) => !c.custom) ?? [];
    expect(presets.length).toBe(10);
    for (const p of presets) {
      expect(p.width_in).toBeGreaterThan(0);
      expect(p.height_in).toBeGreaterThan(0);
      expect(p.material_code).toMatch(/^(ARLPMF7008|PLACEHOLDER_STICKER_)/);
    }
  });
});

describe("STICKER engine round-trip — public preset matches engine price", () => {
  it("2×2 qty 25 PLACEHOLDER_STICKER_2X2 = $25 (exact-match SKU)", () => {
    const r = estimate({
      category: "STICKER",
      material_code: "PLACEHOLDER_STICKER_2X2",
      width_in: 2, height_in: 2, sides: 1, qty: 25,
    });
    expect(r.status).toBe("QUOTED");
    expect(r.sell_price).toBe(25);
  });

  it("4×4 qty 100 ARLPMF7008 = $160 (catch-all reference)", () => {
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 4, height_in: 4, sides: 1, qty: 100,
    });
    expect(r.status).toBe("QUOTED");
    expect(r.sell_price).toBe(160);
  });

  it("custom 1.25×1.25 qty 100 ARLPMF7008 = $15.63 (area-scaled, above floor)", () => {
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 1.25, height_in: 1.25, sides: 1, qty: 100,
    });
    expect(r.status).toBe("QUOTED");
    // 160 × (1.5625 / 16) = 15.625 → ceilCent → 15.63 → max(15.63, 15) = 15.63
    expect(r.sell_price).toBe(15.63);
  });

  it("custom 1×1 qty 100 ARLPMF7008 = $15 (area-scaled, hits the $15 floor)", () => {
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 1, height_in: 1, sides: 1, qty: 100,
    });
    expect(r.status).toBe("QUOTED");
    // 160 × (1 / 16) = 10 → ceilCent → 10 → max(10, 15) = 15
    expect(r.sell_price).toBe(15);
  });

  it("custom 2.5×7 qty 250 ARLPMF7008 area-scales from 4×4 reference", () => {
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 2.5, height_in: 7, sides: 1, qty: 250,
    });
    expect(r.status).toBe("QUOTED");
    // PR-STICKER-250 baseline = $325 (4×4 reference). 2.5×7 = 17.5 sqin.
    // Ratio = 17.5 / 16 = 1.09375. 325 × 1.09375 = 355.47 → ceilCent → 355.47.
    expect(r.sell_price).toBeCloseTo(355.47, 2);
  });

  it("off-tier qty (99) is BLOCKED by engine — UI must snap before calling", () => {
    // This documents the engine's contract that necessitates qty_snap_to_tier
    // in the UI layer. The engine itself does not snap; the configurator does.
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 4, height_in: 4, sides: 1, qty: 99,
    });
    expect(r.status).toBe("BLOCKED");
  });

  it("post-snap qty (99 → 100) prices at the 100-tier baseline", () => {
    const snap = snapQtyToTier(99, [25, 50, 100, 250, 500, 1000]);
    expect(snap.to).toBe(100);
    const r = estimate({
      category: "STICKER",
      material_code: "ARLPMF7008",
      width_in: 4, height_in: 4, sides: 1, qty: snap.to,
    });
    expect(r.status).toBe("QUOTED");
    expect(r.sell_price).toBe(160);
  });
});
