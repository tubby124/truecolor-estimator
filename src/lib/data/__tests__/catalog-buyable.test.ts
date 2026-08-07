import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../products-content";
import { estimate } from "@/lib/engine";

/**
 * Every product in products-content.ts must actually be BUYABLE.
 *
 * Why this file exists: on 2026-08-07 four standalone service SKUs shipped to
 * production completely unbuyable. Their pages returned 200, validate:pricing
 * passed, and 678 unit tests passed — because every existing check verified
 * PRESENTATION (in the sitemap? in the nav? has an icon? is the price string
 * right?) and nothing verified FUNCTION (does it price? can it reach the cart?).
 *
 * The specific break: three separate gates treat width/height as a proxy for
 * "is this a real product", which silently excluded flat-fee services. The
 * catalog had grown an unstated invariant — every product is a physical thing
 * with dimensions — and nothing enforced or documented it.
 *
 * These tests encode the two preconditions a product must satisfy to be sold:
 *   1. The engine returns a price for its default configuration.
 *   2. That default configuration passes the add-to-cart gate.
 *
 * A new product that fails either one fails CI instead of shipping dead.
 */

const entries = Object.entries(PRODUCTS).filter(([, p]) => !p.comingSoon);

/** Rebuild the exact request the configurator sends on first paint. */
function defaultRequest(p: (typeof entries)[number][1]) {
  const preset = p.sizePresets[0];
  const materialCode = p.tierPresets
    ? p.tierPresets[0]?.material_code ?? p.material_code
    : preset?.material_code ?? p.material_code;
  return {
    category: p.category,
    material_code: materialCode,
    width_in: preset?.width_in ?? 0,
    height_in: preset?.height_in ?? 0,
    sides: p.defaultSides,
    qty: p.qtyPresets[0],
    design_status: "PRINT_READY",
  };
}

describe("every catalog product is priceable in its default configuration", () => {
  it.each(entries)("%s returns a price", (slug, p) => {
    const res = estimate(defaultRequest(p) as Parameters<typeof estimate>[0]);
    expect(
      res.sell_price,
      `${slug} did not price. status=${res.status} notes=${JSON.stringify(res.clarification_notes)}`,
    ).not.toBeNull();
    expect(res.status, `${slug} was BLOCKED by the engine`).not.toBe("BLOCKED");
  });
});

describe("every catalog product can reach the cart", () => {
  // Mirrors the guard in ProductPageClient.handleAddToCart. If that guard
  // changes, change it here too — that coupling is the point.
  it.each(entries)("%s passes the add-to-cart gate", (slug, p) => {
    const req = defaultRequest(p);
    const dimensionsRequired = !p.serviceMode;
    const blocked = dimensionsRequired && (req.width_in <= 0 || req.height_in <= 0);
    expect(
      blocked,
      `${slug} would be silently rejected by handleAddToCart: ` +
        `width=${req.width_in} height=${req.height_in} serviceMode=${!!p.serviceMode}. ` +
        `A dimensionless product must set serviceMode: true.`,
    ).toBe(false);
    expect(req.qty, `${slug} has a non-positive default qty`).toBeGreaterThan(0);
  });
});

describe("catalog wiring invariants", () => {
  it.each(entries)("%s declares a material code the engine can match", (slug, p) => {
    const req = defaultRequest(p);
    expect(req.material_code, `${slug} has no material_code on the product or its first size preset`).toBeTruthy();
  });

  it("flat-fee services use an SVC- material code so tax and Wave treat them correctly", () => {
    for (const [slug, p] of entries) {
      if (!p.serviceMode) continue;
      const req = defaultRequest(p);
      expect(
        String(req.material_code).toUpperCase().startsWith("SVC-"),
        `${slug} is serviceMode but its material_code (${req.material_code}) lacks the SVC- prefix — ` +
          `PST exemption and the Wave line mapper both key off that prefix, so it would be taxed as goods.`,
      ).toBe(true);
    }
  });
});
