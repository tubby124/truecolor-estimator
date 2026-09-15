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
  identityLookupError?: { message: string } | null;
  orderLookupError?: { message: string } | null;
  orderStatus?: string;
  ledgerInsertError?: { code?: string; message: string } | null;
  ledgerReadError?: { message: string } | null;
  duplicateLookupError?: { message: string } | null;
  duplicateExistingRow?: Record<string, unknown> | null;
  initialLedgerRows?: Array<Record<string, unknown>>;
  orderUpdateError?: { message: string } | null;
} = {}) {
  const paymentAttempts: Array<Record<string, unknown>> = [];
  const webhookEvents: Array<Record<string, unknown>> = [];
  const ledgerInserts: Array<Record<string, unknown>> = [];
  const ledgerRows = [...(options.initialLedgerRows ?? [])];
  let ledgerReads = 0;
  let duplicateLedgerReads = 0;
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
              if (options.identityLookupError) return { data: null, error: options.identityLookupError };
              const id = options.durableSessionOrderId === undefined ? ORDER_A : options.durableSessionOrderId;
              return { data: id ? { id } : null, error: null };
            }
            if (filters.has("payment_reference")) return { data: null, error: null };
            if (filters.get("id") === ORDER_B) return { data: { id: ORDER_B }, error: null };
            if (filters.has("id")) {
              if (filters.has("is:voided_at") && options.orderLookupError) {
                return { data: null, error: options.orderLookupError };
              }
              return { data: order, error: null };
            }
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
            if (options.ledgerInsertError) return { error: options.ledgerInsertError };
            const duplicate = ledgerRows.some((existing) =>
              existing.method === "clover" &&
              existing.status === "recorded" &&
              existing.external_reference === row.external_reference,
            );
            if (duplicate) return { error: { code: "23505", message: "duplicate payment reference" } };
            ledgerRows.push(row);
            return { error: null };
          },
          select(columns?: string) {
            if (columns?.includes("external_reference")) {
              return {
                match(criteria: Record<string, unknown>) {
                  duplicateLedgerReads += 1;
                  return {
                    async maybeSingle() {
                      if (options.duplicateLookupError) {
                        return { data: null, error: options.duplicateLookupError };
                      }
                      const defaultExisting = ledgerRows.find((row) =>
                        row.method === "clover" && row.status === "recorded" && row.external_reference === criteria.external_reference,
                      ) ?? {
                        order_id: ORDER_A,
                        amount: 10,
                        currency: "CAD",
                        method: "clover",
                        status: "recorded",
                        external_reference: "payment-1",
                      };
                      return { data: options.duplicateExistingRow ?? defaultExisting, error: null };
                    },
                  };
                },
              };
            }
            ledgerReads += 1;
            return {
              async eq() {
                const rowsForRead = ledgerRows.length > 0
                  ? ledgerRows
                  : (options.ledgerInsertError?.code === "23505" ? [options.duplicateExistingRow ?? {
                    order_id: ORDER_A,
                    amount: 10,
                    currency: "CAD",
                    method: "clover",
                    status: "recorded",
                    external_reference: "payment-1",
                  }] : []);
                return {
                  data: options.ledgerReadError ? null : rowsForRead.map((row) => ({
                    amount: row.amount,
                    method: row.method,
                    status: row.status,
                  })),
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
    get storedLedgerRows() { return ledgerRows; },
    get ledgerReads() { return ledgerReads; },
    get duplicateLedgerReads() { return duplicateLedgerReads; },
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

  it("durably counts a new capture on an already-paid order without replaying payment effects", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured({ id: "payment-already-paid" })));

    expect(response.status).toBe(200);
    expect(harness.storedLedgerRows).toContainEqual(expect.objectContaining({
      order_id: ORDER_A,
      external_reference: "payment-already-paid",
      amount: 10,
      currency: "CAD",
    }));
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(mocks.sendPaymentReceipt).not.toHaveBeenCalled();
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({
      detail: expect.stringContaining("Clover payment recorded on already payment_received"),
    }));
  });

  it("acknowledges an exact duplicate on an already-paid order without another ledger row", async () => {
    const harness = createHarness();
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const first = await POST(request(captured({ id: "payment-already-paid" })));
    const second = await POST(request(captured({ id: "payment-already-paid" })));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(harness.storedLedgerRows).toHaveLength(1);
    expect(harness.duplicateLedgerReads).toBe(1);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
  });

  it("flags an overpaid ambiguity on an already-paid order without changing its state", async () => {
    const harness = createHarness({
      initialLedgerRows: [{ amount: 10, currency: "CAD", method: "cash", status: "recorded", external_reference: "cash-1" }],
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured({ id: "payment-overpaid" })));

    expect(response.status).toBe(200);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({
      ok: false,
      detail: expect.stringContaining("overpaid ambiguity"),
    }));
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

  it("returns retryable failure when the matched order lookup fails", async () => {
    const harness = createHarness({ orderLookupError: { message: "database unavailable" } });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.ledgerInserts).toHaveLength(0);
    expect(harness.orderUpdates).toBe(0);
  });

  it("returns retryable failure when durable identity lookup rejects", async () => {
    const harness = createHarness({ identityLookupError: { message: "database unavailable" } });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.ledgerInserts).toHaveLength(0);
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({
      ok: false,
      detail: expect.stringContaining("unexpected error: checkout session lookup failed"),
    }));
  });

  it("returns retryable failure when duplicate Clover identity cannot be read", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerInsertError: { code: "23505", message: "duplicate payment reference" },
      duplicateLookupError: { message: "read timeout" },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(503);
    expect(harness.duplicateLedgerReads).toBe(1);
    expect(harness.ledgerReads).toBe(0);
    expect(harness.orderUpdates).toBe(0);
  });

  it("holds a duplicate Clover payment ID linked to another order for manual review", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerInsertError: { code: "23505", message: "duplicate payment reference" },
      duplicateExistingRow: {
        order_id: ORDER_B,
        amount: 10,
        currency: "CAD",
        method: "clover",
        status: "recorded",
        external_reference: "payment-1",
      },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(200);
    expect(harness.ledgerReads).toBe(0);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(harness.webhookEvents).toContainEqual(expect.objectContaining({
      ok: false,
      detail: expect.stringContaining("identity conflict; manual review required"),
    }));
  });

  it("holds a duplicate Clover payment ID with a different recorded amount for manual review", async () => {
    const harness = createHarness({
      orderStatus: "pending_payment",
      ledgerInsertError: { code: "23505", message: "duplicate payment reference" },
      duplicateExistingRow: {
        order_id: ORDER_A,
        amount: 9.99,
        currency: "CAD",
        method: "clover",
        status: "recorded",
        external_reference: "payment-1",
      },
    });
    mocks.createServiceClient.mockReturnValue(harness.supabase);

    const response = await POST(request(captured()));

    expect(response.status).toBe(200);
    expect(harness.ledgerReads).toBe(0);
    expect(harness.orderUpdates).toBe(0);
    expect(mocks.sendPaymentReceipt).not.toHaveBeenCalled();
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
