import { describe, expect, it } from "vitest";
import {
  nextPaymentAmount,
  remainingBalanceCents,
  summarizeOrderPayments,
  type OrderPaymentLedgerEntry,
} from "../order-ledger";

const recorded = (amount: number): OrderPaymentLedgerEntry => ({
  amount,
  method: "clover",
  status: "recorded",
});

describe("remainingBalanceCents", () => {
  it("returns the full total in cents when nothing is paid", () => {
    expect(remainingBalanceCents(245.55, [])).toBe(24555);
  });

  it("subtracts counted partial payments", () => {
    expect(remainingBalanceCents(245.55, [recorded(100), recorded(45.55)])).toBe(10000);
  });

  it("ignores voided and refunded ledger rows", () => {
    const ledger: OrderPaymentLedgerEntry[] = [
      recorded(100),
      { ...recorded(50), status: "voided" },
      { ...recorded(25), status: "refunded" },
    ];
    expect(remainingBalanceCents(245.55, ledger)).toBe(14555);
  });

  it("floors at zero when the ledger overpays", () => {
    expect(remainingBalanceCents(100, [recorded(150)])).toBe(0);
  });

  it("stays exact on amounts that are lossy in binary floating point", () => {
    // 0.3 - 0.1 === 0.19999999999999998 in IEEE-754 doubles.
    expect(remainingBalanceCents(0.3, [recorded(0.1)])).toBe(20);
  });

  it("agrees with the dollars-based balance the rest of the app reads", () => {
    const ledger = [recorded(0.05), recorded(12.34)];
    expect(remainingBalanceCents(245.55, ledger)).toBe(
      Math.round(nextPaymentAmount(245.55, ledger) * 100)
    );
    expect(summarizeOrderPayments(245.55, ledger).balanceDue).toBe(233.16);
  });
});
