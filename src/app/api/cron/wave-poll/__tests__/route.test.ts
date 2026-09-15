import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  getWaveInvoicePaymentSnapshot: vi.fn(),
  reconcileWaveInvoicePaymentSnapshot: vi.fn(),
  recoverProvisionalOrderWaveInvoice: vi.fn(),
  recordCronRun: vi.fn(),
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock("@/lib/wave/payments", () => ({
  getWaveInvoicePaymentSnapshot: mocks.getWaveInvoicePaymentSnapshot,
  reconcileWaveInvoicePaymentSnapshot: mocks.reconcileWaveInvoicePaymentSnapshot,
}));
vi.mock("@/lib/payment/quote-wave", () => ({
  recoverProvisionalOrderWaveInvoice: mocks.recoverProvisionalOrderWaveInvoice,
}));
vi.mock("@/lib/cron/heartbeat", () => ({ recordCronRun: mocks.recordCronRun }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.recordAuditEvent }));

import { GET } from "../route";

function request(secret = "cron-secret") {
  return new NextRequest("https://truecolorprinting.ca/api/cron/wave-poll", {
    headers: { Authorization: `Bearer ${secret}` },
  });
}

function database(orders = [{
    id: "order-1",
    order_number: "TC-1",
    wave_invoice_id: "invoice-1",
    wave_invoice_approved_at: null,
    wave_payment_recorded_at: null,
    quote_wave_state: "ambiguous",
    quote_wave_reservation_id: "reservation-1",
    status: "pending_payment",
  }]) {
  const chain = {
    select: vi.fn(),
    gte: vi.fn(),
    not: vi.fn(),
    or: vi.fn().mockResolvedValue({ data: orders, error: null }),
  };
  chain.select.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.not.mockReturnValue(chain);
  return { from: vi.fn().mockReturnValue(chain), chain };
}

describe("Wave poll verified recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.recordCronRun.mockResolvedValue(undefined);
    mocks.recoverProvisionalOrderWaveInvoice.mockResolvedValue({ action: "ready", invoiceId: "invoice-1" });
    mocks.getWaveInvoicePaymentSnapshot.mockResolvedValue({
      id: "invoice-1",
      invoiceNumber: "4001",
      status: "DRAFT",
    });
    mocks.reconcileWaveInvoicePaymentSnapshot.mockResolvedValue({
      verifiedPayments: [{ paymentId: "payment-1" }],
      ignoredPayments: 1,
      acceptances: [{ outcome: "transitioned" }],
    });
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.restoreAllMocks();
  });

  it("recovers the retained invoice and suppresses customer effects during polling", async () => {
    const db = database();
    mocks.createServiceClient.mockReturnValue(db);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(mocks.recoverProvisionalOrderWaveInvoice).toHaveBeenCalledWith(db, "order-1");
    expect(mocks.reconcileWaveInvoicePaymentSnapshot).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ id: "invoice-1" }),
      { enqueueCustomerEffects: false, enqueueStaffEffect: true },
    );
    expect(await response.json()).toMatchObject({
      approved_recovered: 1,
      provider_payments_accepted: 1,
      manual_payments_ignored: 1,
      customer_effects_suppressed: true,
    });
  });

  it("rejects a forged cron request before database or provider access", async () => {
    const response = await GET(request("wrong"));
    expect(response.status).toBe(401);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(mocks.getWaveInvoicePaymentSnapshot).not.toHaveBeenCalled();
  });

  it("does not mark an invoice recovered without the guarded provisional transition", async () => {
    const unverified = {
      id: "order-unverified",
      order_number: "TC-UNVERIFIED",
      wave_invoice_id: "invoice-unverified",
      wave_invoice_approved_at: null,
      wave_payment_recorded_at: null,
      quote_wave_state: "failed",
      quote_wave_reservation_id: "reservation-unverified",
      status: "pending_payment",
    };
    const db = database([unverified]);
    mocks.createServiceClient.mockReturnValue(db);
    mocks.getWaveInvoicePaymentSnapshot.mockResolvedValue({
      id: "invoice-unverified",
      invoiceNumber: "4002",
      status: "SENT",
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, approved_recovered: 0 });
    expect(mocks.recoverProvisionalOrderWaveInvoice).not.toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("reports an unhealthy run when one of several orders fails", async () => {
    const first = {
      id: "order-1",
      order_number: "TC-1",
      wave_invoice_id: "invoice-1",
      wave_invoice_approved_at: "2026-09-15T12:00:00.000Z",
      wave_payment_recorded_at: null,
      quote_wave_state: "ready",
      quote_wave_reservation_id: "reservation-1",
      status: "pending_payment",
    };
    const second = { ...first, id: "order-2", order_number: "TC-2", wave_invoice_id: "invoice-2" };
    const third = { ...first, id: "order-3", order_number: "TC-3", wave_invoice_id: "invoice-3" };
    const db = database([first, second, third]);
    mocks.createServiceClient.mockReturnValue(db);
    mocks.getWaveInvoicePaymentSnapshot.mockImplementation(async (invoiceId: string) => {
      if (invoiceId === "invoice-2") throw new Error("provider payload with private details");
      return { id: invoiceId, invoiceNumber: "4001", status: "SENT" };
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: false, scanned: 3, wave_errors: 1 });
    expect(mocks.recordCronRun).toHaveBeenLastCalledWith(
      "wave-poll",
      false,
      expect.stringContaining("errors=1"),
    );
    expect(console.error).toHaveBeenCalledWith(
      "[wave-poll] Wave reconciliation failed",
      { order_id: "order-2", error_type: "Error" },
    );
    expect(JSON.stringify(mocks.recordCronRun.mock.calls)).not.toContain("private details");
  });
});
