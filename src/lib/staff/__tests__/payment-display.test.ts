import { expect, it } from "vitest";
import { actualPaymentLabel } from "../payment-display";
it("uses counted actual providers, not intended payment method or pending evidence", () => {
  expect(actualPaymentLabel([{ method: "wave", amount: 25, status: "recorded" }, { method: "clover", amount: 25, status: "pending" }])).toBe("Paid via Wave");
  expect(actualPaymentLabel([{ method: "clover", amount: 25, status: "recorded" }, { method: "etransfer", amount: 10, status: "recorded" }])).toBe("Paid via Clover + e-Transfer");
  expect(actualPaymentLabel([{ method: "wave", amount: 25, status: "recorded" }], 100)).toBe("Partial payment via Wave");
  expect(actualPaymentLabel([])).toBeNull();
});
