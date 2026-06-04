import { describe, expect, it } from "vitest";
import { buildStaffLedgerPayment, mapOrderPaymentRow } from "../staff-payment-ledger";

describe("staff payment ledger helper", () => {
  it("builds a safe partial payment insert without marking the order paid", () => {
    const result = buildStaffLedgerPayment({
      orderId: "order-1",
      orderTotal: 1000,
      existingPayments: [],
      recordedBy: "staff@true-color.ca",
      body: {
        amount: 500,
        method: "etransfer",
        payer: { company: "Company A", email: "AP@CompanyA.ca" },
        externalReference: "etransfer-123",
        notes: "First half",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    expect(result.insert).toMatchObject({
      order_id: "order-1",
      amount: 500,
      currency: "CAD",
      method: "etransfer",
      status: "recorded",
      payer_company: "Company A",
      payer_email: "ap@companya.ca",
      external_reference: "etransfer-123",
      recorded_by: "staff@true-color.ca",
      notes: "First half",
    });
    expect(result.insert).not.toHaveProperty("wave_invoice_payment_id");
    expect(result.insert).not.toHaveProperty("wave_recorded_at");
    expect(result.nextSummary).toEqual({
      status: "partial",
      amountPaid: 500,
      balanceDue: 500,
      overpaidAmount: 0,
    });
  });

  it("marks derived status paid when the new row completes the total but leaves side effects to accounting code", () => {
    const result = buildStaffLedgerPayment({
      orderId: "order-1",
      orderTotal: 1000,
      existingPayments: [{ amount: 500, method: "etransfer", payer: { company: "Company A" } }],
      recordedBy: "staff@true-color.ca",
      body: {
        amount: "500",
        method: "clover",
        payer: { company: "Company B" },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.nextSummary.status).toBe("paid");
    expect(result.nextSummary.balanceDue).toBe(0);
  });

  it("requires payer identity so split payments do not become anonymous money blobs", () => {
    const result = buildStaffLedgerPayment({
      orderId: "order-1",
      orderTotal: 1000,
      existingPayments: [],
      recordedBy: "staff@true-color.ca",
      body: { amount: 500, method: "cash", payer: {} },
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Payer name, company, or email is required",
    });
  });

  it("blocks accidental overpayment unless staff explicitly allows review", () => {
    const blocked = buildStaffLedgerPayment({
      orderId: "order-1",
      orderTotal: 1000,
      existingPayments: [{ amount: 800, method: "etransfer", payer: { company: "Company A" } }],
      recordedBy: "staff@true-color.ca",
      body: { amount: 300, method: "clover", payer: { company: "Company B" } },
    });

    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected blocked overpayment");
    expect(blocked.status).toBe(409);
    expect(blocked.error).toContain("overpay");

    const allowed = buildStaffLedgerPayment({
      orderId: "order-1",
      orderTotal: 1000,
      existingPayments: [{ amount: 800, method: "etransfer", payer: { company: "Company A" } }],
      recordedBy: "staff@true-color.ca",
      body: { amount: 300, method: "clover", payer: { company: "Company B" }, allowOverpayment: true },
    });

    expect(allowed.ok).toBe(true);
    if (!allowed.ok) throw new Error(allowed.error);
    expect(allowed.nextSummary.status).toBe("overpaid");
    expect(allowed.warning).toContain("staff review");
  });

  it("maps database rows back into ledger entries including per-row Wave state", () => {
    expect(mapOrderPaymentRow({
      id: "pay-1",
      amount: "250.50",
      method: "etransfer",
      status: "recorded",
      payer_name: "Jane",
      payer_company: "Company A",
      payer_email: "jane@example.com",
      external_reference: "bank-ref",
      wave_recorded_at: "2026-06-03T20:00:00.000Z",
      recorded_at: "2026-06-03T19:59:00.000Z",
      notes: "deposit",
    })).toMatchObject({
      id: "pay-1",
      amount: 250.5,
      method: "etransfer",
      status: "recorded",
      payer: { name: "Jane", company: "Company A", email: "jane@example.com" },
      externalReference: "bank-ref",
      waveRecordedAt: "2026-06-03T20:00:00.000Z",
      recordedAt: "2026-06-03T19:59:00.000Z",
      notes: "deposit",
    });
  });
});
