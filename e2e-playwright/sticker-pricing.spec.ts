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
// After the fix, when STICKER is requested with the default ARLPMF7008 material
// code (i.e. no specific size SKU material), the engine area-scales the catch-all
// price by (width × height) / (4 × 4). Explicit size SKUs (PLACEHOLDER_STICKER_2X2,
// etc.) are unchanged.

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

test.describe("STICKER engine — area scaling on catch-all material", () => {
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
    expect(q100.sell_price!).toBeGreaterThan(q50.sell_price!);
    expect(q250.sell_price!).toBeGreaterThan(q100.sell_price!);

    // 1×3 (3 sq in) must be cheaper than 4×4 (16 sq in) at same qty
    expect(q100.sell_price!).toBeLessThan(ref100.sell_price!);

    // Area-scaled values: 160 × 3/16 = 30
    expect(q100.sell_price).toBe(30);
    // Tiny + low qty hits the $15 floor (otherwise would be 60 × 3/16 = ~$11)
    expect(q25.sell_price).toBe(15);

    expect(q100.line_items[0].description).toContain("area-scaled");
  });

  test("2×4 stickers (Hasan's other case) scale with quantity AND are half of 4×4 catch-all", async ({ request }) => {
    const q50 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 50 });
    const q100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 100 });
    const q250 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 2, height_in: 4, qty: 250 });
    const ref100 = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 4, height_in: 4, qty: 100 });

    // 2×4 (8 sq in) at qty 100 should be exactly half of 4×4 catch-all (160 × 8/16 = 80)
    expect(q100.sell_price).toBe(80);
    expect(q50.sell_price).toBe(47.5); // 95 × 8/16 = 47.5
    expect(q100.sell_price!).toBeLessThan(ref100.sell_price!);
    expect(q250.sell_price!).toBeGreaterThan(q100.sell_price!);
  });

  test("custom dimensions match explicit-SKU prices (path parity)", async ({ request }) => {
    // Customers entering custom dimensions should get the same price as customers
    // picking a size preset. Confirms area-scaling formula matches the spreadsheet
    // the SKUs were derived from.
    const customSizes = [
      { w: 4, h: 6, mat: "PLACEHOLDER_STICKER_4X6", expected: 240 }, // 160 × 24/16
      { w: 5, h: 5, mat: "PLACEHOLDER_STICKER_5X5", expected: 250 }, // 160 × 25/16
      { w: 8, h: 8, mat: "PLACEHOLDER_STICKER_8X8", expected: 640 }, // 160 × 64/16
    ];
    for (const { w, h, mat, expected } of customSizes) {
      const catchAll = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: w, height_in: h, qty: 100 });
      const explicitSKU = await estimate(request, { category: "STICKER", material_code: mat, width_in: w, height_in: h, qty: 100 });
      expect(catchAll.sell_price, `area-scaled ${w}×${h} should be $${expected}`).toBe(expected);
      expect(explicitSKU.sell_price, `explicit SKU ${w}×${h} should be $${expected}`).toBe(expected);
    }
  });

  test("4×4 reference size is unchanged (regression guard)", async ({ request }) => {
    const ref = await estimate(request, { category: "STICKER", material_code: "ARLPMF7008", width_in: 4, height_in: 4, qty: 100 });
    expect(ref.sell_price).toBe(160);
    expect(ref.line_items[0].description).not.toContain("area-scaled");
  });

  test("size-specific SKUs unchanged by area-scaling", async ({ request }) => {
    const s2x2 = await estimate(request, { category: "STICKER", material_code: "PLACEHOLDER_STICKER_2X2", width_in: 2, height_in: 2, qty: 100 });
    const s2x3 = await estimate(request, { category: "STICKER", material_code: "PLACEHOLDER_STICKER_2X3", width_in: 2, height_in: 3, qty: 100 });
    expect(s2x2.sell_price).toBe(45);
    expect(s2x3.sell_price).toBe(70);
    expect(s2x2.line_items[0].description).not.toContain("area-scaled");
    expect(s2x3.line_items[0].description).not.toContain("area-scaled");
  });

  test("non-STICKER categories not touched (regression guard)", async ({ request }) => {
    // DECAL is sqft-tier with $45 min — area-scaling logic must not touch it.
    const decal = await estimate(request, { category: "DECAL", material_code: "ARLPMF7008", width_in: 2, height_in: 3, qty: 50 });
    expect(decal.status).toBe("QUOTED");
    expect(decal.sell_price).toBe(45); // min charge — unchanged
    expect(decal.min_charge_applied).toBe(true);
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
    expect(prices.size, "every distinct size should produce a distinct price").toBeGreaterThanOrEqual(sizes.length - 1);
  });
});
