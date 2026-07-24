import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  WavePaymentEffectJob,
  WavePaymentOrder,
} from "../wave-payment-effects";

const mocks = vi.hoisted(() => ({
  sendPaymentReceipt: vi.fn(),
  sendMeasurementProtocolEvent: vi.fn(),
  deriveClientIdFromCustomer: vi.fn((id: string) => `client:${id}`),
}));

vi.mock("@/lib/email/paymentReceipt", () => ({
  sendPaymentReceipt: mocks.sendPaymentReceipt,
}));

vi.mock("@/lib/analytics/measurementProtocol", () => ({
  sendMeasurementProtocolEvent: mocks.sendMeasurementProtocolEvent,
  deriveClientIdFromCustomer: mocks.deriveClientIdFromCustomer,
}));

import {
  performWavePaymentEffect,
  processWavePaymentEffects,
} from "../wave-payment-effects";

const ORDER: WavePaymentOrder = {
  id: "order-123",
  order_number: "TC-0123",
  customer_id: "customer-123",
  subtotal: 100,
  gst: 5,
  pst: 6,
  total: 111,
  is_rush: false,
  discount_code: null,
  discount_amount: null,
  created_at: "2026-07-24T12:00:00.000Z",
  paid_at: "2026-07-24T12:05:00.000Z",
  receipt_token: "receipt-token",
  customers: {
    email: "customer@example.com",
    name: "Test Customer",
    company: "Test Company",
  },
  order_items: [
    {
      product_name: "Coroplast Sign",
      qty: 2,
      width_in: 24,
      height_in: 36,
      sides: 1,
      line_total: 100,
    },
  ],
};

function job(
  effectType: WavePaymentEffectJob["effect_type"],
  attemptCount = 1,
): WavePaymentEffectJob {
  return {
    id: `effect-${effectType}`,
    order_id: ORDER.id,
    effect_type: effectType,
    attempt_count: attemptCount,
  };
}

function orderQuery() {
  return {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    async single() {
      return { data: ORDER, error: null };
    },
  };
}

describe("Wave payment effect worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendPaymentReceipt.mockResolvedValue(undefined);
    mocks.sendMeasurementProtocolEvent.mockResolvedValue(true);
  });

  it("retries a transient GA4 failure and completes the same durable job later", async () => {
    const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const claims: WavePaymentEffectJob[][] = [
      [job("ga4_purchase", 1)],
      [job("ga4_purchase", 2)],
    ];
    const supabase = {
      async rpc(name: string, args: Record<string, unknown>) {
        rpcCalls.push({ name, args });
        if (name === "claim_wave_payment_effects") {
          return { data: claims.shift() ?? [], error: null };
        }
        if (name === "retry_wave_payment_effect") {
          return { data: "retry", error: null };
        }
        if (name === "complete_wave_payment_effect") {
          return { data: true, error: null };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      },
      from(table: string) {
        if (table !== "orders") throw new Error(`Unexpected table: ${table}`);
        return orderQuery();
      },
    };
    mocks.sendMeasurementProtocolEvent
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const first = await processWavePaymentEffects({
      supabase: supabase as never,
      maxJobs: 1,
    });
    const retry = await processWavePaymentEffects({
      supabase: supabase as never,
      maxJobs: 1,
    });

    expect(first).toEqual({ claimed: 1, sent: 0, retried: 1, dead: 0 });
    expect(retry).toEqual({ claimed: 1, sent: 1, retried: 0, dead: 0 });
    expect(mocks.sendMeasurementProtocolEvent).toHaveBeenCalledTimes(2);
    expect(mocks.sendMeasurementProtocolEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        event_name: "purchase",
        params: expect.objectContaining({
          transaction_id: "TC-0123",
          value: 111,
          currency: "CAD",
          payment_type: "wave",
        }),
      }),
    );
    expect(rpcCalls.map((call) => call.name)).toEqual([
      "claim_wave_payment_effects",
      "retry_wave_payment_effect",
      "claim_wave_payment_effects",
      "complete_wave_payment_effect",
    ]);
  });

  it("reuses one stable receipt idempotency key after an acknowledgement crash", async () => {
    const claims: WavePaymentEffectJob[][] = [
      [job("receipt", 1)],
      [job("receipt", 2)],
    ];
    let completionAttempt = 0;
    const supabase = {
      async rpc(name: string) {
        if (name === "claim_wave_payment_effects") {
          return { data: claims.shift() ?? [], error: null };
        }
        if (name === "complete_wave_payment_effect") {
          completionAttempt += 1;
          return completionAttempt === 1
            ? { data: null, error: { message: "ack write failed" } }
            : { data: true, error: null };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      },
      from(table: string) {
        if (table !== "orders") throw new Error(`Unexpected table: ${table}`);
        return orderQuery();
      },
    };

    await expect(
      processWavePaymentEffects({
        supabase: supabase as never,
        maxJobs: 1,
      }),
    ).rejects.toThrow("completion acknowledgement failed");
    await expect(
      processWavePaymentEffects({
        supabase: supabase as never,
        maxJobs: 1,
      }),
    ).resolves.toEqual({ claimed: 1, sent: 1, retried: 0, dead: 0 });

    expect(mocks.sendPaymentReceipt).toHaveBeenCalledTimes(2);
    for (const [receipt] of mocks.sendPaymentReceipt.mock.calls) {
      expect(receipt).toEqual(
        expect.objectContaining({
          orderNumber: "TC-0123",
          idempotencyKey: "wave-receipt/order-123",
        }),
      );
    }
  });

  it("uses the paid date for an idempotent Brevo contact update", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    process.env.BREVO_API_KEY = "brevo-test";

    await performWavePaymentEffect(job("brevo_payment_date"), ORDER);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toEqual({
      email: "customer@example.com",
      attributes: { LAST_PAYMENT_DATE: "2026-07-24" },
      updateEnabled: true,
    });
    fetchMock.mockRestore();
    delete process.env.BREVO_API_KEY;
  });
});
