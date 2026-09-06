import { describe, expect, it } from "vitest";
import { compareReviewedCheckoutTotal } from "../revalidate";
describe("reviewed checkout cents comparison", () => {
  it("accepts an identical final amount", () => expect(compareReviewedCheckoutTotal(2775, 2775)).toEqual({ ok: true }));
  it("requires review for a one-cent change in either direction", () => {
    expect(compareReviewedCheckoutTotal(2774, 2775)).toMatchObject({ ok: false, status: 409 });
    expect(compareReviewedCheckoutTotal(2776, 2775)).toMatchObject({ ok: false, status: 409 });
  });
  it("fails closed for invalid authoritative math", () => expect(() => compareReviewedCheckoutTotal(1, Number.NaN)).toThrow());
});
