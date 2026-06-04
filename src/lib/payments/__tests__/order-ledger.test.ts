import { describe, expect, it } from "vitest";
import {
  nextPaymentAmount,
  shouldMarkOrderPaid,
  summarizeOrderPayments,
  type OrderPaymentLedgerEntry,
} from "../order-ledger";

describe("order payment ledger", () => {
  it("keeps an untouched order unpaid", () => {
    const summary = summarizeOrderPayments(125, []);

    expect(summary).toEqual({
      orderTotal: 125,
      amountPaid: 0,
      balanceDue: 125,
      overpaidAmount: 0,
      status: "unpaid",
      countedPayments: 0,
    });
    expect(shouldMarkOrderPaid(summary)).toBe(false);
  });

  it("derives partial status and balance for split payments", () => {
    const payments: OrderPaymentLedgerEntry[] = [
      { amount: 50, method: "etransfer", externalReference: "EMT-1" },
      { amount: 25.25, method: "cash" },
    ];

    const summary = summarizeOrderPayments(125, payments);

    expect(summary.amountPaid).toBe(75.25);
    expect(summary.balanceDue).toBe(49.75);
    expect(summary.status).toBe("partial");
    expect(nextPaymentAmount(125, payments)).toBe(49.75);
    expect(shouldMarkOrderPaid(summary)).toBe(false);
  });

  it("marks paid only when counted payments exactly cover the order", () => {
    const summary = summarizeOrderPayments(125, [
      { amount: 50, method: "etransfer" },
      { amount: 75, method: "clover", externalReference: "CLOVER-1" },
    ]);

    expect(summary.amountPaid).toBe(125);
    expect(summary.balanceDue).toBe(0);
    expect(summary.overpaidAmount).toBe(0);
    expect(summary.status).toBe("paid");
    expect(shouldMarkOrderPaid(summary)).toBe(true);
  });

  it("flags overpayments instead of silently treating them as normal paid", () => {
    const summary = summarizeOrderPayments(125, [
      { amount: 100, method: "etransfer" },
      { amount: 50, method: "clover" },
    ]);

    expect(summary.amountPaid).toBe(150);
    expect(summary.balanceDue).toBe(0);
    expect(summary.overpaidAmount).toBe(25);
    expect(summary.status).toBe("overpaid");
    expect(shouldMarkOrderPaid(summary)).toBe(false);
  });

  it("ignores voided, refunded, zero, and negative rows", () => {
    const summary = summarizeOrderPayments(125, [
      { amount: 100, method: "etransfer", status: "voided" },
      { amount: 20, method: "cash", status: "refunded" },
      { amount: 0, method: "cash" },
      { amount: -15, method: "other" },
      { amount: 40, method: "clover", status: "recorded" },
    ]);

    expect(summary.amountPaid).toBe(40);
    expect(summary.balanceDue).toBe(85);
    expect(summary.countedPayments).toBe(1);
    expect(summary.status).toBe("partial");
  });

  it("keeps payer identity attached to split rows without changing balance math", () => {
    const payments: OrderPaymentLedgerEntry[] = [
      {
        amount: 62.5,
        method: "etransfer",
        payer: { company: "Company A", email: "ap@company-a.test" },
      },
      {
        amount: 62.5,
        method: "clover",
        payer: { company: "Company B", email: "ap@company-b.test" },
      },
    ];

    const summary = summarizeOrderPayments(125, payments);

    expect(summary.status).toBe("paid");
    expect(summary.countedPayments).toBe(2);
    expect(payments.map((payment) => payment.payer?.company)).toEqual(["Company A", "Company B"]);
  });

  it("rounds cents safely for real checkout math", () => {
    const summary = summarizeOrderPayments(100.01, [
      { amount: 33.335, method: "cash" },
      { amount: 66.675, method: "etransfer" },
    ]);

    expect(summary.amountPaid).toBe(100.02);
    expect(summary.overpaidAmount).toBe(0.01);
    expect(summary.status).toBe("overpaid");
  });
});
