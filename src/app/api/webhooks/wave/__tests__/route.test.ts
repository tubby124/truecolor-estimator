import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  processWavePaymentEffects: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}));

vi.mock("@/lib/payment/wave-payment-effects", () => ({
  processWavePaymentEffects: mocks.processWavePaymentEffects,
}));

import { POST } from "../route";

const SECRET = "wave-test-secret";
const WAVE_INVOICE_ID = "wave-invoice-123";

function signedRequest(signatureOverride?: string) {
  const body = JSON.stringify({
    data: {
      resourceType: "invoice",
      resource: {
        id: WAVE_INVOICE_ID,
        status: "paid",
      },
    },
  });
  const signature =
    signatureOverride ??
    `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;
  return new NextRequest("https://truecolorprinting.ca/api/webhooks/wave", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "x-wave-signature": signature,
    },
  });
}

function acceptance(
  outcome:
    | "transitioned"
    | "already_processed"
    | "not_wave_order"
    | "legacy_already_paid",
) {
  return {
    outcome,
    order_id: "order-123",
    order_number: "TC-0123",
    payment_transitioned: outcome === "transitioned",
    effects_pending:
      outcome === "not_wave_order" || outcome === "legacy_already_paid" ? 0 : 3,
  };
}

function createHarness(
  acceptances: Array<ReturnType<typeof acceptance>>,
  rpcError: { message: string } | null = null,
) {
  const webhookEvents: Array<Record<string, unknown>> = [];
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

  return {
    webhookEvents,
    rpcCalls,
    supabase: {
      async rpc(name: string, args: Record<string, unknown>) {
        rpcCalls.push({ name, args });
        if (rpcError) return { data: null, error: rpcError };
        return { data: [acceptances.shift()], error: null };
      },
      from(table: string) {
        if (table !== "webhook_events") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return {
          async insert(row: Record<string, unknown>) {
            webhookEvents.push(row);
            return { error: null };
          },
        };
      },
    },
  };
}

describe("Wave paid-invoice durable acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WAVE_WEBHOOK_SECRET = SECRET;
    mocks.processWavePaymentEffects.mockResolvedValue({
      claimed: 3,
      sent: 3,
      retried: 0,
      dead: 0,
    });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.WAVE_WEBHOOK_SECRET;
    vi.restoreAllMocks();
  });

  it("sends duplicate deliveries through the same atomic database boundary", async () => {
    const harness = createHarness([
      acceptance("transitioned"),
      acceptance("already_processed"),
    ]);
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const [first, duplicate] = await Promise.all([
      POST(signedRequest()),
      POST(signedRequest()),
    ]);

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(200);
    expect(harness.rpcCalls).toEqual([
      {
        name: "accept_wave_paid_invoice",
        args: { p_wave_invoice_id: WAVE_INVOICE_ID },
      },
      {
        name: "accept_wave_paid_invoice",
        args: { p_wave_invoice_id: WAVE_INVOICE_ID },
      },
    ]);
    expect(harness.webhookEvents).toHaveLength(2);
  });

  it("recovers after a crash immediately following the committed transition", async () => {
    const harness = createHarness([
      acceptance("transitioned"),
      acceptance("already_processed"),
    ]);
    mocks.createServiceClient.mockReturnValue(harness.supabase);
    mocks.processWavePaymentEffects
      .mockRejectedValueOnce(new Error("worker crashed"))
      .mockResolvedValueOnce({
        claimed: 3,
        sent: 3,
        retried: 0,
        dead: 0,
      });

    const transitionResponse = await POST(signedRequest());
    const replayResponse = await POST(signedRequest());

    expect(transitionResponse.status).toBe(200);
    expect(replayResponse.status).toBe(200);
    expect(mocks.processWavePaymentEffects).toHaveBeenCalledTimes(2);
    expect(mocks.processWavePaymentEffects).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderId: "order-123",
        maxJobs: 3,
      }),
    );
    expect(harness.webhookEvents.map((row) => row.detail)).toEqual([
      "order TC-0123 transitioned; durable effects=3",
      "order TC-0123 already_processed; durable effects=3",
    ]);
  });

  it("returns a retryable response when the atomic database transaction fails", async () => {
    const harness = createHarness([], { message: "database unavailable" });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(signedRequest());

    expect(response.status).toBe(503);
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
    expect(harness.webhookEvents).toContainEqual(
      expect.objectContaining({
        ok: false,
        detail: "atomic payment acceptance failed",
      }),
    );
  });

  it("does not run Wave customer effects for a non-Wave payment order", async () => {
    const harness = createHarness([acceptance("not_wave_order")]);
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
  });

  it("does not guess whether legacy paid-order effects were already delivered", async () => {
    const harness = createHarness([acceptance("legacy_already_paid")]);
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before accessing the database", async () => {
    const response = await POST(signedRequest("sha256=forged"));

    expect(response.status).toBe(401);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(mocks.processWavePaymentEffects).not.toHaveBeenCalled();
  });
});
