import { describe, expect, it } from "vitest";
import { decideSplitPaymentAccounting } from "../payment-accounting-decision";
import type { OrderPaymentLedgerEntry } from "../order-ledger";

type LedgerRow = OrderPaymentLedgerEntry & {
  id: string;
  waveRecordedAt?: string | null;
};

describe("split payment accounting decision", () => {
  it("keeps the order pending after first partial payment but records that row to Wave", () => {
    const payments: LedgerRow[] = [
      {
        id: "pay-a",
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A" },
        waveRecordedAt: null,
      },
    ];

    const decision = decideSplitPaymentAccounting({
      orderTotal: 1000,
      payments,
      hasWaveInvoice: true,
      waveInvoiceApproved: false,
    });

    expect(decision.derivedStatus).toBe("partial");
    expect(decision.markOrderPaid).toBe(false);
    expect(decision.sendPaidReceipt).toBe(false);
    expect(decision.approveWaveInvoice).toBe(true);
    expect(decision.wavePaymentsToRecord.map((payment) => payment.id)).toEqual(["pay-a"]);
    expect(decision.setOrderWavePaymentRecordedAt).toBe(false);
  });

  it("marks the order paid only when split rows cover the full total", () => {
    const payments: LedgerRow[] = [
      {
        id: "pay-a",
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A" },
        waveRecordedAt: "2026-06-03T20:00:00.000Z",
      },
      {
        id: "pay-b",
        amount: 500,
        method: "clover",
        payer: { company: "Company B" },
        waveRecordedAt: null,
      },
    ];

    const decision = decideSplitPaymentAccounting({
      orderTotal: 1000,
      payments,
      hasWaveInvoice: true,
      waveInvoiceApproved: true,
    });

    expect(decision.derivedStatus).toBe("paid");
    expect(decision.markOrderPaid).toBe(true);
    expect(decision.sendPaidReceipt).toBe(true);
    expect(decision.approveWaveInvoice).toBe(false);
    expect(decision.wavePaymentsToRecord.map((payment) => payment.id)).toEqual(["pay-b"]);
    expect(decision.setOrderWavePaymentRecordedAt).toBe(false);
  });

  it("sets the order-level Wave recorded flag only when full total is paid and every counted row is already in Wave", () => {
    const decision = decideSplitPaymentAccounting({
      orderTotal: 1000,
      payments: [
        {
          id: "pay-a",
          amount: 500,
          method: "etransfer",
          payer: { company: "Company A" },
          waveRecordedAt: "2026-06-03T20:00:00.000Z",
        },
        {
          id: "pay-b",
          amount: 500,
          method: "clover",
          payer: { company: "Company B" },
          waveRecordedAt: "2026-06-03T20:05:00.000Z",
        },
      ],
      hasWaveInvoice: true,
      waveInvoiceApproved: true,
    });

    expect(decision.derivedStatus).toBe("paid");
    expect(decision.wavePaymentsToRecord).toEqual([]);
    expect(decision.setOrderWavePaymentRecordedAt).toBe(true);
  });

  it("blocks overpaid orders from being marked paid automatically", () => {
    const decision = decideSplitPaymentAccounting({
      orderTotal: 1000,
      payments: [
        { id: "pay-a", amount: 700, method: "cash", payer: { company: "Company A" } },
        { id: "pay-b", amount: 400, method: "clover", payer: { company: "Company B" } },
      ],
      hasWaveInvoice: true,
      waveInvoiceApproved: true,
    });

    expect(decision.derivedStatus).toBe("overpaid");
    expect(decision.markOrderPaid).toBe(false);
    expect(decision.sendPaidReceipt).toBe(false);
    expect(decision.needsReview).toBe(true);
    expect(decision.reason).toContain("overpaid");
  });
});
