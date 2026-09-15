import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
vi.mock("../client", () => ({
  waveQuery: query,
  WAVE_BUSINESS_ID: "business",
  WAVE_GST_TAX_ID: "gst",
  WAVE_PST_TAX_ID: "pst",
  WAVE_PRINT_PRODUCT_ID: "print",
}));

import {
  getWaveInvoicePaymentSnapshot,
  parseWavePaymentAmount,
  reconcileWaveInvoicePaymentSnapshot,
  verifiedWaveProviderPayments,
  type WaveInvoicePaymentSnapshot,
} from "../payments";

function snapshot(payments: WaveInvoicePaymentSnapshot["payments"]): WaveInvoicePaymentSnapshot {
  return {
    id: "invoice-1",
    invoiceNumber: "4001",
    status: "PAID",
    modifiedAt: "2026-09-15T12:30:00.000Z",
    currency: { code: "CAD" },
    total: { minorUnitValue: "135975" },
    amountPaid: { minorUnitValue: "135975" },
    amountDue: { minorUnitValue: "0" },
    payments,
  };
}

const customerPayment = {
  id: "wave-payment-1",
  amount: "1359.75",
  paymentDate: "2026-09-15",
  createdAt: "2026-09-15T12:30:00.000Z",
  paymentMethod: "CREDIT_CARD",
  origin: "CUSTOMER",
  state: "PAID",
  paymentProvider: "WPP",
  transactionType: "SALE",
  memo: null,
  account: { id: "account-1", name: "Wave Payments" },
};

describe("Wave provider payment readback", () => {
  beforeEach(() => query.mockReset());

  it("reads documented invoice Money units and payment identity fields", async () => {
    query.mockResolvedValue({ business: { invoice: snapshot([customerPayment]) } });
    await expect(getWaveInvoicePaymentSnapshot("invoice-1")).resolves.toMatchObject({
      total: { minorUnitValue: "135975" },
      payments: [{ id: "wave-payment-1", amount: "1359.75", paymentProvider: "WPP" }],
    });
    const graphql = String(query.mock.calls[0][0]);
    expect(graphql).toContain("amount\n");
    expect(graphql).toContain("total { minorUnitValue }");
    expect(graphql).toContain("origin");
    expect(graphql).toContain("transactionType");
  });

  it("accepts an overpaid invoice snapshot only when amount due is zero", async () => {
    query.mockResolvedValue({ business: { invoice: {
      ...snapshot([customerPayment]),
      amountPaid: { minorUnitValue: "136000" },
      amountDue: { minorUnitValue: "0" },
    } } });
    await expect(getWaveInvoicePaymentSnapshot("invoice-1")).resolves.toMatchObject({
      amountPaid: { minorUnitValue: "136000" },
      amountDue: { minorUnitValue: "0" },
    });
  });

  it.each([
    ["1", 100],
    ["1.2", 120],
    ["1225.00", 122500],
    ["1359.75", 135975],
  ])("parses exact provider payment amount %s", (value, expected) => {
    expect(parseWavePaymentAmount(value)).toBe(expected);
  });

  it.each(["1,225.00", "1.001", "-1.00", "0", "01.00", "1e3", ""])(
    "rejects malformed or fractional payment amount %s",
    (value) => expect(() => parseWavePaymentAmount(value)).toThrow(),
  );

  it("selects customer Wave Payments captures and ignores manual bookkeeping", () => {
    const manual = {
      ...customerPayment,
      id: "manual-copy",
      origin: "BUSINESS",
      paymentProvider: "MANUAL",
    };
    expect(verifiedWaveProviderPayments(snapshot([manual, customerPayment]))).toEqual([
      expect.objectContaining({
        paymentId: "wave-payment-1",
        amountCents: 135975,
        origin: "CUSTOMER",
        paymentProvider: "WPP",
        transactionType: "SALE",
      }),
    ]);
  });

  it("passes exact provider evidence and explicit effect policy to the atomic RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        outcome: "transitioned",
        order_id: "order-1",
        order_number: "TC-1",
        source_payment_method: "clover_card",
        actual_payment_provider: "wave_payments",
        payment_transitioned: true,
        amount_paid_cents: 135975,
        balance_due_cents: 0,
        effects_pending: 4,
      }],
      error: null,
    });
    const result = await reconcileWaveInvoicePaymentSnapshot(
      { rpc } as never,
      snapshot([customerPayment]),
      { enqueueCustomerEffects: false, enqueueStaffEffect: true },
    );

    expect(rpc).toHaveBeenCalledWith("accept_wave_provider_payment", {
      p_wave_invoice_id: "invoice-1",
      p_wave_payment_id: "wave-payment-1",
      p_amount_cents: 135975,
      p_paid_at: "2026-09-15T12:30:00.000Z",
      p_payment_method: "CREDIT_CARD",
      p_origin: "CUSTOMER",
      p_state: "PAID",
      p_payment_provider: "WPP",
      p_transaction_type: "SALE",
      p_enqueue_customer_effects: false,
      p_enqueue_staff_effect: true,
    });
    expect(result.acceptances[0]).toMatchObject({
      source_payment_method: "clover_card",
      actual_payment_provider: "wave_payments",
    });
  });

  it("does not call the ledger RPC for manual Wave bookkeeping", async () => {
    const rpc = vi.fn();
    const result = await reconcileWaveInvoicePaymentSnapshot(
      { rpc } as never,
      snapshot([{ ...customerPayment, origin: "BUSINESS", paymentProvider: "MANUAL" }]),
      { enqueueCustomerEffects: false, enqueueStaffEffect: false },
    );
    expect(result).toMatchObject({ verifiedPayments: [], ignoredPayments: 1, acceptances: [] });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed on a conflicting provider payment ledger result", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ outcome: "ledger_conflict", order_id: "order-1" }],
      error: null,
    });
    await expect(reconcileWaveInvoicePaymentSnapshot(
      { rpc } as never,
      snapshot([customerPayment]),
      { enqueueCustomerEffects: true, enqueueStaffEffect: true },
    )).rejects.toThrow("conflicts with the local ledger");
  });
});
