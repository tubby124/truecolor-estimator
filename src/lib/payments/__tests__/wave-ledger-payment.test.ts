import { describe, expect, it } from "vitest";
import { buildWaveLedgerPaymentPlan } from "../wave-ledger-payment";

describe("Wave ledger payment planner", () => {
  it("builds safe Wave manual payment args for one split ledger row", () => {
    const plan = buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: "wave-inv-1",
      waveInvoiceApprovedAt: null,
      payment: {
        id: "pay-a",
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A", email: "ap@companya.ca" },
        externalReference: "bank-123",
      },
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.approveInvoiceFirst).toBe(true);
    expect(plan.recordPayment).toMatchObject({
      invoiceId: "wave-inv-1",
      amount: 500,
      method: "BANK_TRANSFER",
      note: "eTransfer — Company A — Order TC-1001 · Ref bank-123",
      externalId: "order-1:pay-a",
    });
    expect(plan.dbUpdate.wave_recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("maps Clover ledger rows to CREDIT_CARD without changing the full-payment Clover route", () => {
    const plan = buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: "wave-inv-1",
      waveInvoiceApprovedAt: "2026-06-03T20:00:00.000Z",
      payment: {
        id: "pay-b",
        amount: 500,
        method: "clover",
        payer: { company: "Company B" },
      },
    });

    expect(plan.ok).toBe(true);
    if (!plan.ok) throw new Error(plan.error);
    expect(plan.approveInvoiceFirst).toBe(false);
    expect(plan.recordPayment.method).toBe("CREDIT_CARD");
    expect(plan.recordPayment.note).toBe("Clover — Company B — Order TC-1001");
  });

  it("refuses to record rows without a Wave invoice", () => {
    const plan = buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: null,
      payment: { id: "pay-a", amount: 500, method: "cash", payer: { company: "Company A" } },
    });

    expect(plan).toEqual({ ok: false, error: "Order has no Wave invoice ID" });
  });

  it("refuses duplicate Wave recording for the same ledger row", () => {
    const plan = buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: "wave-inv-1",
      payment: {
        id: "pay-a",
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A" },
        waveRecordedAt: "2026-06-03T20:00:00.000Z",
      },
    });

    expect(plan).toEqual({ ok: false, error: "Payment row is already recorded in Wave" });
  });

  it("refuses voided or refunded rows", () => {
    expect(buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: "wave-inv-1",
      payment: { id: "pay-a", amount: 500, method: "cash", status: "voided", payer: { company: "Company A" } },
    })).toEqual({ ok: false, error: "Voided/refunded payment rows must not be recorded in Wave" });
  });

  it("requires a persisted payment row id before Wave recording", () => {
    const plan = buildWaveLedgerPaymentPlan({
      orderId: "order-1",
      orderNumber: "TC-1001",
      waveInvoiceId: "wave-inv-1",
      payment: { amount: 500, method: "cash", payer: { company: "Company A" } },
    });

    expect(plan).toEqual({ ok: false, error: "Payment row ID is required before recording to Wave" });
  });
});
