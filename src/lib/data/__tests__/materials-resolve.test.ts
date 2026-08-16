import { describe, expect, it } from "vitest";
import { getMaterials } from "../loader";

/**
 * Every material_code a configurator can emit must resolve to a row in
 * materials.v1.csv with a finite cost.
 *
 * Why this file exists: on 2026-08-16 the sticker configurator was offering
 * "Clear vinyl" (ARLPMF7008_CLEAR, UnifiedConfigurator.tsx) and the V2 bridge
 * was mapping it to vinyl_clear (sticker-v2-bridge.ts), but materials.v1.csv
 * had no row for that code. Nothing failed loudly — computeCost() in
 * src/lib/engine/index.ts does `materials.find(...)` and silently falls back
 * to material_cost: "PLACEHOLDER" when the code is missing, so every clear-vinyl
 * order reported an incomplete cost and a TBD margin to staff forever.
 *
 * Sell price was never affected (getMaterials() is read ONLY by computeCost,
 * which feeds `cost` / `has_placeholder` and never `sell_price`), which is
 * exactly why it stayed invisible. This test makes the omission fail CI.
 */

/** Material codes the sticker material chip can emit — mirrors the chip list in
 *  src/components/product/UnifiedConfigurator.tsx and the mapper in
 *  src/lib/engine/sticker-v2-bridge.ts. Keep the three in sync. */
const STICKER_MATERIAL_CODES = ["ARLPMF7008", "ARLPMF7008_CLEAR", "RMVN006"] as const;

describe("sticker configurator material codes resolve in materials.v1.csv", () => {
  const materials = getMaterials();

  it.each(STICKER_MATERIAL_CODES)("%s has a row", (code) => {
    const mat = materials.find((m) => m.material_code === code);
    expect(mat, `${code} is offered by the configurator but has no materials.v1.csv row`).toBeDefined();
  });

  it.each(STICKER_MATERIAL_CODES)("%s has a finite, non-placeholder cost", (code) => {
    const mat = materials.find((m) => m.material_code === code);
    expect(mat?.is_placeholder, `${code} resolves but is flagged placeholder — margin would show TBD`).toBe(false);
    expect(
      Number.isFinite(mat?.cost_per_sqft ?? NaN),
      `${code} cost_per_sqft is ${String(mat?.cost_per_sqft)} — margin math would be incomplete`,
    ).toBe(true);
  });
});
