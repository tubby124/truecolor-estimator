import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  preflight: vi.fn(),
  snapshot: vi.fn(),
  fetchLedger: vi.fn(),
}));

vi.mock("@/lib/payment/wave-click-preflight", () => ({ preflightWaveBeforeCloverCheckout: mocks.preflight }));
vi.mock("@/lib/wave/invoice", () => ({ getWaveOnlineInvoiceSnapshot: mocks.snapshot }));
vi.mock("@/lib/orders/payLink", () => ({
  fetchOrderLedger: mocks.fetchLedger,
  remainingBalanceCents: (total: number, ledger: Array<{ amount: number }>) =>
    Math.round(total * 100) - ledger.reduce((sum, row) => sum + Math.round(row.amount * 100), 0),
}));

import { resolveWaveOnlineCheckout } from "../wave-online-checkout";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const INVOICE_ID = "wave-invoice-1";

function order(overrides: Record<string, unknown> = {}) {
  return {
    total: 111,
    subtotal: 100,
    gst: 5,
    pst: 6,
    status: "pending_payment",
    voided_at: null,
    paid_at: null,
    wave_payment_recorded_at: null,
    is_archived: false,
    wave_invoice_id: INVOICE_ID,
    wave_invoice_approved_at: "2026-09-15T00:00:00.000Z",
    quote_wave_state: "ready",
    quote_checkout_state: "failed",
    quote_checkout_expires_at: "2026-09-15T00:00:00.000Z",
    quote_checkout_url: null,
    customers: { email: "buyer@example.test" },
    ...overrides,
  };
}

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: INVOICE_ID,
    invoiceNumber: "123",
    status: "SAVED",
    viewUrl: "https://invoice.waveapps.com/customer/invoice-token",
    customerEmail: "buyer@example.test",
    subtotalCents: 10_000,
    gstCents: 500,
    pstCents: 600,
    totalCents: 11_100,
    amountDueCents: 11_100,
    amountPaidCents: 0,
    disableCreditCardPayments: false,
    disableBankPayments: false,
    ...overrides,
  };
}

function client(first = order(), second = first) {
  const maybeSingle = vi.fn()
    .mockResolvedValueOnce({ data: first, error: null })
    .mockResolvedValueOnce({ data: second, error: null });
  return {
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })),
  } as never;
}

describe("Wave online checkout resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchLedger.mockResolvedValue([]);
    mocks.preflight.mockResolvedValue({ action: "ready", isPartialBalance: false });
    mocks.snapshot.mockResolvedValue(snapshot());
  });

  it("returns the verified Wave URL and never needs a Clover session", async () => {
    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).resolves.toEqual({
      action: "ready",
      checkoutUrl: "https://invoice.waveapps.com/customer/invoice-token",
      invoiceId: INVOICE_ID,
      invoiceNumber: "123",
      amountDueCents: 11_100,
      isPartialBalance: false,
    });
  });

  it.each(["SENT", "VIEWED"])('keeps a Wave invoice in the payable %s state usable', async (status) => {
    mocks.snapshot.mockResolvedValue(snapshot({ status }));

    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).resolves.toMatchObject({ action: "ready", invoiceNumber: "123" });
  });

  it.each(["already_paid", "updated_link"] as const)("preserves the %s preflight outcome", async (action) => {
    mocks.preflight.mockResolvedValue({ action });
    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).resolves.toEqual({ action });
    expect(mocks.snapshot).not.toHaveBeenCalled();
  });

  it("fails closed when an offline partial ledger is not reflected in Wave amount due", async () => {
    mocks.fetchLedger.mockResolvedValue([{ amount: 40, method: "clover", status: "recorded" }]);
    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 7_100,
    })).rejects.toThrow("Wave amount due differs");
  });

  it("permits a partial balance only when Wave and the local ledger agree", async () => {
    mocks.fetchLedger.mockResolvedValue([{ amount: 40, method: "wave", status: "recorded" }]);
    mocks.snapshot.mockResolvedValue(snapshot({ amountPaidCents: 4_000, amountDueCents: 7_100, status: "PARTIAL" }));
    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 7_100,
    })).resolves.toMatchObject({ action: "ready", amountDueCents: 7_100, isPartialBalance: true });
  });

  it("blocks an unexpired or ambiguous earlier Clover checkout without guessing a cancellation API", async () => {
    const active = order({
      quote_checkout_state: "ready",
      quote_checkout_url: "https://checkout.clover.com/old",
      quote_checkout_expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    await expect(resolveWaveOnlineCheckout(client(active), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).rejects.toThrow("Clover checkout may still be active");
  });

  it("does not let an expired historical Clover state block Wave", async () => {
    const expired = order({
      quote_checkout_state: "ready",
      quote_checkout_url: "https://checkout.clover.com/old",
      quote_checkout_expires_at: "2020-01-01T00:00:00.000Z",
    });
    await expect(resolveWaveOnlineCheckout(client(expired), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).resolves.toMatchObject({ action: "ready" });
  });

  it.each([
    [snapshot({ totalCents: 11_101 }), "financials differ"],
    [snapshot({ customerEmail: "other@example.test" }), "customer differs"],
    [snapshot({ disableCreditCardPayments: true, disableBankPayments: true }), "online payments are disabled"],
    [snapshot({ viewUrl: "https://waveapps.com.evil.test/invoice" }), "untrusted"],
  ])("rejects unsafe provider state", async (provider, message) => {
    mocks.snapshot.mockResolvedValue(provider);
    await expect(resolveWaveOnlineCheckout(client(), {
      orderId: ORDER_ID,
      requestedAmountCents: 11_100,
    })).rejects.toThrow(message);
  });
});
