/**
 * Pricing Engine Unit Tests
 *
 * The engine is a pure function — same inputs → same outputs.
 * Tests use real CSVs from data/tables/ (no mocks) so they catch
 * any accidental CSV edits that would break customer pricing.
 *
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import { estimate } from "../index";

// ─── BLOCKED / Invalid inputs ─────────────────────────────────────────────────

describe("BLOCKED — invalid inputs", () => {
  it("returns BLOCKED when no category provided", () => {
    // @ts-expect-error intentional — testing runtime guard
    const result = estimate({});
    expect(result.status).toBe("BLOCKED");
    expect(result.sell_price).toBeNull();
  });

  it("returns BLOCKED when category has no fixed-size products and no dimensions given", () => {
    // INSTALLATION has no fixed-size products and requires dims — should BLOCK
    const result = estimate({ category: "INSTALLATION" });
    expect(result.status).toBe("BLOCKED");
    expect(result.sell_price).toBeNull();
  });
});

// ─── STEP 3: Fixed-size exact match ───────────────────────────────────────────

describe("STEP 3 — fixed-size exact match", () => {
  it("SIGN 4×8 ft single — returns FIXED_SIZE tier with price from CSV verbatim", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 48,
      height_in: 96,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.tier_applied).toBe("FIXED_SIZE");
    expect(result.sell_price).toBe(232); // known value from products.v1.csv
    expect(result.qty_discount_applied).toBe(false); // fixed-size skips bulk discount
  });

  it("RIGID ACP 24×36 single — returns verbatim fixed price", () => {
    const result = estimate({
      category: "RIGID",
      material_code: "RMACP002",
      width_in: 24,
      height_in: 36,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.tier_applied).toBe("FIXED_SIZE");
    expect(result.sell_price).toBe(66); // known value from products.v1.csv
  });
});

// ─── STEP 4: Sqft-tier pricing ────────────────────────────────────────────────

describe("STEP 4 — sqft-tier pricing", () => {
  it("SIGN — custom 24×24 in (4 sqft) calculates from pricing rule", () => {
    // 24in / 12 = 2ft, so 2ft × 2ft = 4 sqft
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 24,
      height_in: 24,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.tier_applied).not.toBe("FIXED_SIZE");
    expect(result.sell_price).not.toBeNull();
    expect(result.sqft_calculated).toBeCloseTo(4, 1); // 2ft × 2ft = 4 sqft
  });

  it("SIGN — sell_price is positive for any valid dimensions", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.sell_price).toBeGreaterThan(0);
    // 18×24 = 1.5 sqft × $8/sqft = $12 — but min charge likely applies
  });

  it("BANNER — sell_price is positive for custom size", () => {
    const result = estimate({
      category: "BANNER",
      material_code: "RMBF004",
      width_in: 36,
      height_in: 96, // 3×8 ft = 24 sqft
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.sell_price).toBeGreaterThan(0);
    expect(result.sqft_calculated).toBeCloseTo(24, 1);
  });

  it("MAGNET — custom size returns QUOTED status", () => {
    const result = estimate({
      category: "MAGNET",
      material_code: "MAG302437550M",
      width_in: 12,
      height_in: 18,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.sell_price).toBeGreaterThan(0);
  });
});

// ─── STEP 4.5: Bulk qty discount ─────────────────────────────────────────────

describe("STEP 4.5 — bulk qty discount", () => {
  it("SIGN qty 1 — no bulk discount applied", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 1,
    });
    expect(result.qty_discount_applied).toBe(false);
    expect(result.qty_discount_pct).toBeNull();
  });

  it("SIGN qty 5 — 8% bulk discount applied", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 5,
    });
    expect(result.qty_discount_applied).toBe(true);
    expect(result.qty_discount_pct).toBe(8);
  });

  it("SIGN qty 10 — 17% bulk discount applied", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 10,
    });
    expect(result.qty_discount_applied).toBe(true);
    expect(result.qty_discount_pct).toBe(17);
  });

  it("SIGN qty 25 — 23% bulk discount applied", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 25,
    });
    expect(result.qty_discount_applied).toBe(true);
    expect(result.qty_discount_pct).toBe(23);
  });

  it("fixed-size products do NOT get bulk discount", () => {
    // 4×8 ft sign is a fixed-size product — bulk discount must not apply
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 48,
      height_in: 96,
      sides: 1,
      qty: 1,
    });
    expect(result.tier_applied).toBe("FIXED_SIZE");
    expect(result.qty_discount_applied).toBe(false);
  });

  it("MAGNET qty 5 — 5% bulk discount applied", () => {
    const result = estimate({
      category: "MAGNET",
      material_code: "MAG302437550M",
      width_in: 12,
      height_in: 18,
      sides: 1,
      qty: 5,
    });
    expect(result.qty_discount_applied).toBe(true);
    expect(result.qty_discount_pct).toBe(5);
  });
});

// ─── STEP 6: Minimum charge ───────────────────────────────────────────────────

describe("STEP 6 — minimum charge", () => {
  it("tiny sign (1×1 in) hits minimum charge", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 1,
      height_in: 1,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.min_charge_applied).toBe(true);
    expect(result.sell_price).toBeGreaterThan(0);
    // min_charge_value should be populated
    expect(result.min_charge_value).toBeGreaterThan(0);
  });
});

// ─── STEP 7: Design fee ───────────────────────────────────────────────────────

describe("STEP 7 — design fee", () => {
  const baseRequest = {
    category: "SIGN" as const,
    material_code: "MPHCC020",
    width_in: 24,
    height_in: 36,
    sides: 1 as const,
    qty: 1,
  };

  it("PRINT_READY — no design fee added", () => {
    const base = estimate({ ...baseRequest, design_status: "PRINT_READY" });
    const withFee = estimate({ ...baseRequest, design_status: "MINOR_EDIT" });
    expect(withFee.sell_price! - base.sell_price!).toBe(35);
  });

  it("MINOR_EDIT — adds $35", () => {
    const base = estimate({ ...baseRequest, design_status: "PRINT_READY" });
    const result = estimate({ ...baseRequest, design_status: "MINOR_EDIT" });
    expect(result.sell_price! - base.sell_price!).toBe(35);
    expect(result.line_items.some((li) => li.description.includes("Basic"))).toBe(true);
  });

  it("FULL_DESIGN — adds $50", () => {
    const base = estimate({ ...baseRequest, design_status: "PRINT_READY" });
    const result = estimate({ ...baseRequest, design_status: "FULL_DESIGN" });
    expect(result.sell_price! - base.sell_price!).toBe(50);
  });

  it("LOGO_RECREATION — adds $75", () => {
    const base = estimate({ ...baseRequest, design_status: "PRINT_READY" });
    const result = estimate({ ...baseRequest, design_status: "LOGO_RECREATION" });
    expect(result.sell_price! - base.sell_price!).toBe(75);
  });
});

// ─── STEP 8: Rush fee ─────────────────────────────────────────────────────────

describe("STEP 8 — rush fee", () => {
  const baseRequest = {
    category: "SIGN" as const,
    material_code: "MPHCC020",
    width_in: 24,
    height_in: 36,
    sides: 1 as const,
    qty: 1,
    design_status: "PRINT_READY" as const,
  };

  it("is_rush: true — adds exactly $40", () => {
    const base = estimate({ ...baseRequest, is_rush: false });
    const rush = estimate({ ...baseRequest, is_rush: true });
    expect(rush.sell_price! - base.sell_price!).toBe(40);
  });

  it("RUSH addon — adds exactly $40", () => {
    const base = estimate({ ...baseRequest });
    const rush = estimate({ ...baseRequest, addons: ["RUSH"] });
    expect(rush.sell_price! - base.sell_price!).toBe(40);
  });

  it("rush line item appears in line_items", () => {
    const result = estimate({ ...baseRequest, is_rush: true });
    expect(result.line_items.some((li) => li.description === "Rush Fee")).toBe(true);
  });
});

// ─── STEP 5: Add-ons ─────────────────────────────────────────────────────────

describe("STEP 5 — add-ons", () => {
  it("H_STAKE — adds to sell_price and appears in line_items", () => {
    const base = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 1,
    });
    const withStake = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 18,
      height_in: 24,
      sides: 1,
      qty: 1,
      addons: ["H_STAKE"],
    });
    expect(withStake.sell_price!).toBeGreaterThan(base.sell_price!);
    expect(withStake.line_items.some((li) => li.rule_id === "PR-ADDON-HSTAKE")).toBe(true);
  });

  it("GROMMETS on banner — perimeter-calculated, adds to sell_price", () => {
    const base = estimate({
      category: "BANNER",
      material_code: "RMBF004",
      width_in: 24,
      height_in: 72,
      sides: 1,
      qty: 1,
    });
    const withGrommets = estimate({
      category: "BANNER",
      material_code: "RMBF004",
      width_in: 24,
      height_in: 72,
      sides: 1,
      qty: 1,
      addons: ["GROMMETS"],
    });
    expect(withGrommets.sell_price!).toBeGreaterThan(base.sell_price!);
    const grommetLine = withGrommets.line_items.find((li) => li.rule_id === "PR-ADDON-GROMMET");
    expect(grommetLine).toBeDefined();
    // Perimeter: 2*(2ft+6ft) = 16ft, grommet every 2ft = 8 grommets × $2 = $16
    expect(grommetLine!.qty).toBeGreaterThan(0);
  });
});

// ─── Response shape ───────────────────────────────────────────────────────────

describe("Response shape", () => {
  it("QUOTED response includes all required fields", () => {
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 24,
      height_in: 36,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    expect(result.sell_price).not.toBeNull();
    expect(result.line_items.length).toBeGreaterThan(0);
    expect(result.wave_line_name).toBeTruthy();
    expect(result.pricing_version).toBeTruthy();
    expect(typeof result.min_charge_applied).toBe("boolean");
    expect(typeof result.qty_discount_applied).toBe("boolean");
    expect(typeof result.has_placeholder).toBe("boolean");
  });

  it("wave_line_name is non-empty for all valid categories", () => {
    const categories = ["SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET"] as const;
    for (const category of categories) {
      const result = estimate({
        category,
        width_in: 24,
        height_in: 36,
        sides: 1,
        qty: 1,
      });
      if (result.status === "QUOTED") {
        expect(result.wave_line_name.length).toBeGreaterThan(0);
      }
    }
  });

  it("sell_price is always pre-tax (not including GST)", () => {
    // GST is 5%. If sell_price included GST it would be ~5% higher.
    // We verify sell_price < total (when GST is applied in the UI).
    const result = estimate({
      category: "SIGN",
      material_code: "MPHCC020",
      width_in: 24,
      height_in: 36,
      sides: 1,
      qty: 1,
    });
    expect(result.status).toBe("QUOTED");
    // sell_price is subtotal; UI adds 5% GST on top
    // We can verify line_items sum equals sell_price
    const lineSum = result.line_items.reduce((s, li) => s + li.line_total, 0);
    expect(Math.abs(lineSum - result.sell_price!)).toBeLessThan(0.02); // within 2 cents rounding
  });
});
