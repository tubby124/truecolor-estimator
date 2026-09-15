import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  processWavePaymentEffects: vi.fn(),
  reconcileWaveInvoicePayments: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock("@/lib/payment/wave-payment-effects", () => ({
  processWavePaymentEffects: mocks.processWavePaymentEffects,
}));
vi.mock("@/lib/wave/payments", () => ({
  reconcileWaveInvoicePayments: mocks.reconcileWaveInvoicePayments,
}));

import { POST } from "../route";

const SECRET = "wave-test-secret";
import { WAVE_BUSINESS_ID } from "@/lib/wave/client";
const RAW_BUSINESS_ID = Buffer.from(WAVE_BUSINESS_ID, "base64").toString().slice(9);
const INVOICE_ID = Buffer.from(`Business:${RAW_BUSINESS_ID};Invoice:123`).toString("base64");

function signedRequest(signatureOverride?: string, eventType = "invoice.paid", businessId = RAW_BUSINESS_ID) {
  const body = JSON.stringify({ event_id: "fixture-event", event_type: eventType, business_id: businessId, data: { invoice_id: "123", amount_paid: "111.00", currency_code: "CAD" } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signatureOverride ?? `t=${timestamp},v1=${createHmac("sha256", SECRET).update(`${timestamp}.${body}`).digest("hex")}`;
  return new NextRequest("https://truecolorprinting.ca/api/webhooks/wave", {
    method: "POST", body,
    headers: { "content-type": "application/json", "x-wave-signature": signature, "x-wave-timestamp": timestamp },
  });
}

function result(outcome = "transitioned", effectsPending = 4) {
  return {
    snapshot: { id: INVOICE_ID },
    verifiedPayments: [{ paymentId: "wave-payment-1" }],
    ignoredPayments: 1,
    acceptances: [{
      outcome,
      order_id: "order-123",
      order_number: "TC-0123",
      source_payment_method: "clover_card",
      actual_payment_provider: "wave_payments",
      payment_transitioned: outcome === "transitioned",
      amount_paid_cents: 11100,
      balance_due_cents: 0,
      effects_pending: effectsPending,
    }],
  };
}

function harness() {
  const webhookEvents: Record<string, unknown>[] = [];
  return {
    webhookEvents,
    supabase: {
      from(table: string) {
        if (table !== "webhook_events") throw new Error(`Unexpected table ${table}`);
        return { async insert(row: Record<string, unknown>) { webhookEvents.push(row); return { error: null }; } };
      },
    },
  };
}

describe("Wave paid-invoice verified readback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WAVE_WEBHOOK_SECRET = SECRET;
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.processWavePaymentEffects.mockResolvedValue({ claimed: 4, sent: 4, retried: 0, dead: 0 });
  });

  afterEach(() => {
    delete process.env.WAVE_WEBHOOK_SECRET;
    vi.restoreAllMocks();
  });

  it("uses the signed event only to trigger provider readback with normal live effects", async () => {
    const h = harness();
    mocks.createServiceClient.mockReturnValue(h.supabase);
    mocks.reconcileWaveInvoicePayments.mockResolvedValue(result());

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(mocks.reconcileWaveInvoicePayments).toHaveBeenCalledWith(h.supabase, INVOICE_ID, {
      enqueueCustomerEffects: true,
      enqueueStaffEffect: true,
    });
    expect(mocks.processWavePaymentEffects).toHaveBeenCalledWith({
      supabase: h.supabase,
      orderId: "order-123",
      maxJobs: 3,
    });
    expect(h.webhookEvents[0]).toEqual(expect.objectContaining({
      ok: true,
      detail: expect.stringContaining("provider=Wave Payments"),
    }));
  });

  it("replays duplicate deliveries through the same idempotent readback boundary", async () => {
    const h = harness();
    mocks.createServiceClient.mockReturnValue(h.supabase);
    mocks.reconcileWaveInvoicePayments
      .mockResolvedValueOnce(result("transitioned"))
      .mockResolvedValueOnce(result("already_processed"));
    const first = await POST(signedRequest());
    const duplicate = await POST(signedRequest());
    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    expect(mocks.reconcileWaveInvoicePayments).toHaveBeenCalledTimes(2);
  });

  it("acknowledges a manual-only paid invoice without touching the ledger or effects", async () => {
    const h = harness();
    mocks.createServiceClient.mockReturnValue(h.supabase);
    mocks.reconcileWaveInvoicePayments.mockResolvedValue({
      snapshot: { id: INVOICE_ID },
      verifiedPayments: [],
      ignoredPayments: 2,
      acceptances: [],
    });
    const response = await POST(signedRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ outcome: "no_verified_provider_payment" });
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
  });

  it("returns retryable 503 when provider readback or atomic acceptance fails", async () => {
    const h = harness();
    mocks.createServiceClient.mockReturnValue(h.supabase);
    mocks.reconcileWaveInvoicePayments.mockRejectedValue(new Error("ledger conflict"));
    const response = await POST(signedRequest());
    expect(response.status).toBe(503);
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
    expect(h.webhookEvents[0]).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects an invalid signature before database or provider access", async () => {
    const response = await POST(signedRequest("sha256=forged"));
    expect(response.status).toBe(401);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(mocks.reconcileWaveInvoicePayments).not.toHaveBeenCalled();
  });
  it.each(["invoice.partially_paid", "invoice.overpaid"])("reads provider truth for documented %s events", async type => {
    const h = harness(); mocks.createServiceClient.mockReturnValue(h.supabase); mocks.reconcileWaveInvoicePayments.mockResolvedValue(result("partial", 0));
    expect((await POST(signedRequest(undefined, type))).status).toBe(200);
    expect(mocks.reconcileWaveInvoicePayments).toHaveBeenCalledWith(h.supabase, INVOICE_ID, expect.any(Object));
  });
  it("rejects a correctly signed event for another business before provider access", async () => {
    expect((await POST(signedRequest(undefined, "invoice.paid", "other-business"))).status).toBe(400);
    expect(mocks.reconcileWaveInvoicePayments).not.toHaveBeenCalled();
  });

});
