import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  fetchAmount: vi.fn(),
  approveWaveInvoice: vi.fn(),
  recordWavePayment: vi.fn(),
  sendPaymentReceipt: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock("@/lib/payment/clover", () => ({ fetchCloverPaymentAmountCents: mocks.fetchAmount }));
vi.mock("@/lib/email/paymentReceipt", () => ({ sendPaymentReceipt: mocks.sendPaymentReceipt }));
vi.mock("@/lib/wave/invoice", () => ({
  approveWaveInvoice: mocks.approveWaveInvoice,
  recordWavePayment: mocks.recordWavePayment,
  findCustomerByEmail: vi.fn().mockResolvedValue(null),
  getWaveInvoicePublicUrl: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/brevo/customerSync", () => ({ syncCustomerToBrevo: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/customers/incrementOrderStats", () => ({ incrementCustomerOrderStats: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/analytics/purchase-amounts", () => ({ buildPurchaseAmounts: vi.fn().mockReturnValue({}) }));
vi.mock("@/lib/analytics/measurementProtocol", () => ({ sendMeasurementProtocolPurchase: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/analytics/metaCapi", () => ({ sendMetaCapiEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/notifications/telegram", () => ({
  sendTelegramNotification: vi.fn().mockResolvedValue(undefined),
  escapeTelegramHtml: (value: string) => value,
}));
vi.mock("@/lib/notifications/broadcast", () => ({ broadcastStaffNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/email/smtp", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: vi.fn().mockResolvedValue(undefined) }));

import { POST } from "../route";

const ORDER_A = "11111111-1111-4111-8111-111111111111";
const ORDER_B = "22222222-2222-4222-8222-222222222222";
const SESSION = "checkout-session-1";
const SECRET = "clover-webhook-test-secret";

function request(payload: Record<string, unknown>) {
  return new NextRequest(`https://truecolorprinting.ca/api/webhooks/clover?k=${SECRET}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function captured(overrides: Record<string, unknown> = {}) {
  return {
    type: "PAYMENT",
    object: {
      id: "payment-1",
      status: "captured",
      amount: 1000,
      data: { checkoutSessionId: SESSION },
      ...overrides,
    },
  };
}

function createHarness(options: {
  durableSessionOrderId?: string | null;
  historicalSessionOrderId?: string | null;
  referenceOrderId?: string | null;
  orderStatus?: string;
  ledgerInsertError?: { code?: string; message: string } | null;
  ledgerReadError?: { message: string } | null;
  orderUpdateError?: { message: string } | null;
} = {}) {
  const paymentAttempts: Array<Record<string, unknown>> = [];
  const webhookEvents: Array<Record<string, unknown>> = [];
  const ledgerInserts: Array<Record<string, unknown>> = [];
  let ledgerReads = 0;
  let orderUpdates = 0;
  let paymentAttemptSelects = 0;

  const order = {
    id: ORDER_A,
    order_number: "TC-2026-0001",
    total: 10,
    status: options.orderStatus ?? "payment_received",
    customer_id: "customer-1",
    customers: { name: "Test Customer", email: "customer@example.test", company: null },
  };

  const supabase = {
    from(table: string) {
      if (table === "orders") {
        const filters = new Map<string, unknown>();
        return {
          select() { return this; },
          eq(column: string, value: unknown) { filters.set(column, value); return this; },
          is(column: string, value: unknown) { filters.set(`is:${column}`, value); return this; },
          update() {
            orderUpdates += 1;
            return {
              eq() { return this; },
              is() { return this; },
              async select() { return { data: null, error: options.orderUpdateError ?? null }; },
            };
          },
          async maybeSingle() {
            if (filters.has("quote_checkout_session_id")) {
              const id = options.durableSessionOrderId === undefined ? ORDER_A : options.durableSessionOrderId;
              return { data: id ? { id } : null, error: null };
            }
            if (filters.has("payment_reference")) return { data: null, error: null };
            if (filters.get("id") === ORDER_B) return { data: { id: ORDER_B }, error: null };
            if (filters.has("id")) return { data: order, error: null };
            throw new Error(`Unexpected orders lookup: ${JSON.stringify([...filters])}`);
          },
        };
      }
      if (table === "payment_attempts") {
        return {
          select() { paymentAttemptSelects += 1; return this; },
          eq() { return this; },
          not() { return this; },
          order() { return this; },
          limit() { return this; },
          async maybeSingle() { return { data: options.historicalSessionOrderId ? { order_id: options.historicalSessionOrderId } : null, error: null }; },
          async insert(row: Record<string, unknown>) { paymentAttempts.push(row); return { error: null }; },
        };
      }
      if (table === "order_payments") {
        return {
          async insert(row: Record<string, unknown>) {
            ledgerInserts.push(row);
            return { error: options.ledgerInsertError ?? null };
          },
          select() {
            ledgerReads += 1;
            return {
              async eq() {
                return {
                  data: options.ledgerReadError ? null : [{ amount: 10, method: "clover", status: "recorded" }],
                  error: options.ledgerReadError ?? null,
                };
              },
            };
          },
        };
      }
      if (table === "webhook_events") {
        return { async insert(row: Record<string, unknown>) { webhookEvents.push(row); return { error: null }; } };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    supabase,
    paymentAttempts,
    webhookEvents,
    ledgerInserts,
    get ledgerReads() { return ledgerReads; },
    get orderUpdates() { return orderUpdates; },
    get paymentAttemptSelects() { return paymentAttemptSelects; },
  };
}

describe("Clover webhook durable identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOVER_WEBHOOK_SECRET = SECRET;
    mocks.fetchAmount.mockResolvedValue(1000);
    mocks.approveWaveInvoice.mockResolvedValue(undefined);
    mocks.recordWavePayment.mockResolvedValue(undefined);
    mocks.sendPaymentReceipt.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.CLOVER_WEBHOOK_SECRET;
    vi.restoreAllMocks();
  });

  it("matches a session-only capture even when no payment attempt exists", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(200);
    expect(harness.paymentAttemptSelects).toBe(0);
    expect(harness.paymentAttempts).toContainEqual(expect.objectContaining({
      order_id: ORDER_A,
      status: "payment_captured",
      amount: 10,
      clover_checkout_session_id: SESSION,
    }));
  });

  it("accepts a provider order id that differs from the external order reference", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured({ externalReferenceId: ORDER_A, orderId: "clover-order-9" })));

    expect(response.status).toBe(200);
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({ matched_order_id: ORDER_A, ok: true }));
  });

  it("falls back past a null orphan attempt to a linked historical attempt", async () => {
    const harness = createHarness({ durableSessionOrderId: null, historicalSessionOrderId: ORDER_A });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(200);
    expect(harness.paymentAttemptSelects).toBe(1);
    expect(harness.paymentAttempts[0]).toEqual(expect.objectContaining({ order_id: ORDER_A, status: "payment_captured" }));
  });

  it("rejects a conflicting checkout session and external reference", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured({ externalReferenceId: ORDER_B })));

    expect(response.status).toBe(200);
    expect(harness.paymentAttempts).toHaveLength(0);
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({
      ok: false,
      detail: "conflicting checkout session/reference identities; payment not applied",
    }));
  });

  it("keeps duplicate captures out of payment side effects after the order is already paid", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const [first, second] = await Promise.all([POST(request(captured())), POST(request(captured()))]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(harness.webhookEvents.filter((row) => String(row.detail).includes("already payment_received"))).toHaveLength(2);
  });

  it("returns retryable unresolved processing for a missing amount until a later retry verifies it", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);
    mocks.fetchAmount.mockRejectedValueOnce(new Error("Clover payment lookup API error 404"));
    const payload = captured({ amount: undefined });

    const unresolved = await POST(request(payload));
    const retried = await POST(request(payload));

    expect(unresolved.status).toBe(503);
    expect(retried.status).toBe(200);
    expect(harness.paymentAttempts).toContainEqual(expect.objectContaining({ status: "ambiguous", amount: null }));
    expect(harness.paymentAttempts).toContainEqual(expect.objectContaining({ status: "payment_captured", amount: 10 }));
  });

  it("uses the same durable session match for a declined payment", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request({
      type: "PAYMENT",
      object: {
        id: "payment-declined",
        status: "voided",
        data: { checkoutSessionId: SESSION },
        voidReason: "REJECT",
      },
    }));

    expect(response.status).toBe(200);
    expect(harness.paymentAttempts).toContainEqual(expect.objectContaining({
      order_id: ORDER_A,
      status: "card_declined",
      clover_checkout_session_id: SESSION,
    }));
  });

  it("records a missing payment id as unresolved and asks Clover to retry before any ledger effect", async () => {
    const harness = createHarness({ orderStatus: "pending_payment" });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured({ id: undefined })));

    expect(response.status).toBe(503);
    expect(harness.ledgerInserts).toHaveLength(0);
    expect(harness.orderUpdates).toBe(0);
    expect(harness.paymentAttempts).toContainEqual(expect.objectContaining({
      status: "ambiguous",
      failure_label: "Clover payment ID was missing from a captured callback",
    }));
  });

  it("returns retryable failure when the ledger insert fails and runs no payment side effects", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerInsertError: { code: "08006", message: "database unavailable" },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.ledgerInserts).toHaveLength(1);
    expect(harness.ledgerReads).toBe(0);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(mocks.sendPaymentReceipt).not.toHaveBeenCalled();
  });

  it("returns retryable failure instead of acknowledging an unreadable ledger as a partial payment", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerReadError: { message: "read timeout" },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.ledgerReads).toBe(1);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
  });

  it("re-reads the ledger after a same-reference duplicate so a retry can finish a prior committed payment", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerInsertError: { code: "23505", message: "duplicate payment reference" },
      orderUpdateError: { message: "write timeout" },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.ledgerReads).toBe(1);
    expect(harness.orderUpdates).toBe(1);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
  });

  it("returns retryable failure and suppresses effects when the paid-state transition does not commit", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      orderUpdateError: { message: "write timeout" },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.orderUpdates).toBe(1);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(mocks.sendPaymentReceipt).not.toHaveBeenCalled();
  });
});
