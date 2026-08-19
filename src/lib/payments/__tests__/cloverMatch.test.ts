import { describe, expect, it } from "vitest";
import { selectCloverMatch, describeMatchPool, type MatchCandidate } from "../cloverMatch";

const ORDER = {
  orderNumber: "TC-2026-0322",
  orderId: "ord-uuid-1",
  totalCents: 12765,
  createdMs: Date.parse("2026-08-10T20:30:00Z"),
};

function pay(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return { id: "pay-1", amountCents: 12765, paidMs: Date.parse("2026-08-10T20:43:00Z"), strong: false, ...overrides };
}

describe("selectCloverMatch", () => {
  it("strong single match wins (order number in Clover payload)", () => {
    const sel = selectCloverMatch(ORDER, [
      pay({ id: "a", strong: true }),
      pay({ id: "b", strong: false }),
    ], 2);
    expect(sel).toEqual({ paymentId: "a", reason: "order_number_or_uuid" });
  });

  it("unique amount match accepted when it is the only same-total pending order", () => {
    const sel = selectCloverMatch(ORDER, [pay({ id: "solo" })], 1);
    expect(sel).toEqual({ paymentId: "solo", reason: "unique_amount_after_checkout" });
  });

  it("unique amount match REJECTED when another pending order shares the total (Aliah/TC-0322 trap)", () => {
    const sel = selectCloverMatch(ORDER, [pay({ id: "solo" })], 2);
    expect(sel).toBeNull();
  });

  it("two amount matches with no strong signal → ambiguous (null)", () => {
    const sel = selectCloverMatch(ORDER, [pay({ id: "a" }), pay({ id: "b" })], 1);
    expect(sel).toBeNull();
  });

  it("two strong matches → ambiguous (null)", () => {
    const sel = selectCloverMatch(ORDER, [pay({ id: "a", strong: true }), pay({ id: "b", strong: true })], 1);
    expect(sel).toBeNull();
  });

  it("amount mismatch → null even if same-ish", () => {
    const sel = selectCloverMatch(ORDER, [pay({ amountCents: 12764 })], 1);
    expect(sel).toBeNull();
  });

  it("payment before order creation (beyond skew) → null", () => {
    const sel = selectCloverMatch(ORDER, [pay({ paidMs: ORDER.createdMs - 10 * 60 * 1000 })], 1);
    expect(sel).toBeNull();
  });

  it("payment within clock-skew window still eligible", () => {
    const sel = selectCloverMatch(ORDER, [pay({ paidMs: ORDER.createdMs - 4 * 60 * 1000 })], 1);
    expect(sel?.reason).toBe("unique_amount_after_checkout");
  });

  it("no candidates → null", () => {
    expect(selectCloverMatch(ORDER, [], 1)).toBeNull();
  });
});

describe("describeMatchPool", () => {
  it("0 matches", () => {
    expect(describeMatchPool(0)).toBe("no successful matching Clover payment found");
  });
  it("2 matches", () => {
    expect(describeMatchPool(2)).toContain("ambiguous");
  });
});
