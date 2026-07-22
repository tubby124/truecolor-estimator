import { describe, it, expect } from "vitest";
import {
  applyOverrideTotal,
  computeBreakdownCents,
  type OrderItemInput,
} from "../route";

/**
 * Staff "Edit total" back-solve. When staff type a final price, the server scales
 * the pre-tax line amounts so the recomputed GST (5%) + PST (6%) land on EXACTLY
 * the typed total to the cent — and the same scaled amounts feed the DB, Wave
 * invoice, Clover token, and customer email (one consistent total across all
 * layers). Every line is part of the taxable printed-material charge.
 */

function product(amount: number): OrderItemInput {
  return { kind: "product", product: "Sign", qty: 1, amount };
}
function fee(amount: number): OrderItemInput {
  return { kind: "fee", product: "Install Fee", qty: 1, amount };
}

describe("applyOverrideTotal — exact tax-consistent back-solve", () => {
  const cases: Array<{ name: string; items: OrderItemInput[]; target: number }> = [
    { name: "single product → $200", items: [product(45)], target: 200 },
    { name: "two products → $100", items: [product(30), product(70)], target: 100 },
    { name: "product + fee mix → $250.37", items: [product(120), fee(40)], target: 250.37 },
    { name: "last line is a fee → $100", items: [product(80), fee(35)], target: 100 },
    { name: "all service lines → $77.77", items: [fee(20), fee(50)], target: 77.77 },
    { name: "ugly rounding → $33.33", items: [product(10), product(13.37)], target: 33.33 },
    { name: "scale up large → $1234.56", items: [product(100), fee(25), product(60)], target: 1234.56 },
    { name: "scale down → $12.50", items: [product(400), product(80)], target: 12.5 },
  ];

  for (const { name, items, target } of cases) {
    it(`${name} reconciles to the cent with a clean tax split`, () => {
      const { items: scaled, breakdown } = applyOverrideTotal(items, target);

      // Grand total equals exactly what staff typed.
      expect(breakdown.totalCents).toBe(Math.round(target * 100));

      // Tax split is exactly GST 5% + PST 6% of the full subtotal —
      // recomputed independently from the scaled line amounts (no drift).
      const recomputed = computeBreakdownCents(scaled);
      expect(recomputed).toEqual(breakdown);
      expect(breakdown.gstCents).toBe(Math.round(breakdown.subtotalCents * 0.05));
      expect(breakdown.pstCents).toBe(Math.round(breakdown.subtotalCents * 0.06));
    });
  }

  it("leaves amounts untouched when no override is given", () => {
    const items = [product(45), fee(35)];
    const { items: out, breakdown } = applyOverrideTotal(items, undefined);
    expect(out.map((i) => i.amount)).toEqual([45, 35]);
    // The full $80 customer charge is subject to both GST and PST.
    expect(breakdown.totalCents).toBe(8880);
  });

  it("applies PST to service lines bundled with the print sale", () => {
    const { breakdown } = applyOverrideTotal([fee(20), fee(50)], 77.77);
    expect(breakdown.pstCents).toBe(Math.round(breakdown.subtotalCents * 0.06));
    expect(breakdown.totalCents).toBe(7777);
  });

  it("rejects a zero/negative override total", () => {
    expect(() => applyOverrideTotal([product(45)], 0)).toThrow();
    expect(() => applyOverrideTotal([product(45)], -5)).toThrow();
  });

  it("rejects an override above the maximum", () => {
    expect(() => applyOverrideTotal([product(45)], 99999 * 1.11 + 1)).toThrow();
  });

  it("rejects an override when there are no positive line amounts", () => {
    expect(() => applyOverrideTotal([product(0)], 100)).toThrow();
  });
});
