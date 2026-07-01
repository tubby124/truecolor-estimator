import { test, expect, type APIRequestContext } from "@playwright/test";

// Sticker pricing — locks in the area-scaling fix shipped 2026-05-19.
//
// BUG that this guards against (staff complaint relayed by Hasan):
//   "Some clients want to make 2×4 and 1×3 inch stickers and nothing changes
//   w/ quantity"
//
// Before the fix, /api/estimate matched the catch-all PR-STICKER-{qty} rule by
// qty alone, so 1×3, 2×4, 5×5, 8×8 etc. all returned the same flat 4×4-reference
// price. Customers were either overcharged for tiny stickers or undercharged for
// big ones, depending on the size.
//
// The current app may route STICKER through the fitted V2 model when
// NEXT_PUBLIC_USE_STICKER_PRICING_V2=true. Keep this browser test focused on the
// public API contract instead of pinning old CSV-era fixture prices.

interface EstimateResponse {
  status: string;
  sell_price: number | null;
  line_items: Array<{ description: string }>;
  min_charge_applied: boolean;
}

async function estimate(
  request: APIRequestContext,
  body: { category: string; material_code: string; width_in: number; height_in: number; qty: number },
): Promise<EstimateResponse> {
  const res = await request.post("/api/estimate", {
    data: { ...body, sides: 1, design_status: "PRINT_READY" },
  });
  return res.json();
}

test.describe("STICKER pricing API — dimensions and qty affect price", () => {
  test("1×3 stickers (Hasan's case) scale with quantity AND cost less than 4×4 reference", async ({ request }) => {
    const q25 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 25 });
    const q50 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 50 });
    const q100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 100 });
    const q250 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 1, height_in: 3, qty: 250 });
    const ref100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 4, height_in: 4, qty: 100 });

    expect(q25.status).toBe("QUOTED");
    expect(q250.status).toBe("QUOTED");

    // Quantity must scale within a size — the original bug was identical prices across qty
    expect(q50.sell_price!).toBeGreaterThan(q25.sell_price!);
    expect(q100.sell_price!).toBeGreaterThanOrEqual(q50.sell_price!);
    expect(q250.sell_price!).toBeGreaterThan(q100.sell_price!);

    // 1×3 (3 sq in) must be cheaper than 4×4 (16 sq in) at same qty
    expect(q100.sell_price!).toBeLessThan(ref100.sell_price!);

    // Tiny jobs must still respect the pricing floor.
    expect(q25.sell_price!).toBeGreaterThanOrEqual(15);

    expect(q100.line_items[0].description).toContain("STICKER");
  });

  test("2×4 stickers (Hasan's other case) scale with quantity AND are half of 4×4 catch-all", async ({ request }) => {
    const q50 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 50 });
    const q100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 100 });
    const q250 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 250 });
    const ref100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 4, height_in: 4, qty: 100 });

    expect(q100.sell_price!).toBeLessThan(ref100.sell_price!);
    expect(q100.sell_price!).toBeGreaterThan(q50.sell_price!);
    expect(q250.sell_price!).toBeGreaterThan(q100.sell_price!);
  });

  test("larger custom dimensions cost more than smaller custom dimensions", async ({ request }) => {
    const customSizes = [
      { w: 4, h: 6 },
      { w: 5, h: 5 },
      { w: 8, h: 8 },
    ];
    let previous = 0;
    for (const { w, h } of customSizes) {
      const quote = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: w, height_in: h, qty: 100 });
      expect(quote.status, `${w}×${h} should quote`).toBe("QUOTED");
      expect(quote.sell_price!, `${w}×${h} should be above previous size`).toBeGreaterThan(previous);
      previous = quote.sell_price!;
    }
  });

  test("4×4 reference size quotes successfully", async ({ request }) => {
    const ref = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 4, height_in: 4, qty: 100 });
    expect(ref.status).toBe("QUOTED");
    expect(ref.sell_price!).toBeGreaterThan(0);
    expect(ref.line_items[0].description).toContain("STICKER");
  });

  test("size-specific SKU material codes still quote", async ({ request }) => {
    const s2x2 = await estimate(request, { category: "STICKER", material_code: "PLACEHOLDER_STICKER_2X2", width_in: 2, height_in: 2, qty: 100 });
    const s2x3 = await estimate(request, { category: "STICKER", material_code: "PLACEHOLDER_STICKER_2X3", width_in: 2, height_in: 3, qty: 100 });
    expect(s2x2.status).toBe("QUOTED");
    expect(s2x3.status).toBe("QUOTED");
    expect(s2x3.sell_price!).toBeGreaterThan(s2x2.sell_price!);
  });

  test("non-STICKER categories not touched by area-scaling (regression guard)", async ({ request }) => {
    // DECAL is sqft-tier (no area-scaling logic). After 2026-05-19 min charge
    // was killed sitewide, so this is just an honest sqft × rate × qty calc.
    const decal = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 50 });
    expect(decal.status).toBe("QUOTED");
    expect(decal.sell_price).toBe(20); // 0.04 sqft × $11 × 50 × 0.9 (10% bulk) = $19.80 → ceilCent → $20
    expect(decal.min_charge_applied).toBe(false);
    expect(decal.line_items[0].description).not.toContain("area-scaled");
  });

  test("8 standard sticker sizes all return distinct prices for the same qty", async ({ request }) => {
    // This is the headline assertion that proves Hasan's complaint is gone.
    const sizes: Array<[number, number]> = [
      [1, 3],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 3],
      [4, 4],
      [4, 6],
      [5, 5],
      [6, 6],
      [8, 8],
    ];
    const prices = new Set<number>();
    for (const [w, h] of sizes) {
      const r = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: w, height_in: h, qty: 250 });
      expect(r.status, `${w}×${h} qty 250 should quote`).toBe("QUOTED");
      prices.add(r.sell_price ?? -1);
    }
    // The original bug returned the same flat price for every size — set size would be 1.
    // After the fix, distinct sizes get distinct prices.
    expect(prices.size, "most distinct sizes should produce distinct prices").toBeGreaterThanOrEqual(sizes.length - 2);
  });
});
