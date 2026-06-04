import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireStaffUser: vi.fn(),
  createServiceClient: vi.fn(),
  recordAuditEvent: vi.fn(),
  approveWaveInvoice: vi.fn(),
  recordWavePayment: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: mocks.requireStaffUser,
  createServiceClient: mocks.createServiceClient,
}));

vi.mock("@/lib/audit/record", () => ({
  recordAuditEvent: mocks.recordAuditEvent,
}));

vi.mock("@/lib/wave/invoice", () => ({
  approveWaveInvoice: mocks.approveWaveInvoice,
  recordWavePayment: mocks.recordWavePayment,
}));

import { GET as getPayments, POST as postPayment } from "../route";
import { POST as recordWavePaymentForLedgerRow } from "../[paymentId]/record-wave/route";

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

function jsonRequest(body: unknown = {}) {
  return new Request("https://truecolorprinting.ca/api/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }) as never;
}

function routeParams(id = "order-1") {
  return { params: Promise.resolve({ id }) };
}

function recordWaveParams(id = "order-1", paymentId = "payment-1") {
  return { params: Promise.resolve({ id, paymentId }) };
}

function makeLedgerSupabase(options?: {
  order?: Record<string, unknown> | null;
  payments?: Record<string, unknown>[];
  insertError?: string;
}) {
  const order = options?.order ?? {
    id: "order-1",
    order_number: "TC-1001",
    total: 100,
    status: "pending_payment",
  };
  const payments = options?.payments ?? [];
  const ordersUpdate = vi.fn();

  const ordersQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null } satisfies QueryResult<Record<string, unknown> | null>),
    update: ordersUpdate,
  };

  const paymentsSelectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: payments, error: null } satisfies QueryResult<Record<string, unknown>[]>),
  };

  const insertSingle = vi.fn().mockResolvedValue(
    options?.insertError
      ? { data: null, error: { message: options.insertError } }
      : {
          data: {
            id: "payment-new",
            order_id: "order-1",
            amount: 40,
            currency: "CAD",
            method: "etransfer",
            status: "recorded",
            payer_name: "Jane Buyer",
            payer_company: "Company A",
            payer_email: "jane@example.com",
            external_reference: "emt-123",
            wave_invoice_payment_id: null,
            wave_recorded_at: null,
            recorded_by: "staff@example.com",
            recorded_at: "2026-06-03T21:00:00.000Z",
            notes: "deposit",
            metadata: {},
          },
          error: null,
        },
  );

  const insertQuery = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: insertSingle,
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "orders") return ordersQuery;
        if (table === "order_payments") {
          return {
            select: paymentsSelectQuery.select,
            eq: paymentsSelectQuery.eq,
            order: paymentsSelectQuery.order,
            insert: vi.fn(() => insertQuery),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    },
    ordersQuery,
    ordersUpdate,
    paymentsSelectQuery,
    insertQuery,
    insertSingle,
  };
}

function makeRecordWaveSupabase(options?: {
  order?: Record<string, unknown> | null;
  payment?: Record<string, unknown> | null;
  approveUpdateError?: string;
  paymentUpdateError?: string;
}) {
  const order = options?.order ?? {
    id: "order-1",
    order_number: "TC-1001",
    total: 100,
    status: "pending_payment",
    wave_invoice_id: "wave-invoice-1",
    wave_invoice_approved_at: "2026-06-03T20:00:00.000Z",
  };

  const payment = options?.payment ?? {
    id: "payment-1",
    order_id: "order-1",
    amount: 40,
    currency: "CAD",
    method: "etransfer",
    status: "recorded",
    payer_name: "Jane Buyer",
    payer_company: "Company A",
    payer_email: "jane@example.com",
    external_reference: "emt-123",
    wave_invoice_payment_id: null,
    wave_recorded_at: null,
    recorded_by: "staff@example.com",
    recorded_at: "2026-06-03T21:00:00.000Z",
    notes: "deposit",
    metadata: {},
  };

  const ordersUpdatePayloads: unknown[] = [];
  const paymentUpdatePayloads: unknown[] = [];

  const ordersUpdateQuery = {
    eq: vi.fn().mockResolvedValue(
      options?.approveUpdateError ? { error: { message: options.approveUpdateError } } : { error: null },
    ),
  };

  const ordersQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null } satisfies QueryResult<Record<string, unknown> | null>),
    update: vi.fn((payload: unknown) => {
      ordersUpdatePayloads.push(payload);
      return ordersUpdateQuery;
    }),
  };

  const paymentReadQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: payment, error: null } satisfies QueryResult<Record<string, unknown> | null>),
  };

  const paymentUpdateQuery = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(
      options?.paymentUpdateError
        ? { data: null, error: { message: options.paymentUpdateError } }
        : {
            data: {
              ...(payment ?? {}),
              wave_invoice_payment_id: "wave-payment-1",
              wave_recorded_at: "2026-06-03T21:10:00.000Z",
            },
            error: null,
          },
    ),
  };

  const paymentTable = {
    select: paymentReadQuery.select,
    eq: paymentReadQuery.eq,
    maybeSingle: paymentReadQuery.maybeSingle,
    update: vi.fn((payload: unknown) => {
      paymentUpdatePayloads.push(payload);
      return paymentUpdateQuery;
    }),
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "orders") return ordersQuery;
        if (table === "order_payments") return paymentTable;
        throw new Error(`unexpected table ${table}`);
      }),
    },
    ordersQuery,
    ordersUpdatePayloads,
    paymentTable,
    paymentUpdatePayloads,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStaffUser.mockResolvedValue({ email: "staff@example.com" });
  mocks.recordAuditEvent.mockResolvedValue(undefined);
  mocks.approveWaveInvoice.mockResolvedValue(undefined);
  mocks.recordWavePayment.mockResolvedValue("wave-payment-1");
});

