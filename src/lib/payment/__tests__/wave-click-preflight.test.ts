import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reconcile: vi.fn(),
  fetchLedger: vi.fn(),
}));

vi.mock("@/lib/wave/payments", () => ({ reconcileWaveInvoicePayments: mocks.reconcile }));
vi.mock("@/lib/orders/payLink", () => ({
  fetchOrderLedger: mocks.fetchLedger,
  remainingBalanceCents: (total: number, ledger: Array<{ amount: number }>) => Math.round(total * 100) - ledger.reduce((sum, row) => sum + Math.round(row.amount * 100), 0),
}));

import { preflightWaveBeforeCloverCheckout } from "../wave-click-preflight";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "wave-invoice-1";

function order(overrides: Record<string, unknown> = {}) {
  return {
    total: 100,
    status: "pending_payment",
    voided_at: null,
    paid_at: null,
    wave_payment_recorded_at: null,
    is_archived: false,
    wave_invoice_id: INVOICE_ID,
    wave_invoice_approved_at: "2026-09-15T00:00:00.000Z",
    quote_wave_state: "ready",
    ...overrides,
  };
}

function client(result = order()) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }) })),
      })),
    })),
  } as never;
}

describe("Wave click-time Clover preflight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reconcile.mockResolvedValue({ verifiedPayments: [], ignoredPayments: 0, acceptances: [] });
    mocks.fetchLedger.mockResolvedValue([]);
  });

  it("stops a stale local link after a full Wave provider capture", async () => {
    mocks.reconcile.mockResolvedValue({ verifiedPayments: [{ paymentId: "wave-payment-1" }], acceptances: [{ outcome: "transitioned" }] });

    await expect(preflightWaveBeforeCloverCheckout(client(order({ status: "payment_received", paid_at: "2026-09-15T01:00:00.000Z" })), {
      orderId: ORDER_ID, waveInvoiceId: INVOICE_ID, requestedAmountCents: 10_000,
    })).resolves.toEqual({ action: "already_paid" });
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.anything(), INVOICE_ID, {
      enqueueCustomerEffects: false,
      enqueueStaffEffect: true,
    });
    expect(mocks.fetchLedger).not.toHaveBeenCalled();
  });

  it("stops a stale full-total link after a partial Wave provider capture", async () => {
    mocks.reconcile.mockResolvedValue({ verifiedPayments: [{ paymentId: "wave-payment-1" }], acceptances: [{ outcome: "partial" }] });
    mocks.fetchLedger.mockResolvedValue([{ amount: 40, method: "wave", status: "recorded" }]);

    await expect(preflightWaveBeforeCloverCheckout(client(), {
      orderId: ORDER_ID, waveInvoiceId: INVOICE_ID, requestedAmountCents: 10_000,
    })).resolves.toEqual({ action: "updated_link" });
  });

  it("ignores a manual Wave bookkeeping copy and permits an unchanged unpaid checkout", async () => {
    mocks.reconcile.mockResolvedValue({ verifiedPayments: [], ignoredPayments: 1, acceptances: [] });

    await expect(preflightWaveBeforeCloverCheckout(client(), {
      orderId: ORDER_ID, waveInvoiceId: INVOICE_ID, requestedAmountCents: 10_000,
    })).resolves.toEqual({ action: "ready", isPartialBalance: false });
  });

  it("fails closed when the provider read or atomic acceptance fails", async () => {
    mocks.reconcile.mockRejectedValue(new Error("Wave unavailable"));

    await expect(preflightWaveBeforeCloverCheckout(client(), {
      orderId: ORDER_ID, waveInvoiceId: INVOICE_ID, requestedAmountCents: 10_000,
    })).rejects.toThrow("Wave unavailable");
  });

  it("fails closed when the atomic acceptance reports an unsafe outcome", async () => {
    mocks.reconcile.mockResolvedValue({ verifiedPayments: [{ paymentId: "wave-payment-1" }], acceptances: [{ outcome: "not_found" }] });

    await expect(preflightWaveBeforeCloverCheckout(client(), {
      orderId: ORDER_ID, waveInvoiceId: INVOICE_ID, requestedAmountCents: 10_000,
    })).rejects.toThrow("acceptance did not complete");
  });
});
