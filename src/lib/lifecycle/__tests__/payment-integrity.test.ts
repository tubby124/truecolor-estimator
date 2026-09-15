import { expect, it } from "vitest";
import { countPendingPaymentConflicts } from "../payment-integrity";
it("flags provider-paid markers and fully covered ledgers while allowing partial and refunded payments", () => {
  expect(countPendingPaymentConflicts([
    { total: 100, wave_payment_recorded_at: "2026-01-01", order_payments: [] },
    { total: 100, wave_payment_recorded_at: null, order_payments: [{ amount: 100, method: "clover", status: "recorded" }] },
    { total: 100, wave_payment_recorded_at: null, order_payments: [{ amount: 30, method: "wave", status: "recorded" }] },
    { total: 100, wave_payment_recorded_at: null, order_payments: [{ amount: 100, method: "clover", status: "refunded" }] },
  ])).toBe(2);
});
