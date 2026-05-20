import { test, expect, type APIRequestContext } from "@playwright/test";

// Minimum charge enforcement REMOVED 2026-05-19 by owner decision.
//
// Background: True Color is a manual-concierge shop (Hasan + Albert quote every
// job personally). The customer-facing minimum charge was a website guardrail
// that hid quantity scaling on small orders and confused customers comparing
// sticker prices. Owner asked to "get rid of this minimum charge bullshit. Just
// fucking let them parse it, whatever. We just need to give them the quote."
//
// This spec hits /api/estimate live for the categories that historically had
// minimum charges and asserts the engine now returns the calculated price
// directly — no minimum charge applied, no quantity-locked plateau.

interface EstimateResponse {
  status: string;
  sell_price: number | null;
  min_charge_applied: boolean;
  min_charge_skipped: boolean;
  min_charge_value: number | null;
  line_items: Array<{ description: string }>;
}

async function estimate(
  request: APIRequestContext,
  body: {
    category: string;
    material_code?: string;
    width_in?: number;
    height_in?: number;
    qty: number;
  },
): Promise<EstimateResponse> {
  const res = await request.post("/api/estimate", {
    data: { ...body, sides: 1, design_status: "PRINT_READY" },
  });
  return res.json();
}

test.describe("minimum charge enforcement is gone", () => {
  test("DECAL 2×3 in qty 1 returns honest $0.44 — not the old $45 minimum", async ({ request }) => {
    // Hasan's original complaint case. Before today: 1 sticker = $45 (locked at min).
    const r = await estimate(request, {
      category: "DECAL",
      material_code: "ARLPMF7008",
      width_in: 2,
      height_in: 3,
      qty: 1,
    });
    expect(r.status).toBe("QUOTED");
    expect(r.min_charge_applied).toBe(false);
    expect(r.min_charge_skipped).toBe(false);
    expect(r.sell_price).toBeLessThan(1); // 0.04 sqft × $11 = $0.44
  });

  test("DECAL 2×3 scales linearly with quantity from qty 1 (no plateau)", async ({ request }) => {
    const q1 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 1 });
    const q10 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 10 });
    const q50 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 50 });
    const q100 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 100 });

    // No plateau at $45 — every step up in qty must increase the total
    expect(q10.sell_price!).toBeGreaterThan(q1.sell_price!);
    expect(q50.sell_price!).toBeGreaterThan(q10.sell_price!);
    expect(q100.sell_price!).toBeGreaterThan(q50.sell_price!);

    // None of them should equal $45 (the old min charge)
    for (const r of [q1, q10, q50, q100]) {
      expect(r.min_charge_applied).toBe(false);
      expect(r.sell_price).not.toBe(45);
    }
  });

  test("DECAL 1×3 (Hasan's tiny case) — qty scales from 1, no min plateau", async ({ request }) => {
    const q1 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 1 });
    const q50 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 50 });
    const q100 = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 100 });

    expect(q1.sell_price!).toBeLessThan(1);
    expect(q50.sell_price!).toBeGreaterThan(q1.sell_price!);
    expect(q100.sell_price!).toBeGreaterThan(q50.sell_price!);
    expect(q1.min_charge_applied).toBe(false);
  });

  test("tiny SIGN 1×1 in returns honest sub-dollar price", async ({ request }) => {
    const r = await estimate(request, { category: "SIGN", material_code: "MPHCC020", width_in: 1, height_in: 1, qty: 1 });
    expect(r.status).toBe("QUOTED");
    expect(r.min_charge_applied).toBe(false);
    expect(r.sell_price).toBeLessThan(45);
    expect(r.sell_price).toBeGreaterThan(0);
  });

  test("VINYL_LETTERING small qty returns honest price (used to lock at min)", async ({ request }) => {
    const r = await estimate(request, { category: "VINYL_LETTERING", material_code: "ARLPMF7008", width_in: 3, height_in: 3, qty: 1 });
    expect(r.status).toBe("QUOTED");
    expect(r.min_charge_applied).toBe(false);
  });

  test("min_charge_value still returned as informational reference", async ({ request }) => {
    // The CSV min_charge column is preserved as reference data — UI can show it
    // ("our typical floor for decals is $45") but it doesn't bind the calc.
    const r = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 1, height_in: 1, qty: 1 });
    expect(r.min_charge_value).toBeGreaterThan(0); // informational
    expect(r.min_charge_applied).toBe(false); // but not applied
  });
});