describe("staff payment ledger API route", () => {
  it("requires staff auth before ledger reads", async () => {
    mocks.requireStaffUser.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const db = makeLedgerSupabase();
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await getPayments(new Request("https://truecolorprinting.ca/api/test") as never, routeParams());

    expect(res.status).toBe(401);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });

  it("returns ledger summary without mutating order status or Wave", async () => {
    const db = makeLedgerSupabase({
      payments: [
        {
          id: "payment-1",
          order_id: "order-1",
          amount: 40,
          currency: "CAD",
          method: "etransfer",
          status: "recorded",
          payer_name: "Jane Buyer",
          payer_company: "Company A",
          payer_email: "jane@example.com",
          external_reference: "emt-123",
          wave_invoice_payment_id: null,
          wave_recorded_at: null,
          recorded_by: "staff@example.com",
          recorded_at: "2026-06-03T21:00:00.000Z",
          notes: "deposit",
          metadata: {},
        },
      ],
    });
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await getPayments(new Request("https://truecolorprinting.ca/api/test") as never, routeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.status).toBe("partial");
    expect(body.summary.balanceDue).toBe(60);
    expect(db.ordersUpdate).not.toHaveBeenCalled();
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(mocks.approveWaveInvoice).not.toHaveBeenCalled();
  });

  it("records a ledger row while explicitly reporting no customer-facing side effects", async () => {
    const db = makeLedgerSupabase();
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await postPayment(
      jsonRequest({
        amount: 40,
        method: "etransfer",
        payer: { name: "Jane Buyer", company: "Company A", email: "jane@example.com" },
        externalReference: "emt-123",
        notes: "deposit",
      }),
      routeParams(),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sideEffects).toEqual({
      orderStatusUpdated: false,
      waveRecorded: false,
      receiptSent: false,
    });
    expect(db.ordersUpdate).not.toHaveBeenCalled();
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "order.payment_ledger_recorded",
      entity_id: "order-1",
    }));
  });
});

describe("staff payment Wave-recording route", () => {
  it("records exactly one ledger row into Wave without marking the order paid or sending receipt", async () => {
    const db = makeRecordWaveSupabase();
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await recordWavePaymentForLedgerRow(jsonRequest(), recordWaveParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.recordWavePayment).toHaveBeenCalledWith(
      "wave-invoice-1",
      40,
      "BANK_TRANSFER",
      "eTransfer — Company A — Order TC-1001 · Ref emt-123",
      undefined,
      "order-1:payment-1",
    );
    expect(body.sideEffects).toEqual({
      waveRecorded: true,
      orderStatusUpdated: false,
      receiptSent: false,
    });
    expect(db.paymentUpdatePayloads).toHaveLength(1);
    expect(db.paymentUpdatePayloads[0]).toMatchObject({ wave_invoice_payment_id: "wave-payment-1" });
    expect(db.ordersUpdatePayloads).toEqual([]);
  });

  it("approves a draft Wave invoice first but still does not mutate order status", async () => {
    const db = makeRecordWaveSupabase({
      order: {
        id: "order-1",
        order_number: "TC-1001",
        total: 100,
        status: "pending_payment",
        wave_invoice_id: "wave-invoice-1",
        wave_invoice_approved_at: null,
      },
    });
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await recordWavePaymentForLedgerRow(jsonRequest(), recordWaveParams());

    expect(res.status).toBe(200);
    expect(mocks.approveWaveInvoice).toHaveBeenCalledWith("wave-invoice-1");
    expect(db.ordersUpdatePayloads).toHaveLength(1);
    expect(db.ordersUpdatePayloads[0]).toEqual({ wave_invoice_approved_at: expect.any(String) });
    expect(db.ordersUpdatePayloads[0]).not.toHaveProperty("status");
    expect(db.ordersUpdatePayloads[0]).not.toHaveProperty("paid_at");
  });

  it("blocks duplicate Wave recording before calling Wave", async () => {
    const db = makeRecordWaveSupabase({
      payment: {
        id: "payment-1",
        order_id: "order-1",
        amount: 40,
        currency: "CAD",
        method: "etransfer",
        status: "recorded",
        payer_name: "Jane Buyer",
        payer_company: "Company A",
        payer_email: "jane@example.com",
        external_reference: "emt-123",
        wave_invoice_payment_id: "wave-old",
        wave_recorded_at: "2026-06-03T21:00:00.000Z",
        recorded_by: "staff@example.com",
        recorded_at: "2026-06-03T21:00:00.000Z",
        notes: "deposit",
        metadata: {},
      },
    });
    mocks.createServiceClient.mockReturnValue(db.supabase);

    const res = await recordWavePaymentForLedgerRow(jsonRequest(), recordWaveParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("already recorded in Wave");
    expect(mocks.recordWavePayment).not.toHaveBeenCalled();
    expect(db.paymentUpdatePayloads).toEqual([]);
  });
});
