import { describe, it, expect } from "vitest";
import { computeOrderMinSurcharge, ORDER_MINIMUM_DOLLARS } from "../order-min";

describe("computeOrderMinSurcharge", () => {
  it("ORDER_MINIMUM_DOLLARS is $25 (owner decision 2026-05-20)", () => {
    expect(ORDER_MINIMUM_DOLLARS).toBe(25);
  });

  it("$0 cart → surcharge tops up to $25", () => {
    const r = computeOrderMinSurcharge(0);
    expect(r.applied).toBe(true);
    expect(r.surcharge).toBe(25);
    expect(r.effectiveSubtotal).toBe(25);
    expect(r.shortfall).toBe(25);
  });

  it("$0.44 cart (single sticker, Hasan's repro case) → surcharge $24.56", () => {
    const r = computeOrderMinSurcharge(0.44);
    expect(r.applied).toBe(true);
    expect(r.surcharge).toBe(24.56);
    expect(r.effectiveSubtotal).toBe(25);
  });

  it("$24.99 cart → surcharge $0.01 to reach $25", () => {
    const r = computeOrderMinSurcharge(24.99);
    expect(r.applied).toBe(true);
    expect(r.surcharge).toBe(0.01);
    expect(r.effectiveSubtotal).toBe(25);
  });

  it("$25 cart → exactly at minimum, no surcharge", () => {
    const r = computeOrderMinSurcharge(25);
    expect(r.applied).toBe(false);
    expect(r.surcharge).toBe(0);
    expect(r.effectiveSubtotal).toBe(25);
  });

  it("$30 cart → above minimum, no surcharge", () => {
    const r = computeOrderMinSurcharge(30);
    expect(r.applied).toBe(false);
    expect(r.surcharge).toBe(0);
    expect(r.effectiveSubtotal).toBe(30);
  });

  it("$500 cart → no surcharge", () => {
    const r = computeOrderMinSurcharge(500);
    expect(r.applied).toBe(false);
    expect(r.surcharge).toBe(0);
    expect(r.effectiveSubtotal).toBe(500);
  });

  it("negative subtotal is clamped to 0 (defensive)", () => {
    const r = computeOrderMinSurcharge(-5);
    expect(r.subtotal).toBe(0);
    expect(r.surcharge).toBe(25);
    expect(r.effectiveSubtotal).toBe(25);
  });

  it("subtotal is rounded to 2 decimals before comparison", () => {
    const r = computeOrderMinSurcharge(24.999999);
    // 24.999999 rounds to 25.00 → no surcharge
    expect(r.subtotal).toBe(25);
    expect(r.surcharge).toBe(0);
  });

  it("custom min overrides the default", () => {
    const r = computeOrderMinSurcharge(10, 20);
    expect(r.surcharge).toBe(10);
    expect(r.effectiveSubtotal).toBe(20);
  });

  it("real-world: 1 DECAL 2×3 at $0.44 → user pays $25 + tax (not $0.44 + tax)", () => {
    // Before today's fixes: 1 sticker = $45 (per-product min). Customer confused.
    // After today: 1 sticker = $0.44 (engine honest) + $24.56 surcharge → $25. Still
    // a reasonable floor for the shop, but customer sees the honest per-piece price
    // and a transparent setup fee instead of mystery min charge.
    const decalSubtotal = 0.44;
    const r = computeOrderMinSurcharge(decalSubtotal);
    expect(r.effectiveSubtotal).toBe(25);
    expect(r.applied).toBe(true);
  });

  it("real-world: 100 STICKER 1×3 at $30 → no surcharge, full qty scaling visible", () => {
    // Customer benefits from the engine's honest pricing when ordering reasonable qty.
    const stickerSubtotal = 30;
    const r = computeOrderMinSurcharge(stickerSubtotal);
    expect(r.effectiveSubtotal).toBe(30);
    expect(r.applied).toBe(false);
  });
});
