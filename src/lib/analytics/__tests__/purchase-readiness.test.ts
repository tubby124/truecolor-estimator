import { describe, expect, it } from "vitest";
import { shouldTrackConfirmedPurchase } from "../purchase-readiness";

describe("shouldTrackConfirmedPurchase", () => {
  it.each(["payment_received", "in_production", "ready_for_pickup", "complete"])(
    "accepts %s only with affirmative paid evidence",
    (status) => {
      expect(shouldTrackConfirmedPurchase({ status, paidAt: "2026-07-15T20:00:00.000Z" })).toBe(true);
      expect(shouldTrackConfirmedPurchase({ status, paidAt: null })).toBe(false);
    },
  );

  it.each(["pending_payment", "cancelled", "refunded", "", null])(
    "rejects non-paid lifecycle status %s even when paid_at exists",
    (status) => {
      expect(shouldTrackConfirmedPurchase({ status, paidAt: "2026-07-15T20:00:00.000Z" })).toBe(false);
    },
  );

  it("rejects blank or invalid paid_at values", () => {
    expect(shouldTrackConfirmedPurchase({ status: "complete", paidAt: " " })).toBe(false);
    expect(shouldTrackConfirmedPurchase({ status: "complete", paidAt: "not-a-date" })).toBe(false);
  });
});
