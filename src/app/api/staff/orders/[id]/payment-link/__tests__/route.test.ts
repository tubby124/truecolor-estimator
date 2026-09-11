import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { decodePaymentToken } from "@/lib/payment/token";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: vi.fn(),
  audit: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: mocks.auth,
  createServiceClient: () => ({ from: mocks.db }),
}));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));
// The copy path must never email — the Resend button owns that.
vi.mock("@/lib/email/paymentRequest", () => ({ sendPaymentRequestEmail: mocks.sendEmail }));

import { POST } from "../route";

const SECRET = "test-payment-secret-that-is-long-enough";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const SITE = "https://truecolorprinting.ca";

type QueryResult = { data: unknown; error: { message: string } | null };

/** Chain that works both awaited directly and via .single()/.maybeSingle(). */
function chain(result: QueryResult) {
  const q: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "order", "limit"]) {
    q[method] = () => q;
  }
  q.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  q.single = async () => result;
  q.maybeSingle = async () => result;
  return q;
}

function request() {
  return POST(new NextRequest(`${SITE}/api/staff/orders/${ORDER_ID}/payment-link`, { method: "POST" }), {
    params: Promise.resolve({ id: ORDER_ID }),
  });
}

const baseOrder = {
  id: ORDER_ID,
  order_number: "TC-2026-1042",
  status: "pending_payment",
  total: 245.55,
  voided_at: null as string | null,
  customers: [{ name: "Dana Smith", email: "dana@example.com" }],
};

let order: Record<string, unknown>;
let ledger: QueryResult;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PAYMENT_TOKEN_SECRET", SECRET);
  vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", "");
  vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
  order = { ...baseOrder };
  ledger = { data: [], error: null };

  mocks.auth.mockResolvedValue({ email: "staff@example.test" });
  mocks.audit.mockResolvedValue(true);
  mocks.sendEmail.mockResolvedValue(undefined);
  mocks.db.mockImplementation((table: string) =>
    table === "order_payments" ? chain(ledger) : chain({ data: order, error: null })
  );
});

afterEach(() => vi.unstubAllEnvs());

describe("staff copyable payment link", () => {
  it("requires staff auth before touching the database", async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const res = await request();

    expect(res.status).toBe(401);
    expect(mocks.db).not.toHaveBeenCalled();
  });

  it("returns the balance-due link, a ready-to-send message, and never emails", async () => {
    ledger = {
      data: [
        { amount: 100, method: "clover", status: "recorded" },
        { amount: 45.55, method: "etransfer", status: "recorded" },
      ],
      error: null,
    };

    const res = await request();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.amountDue).toBe(100);
    expect(body.orderTotal).toBe(245.55);
    expect(body.amountPaid).toBe(145.55);
    expect(body.customerFirstName).toBe("Dana");

    const token = String(body.paymentUrl).replace(`${SITE}/pay/`, "");
    const decoded = decodePaymentToken(token);
    expect(decoded.amountCents).toBe(10000);
    expect(decoded.amountCents).not.toBe(Math.round(245.55 * 100));
    expect(decoded.orderId).toBe(ORDER_ID);

    expect(body.message).toContain(body.paymentUrl);
    expect(body.message).toContain("TC-2026-1042");
    expect(body.message).toContain("$100.00 CAD remaining balance (of $245.55)");
    expect(body.message).toContain("Hi Dana,");

    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "order.payment_link_copied", actor_type: "staff" })
    );
  });

  it("mints the full total for a fully-unpaid order", async () => {
    const res = await request();
    const body = await res.json();

    expect(res.status).toBe(200);
    const decoded = decodePaymentToken(String(body.paymentUrl).replace(`${SITE}/pay/`, ""));
    expect(decoded.amountCents).toBe(24555);
    expect(body.message).toContain("($245.55 CAD)");
  });

  it.each([
    { patch: { status: "payment_received" }, status: 400 },
    { patch: { voided_at: "2026-09-01T00:00:00.000Z" }, status: 409 },
    { patch: { customers: [{ name: "Dana Smith", email: "" }] }, status: 400 },
  ])("refuses an order that is not payable %j", async ({ patch, status }) => {
    Object.assign(order, patch);

    const res = await request();

    expect(res.status).toBe(status);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("404s when the order does not exist", async () => {
    mocks.db.mockImplementation((table: string) =>
      table === "order_payments"
        ? chain(ledger)
        : chain({ data: null, error: { message: "no rows" } })
    );

    const res = await request();

    expect(res.status).toBe(404);
  });

  it("fails closed when the payment ledger cannot be read", async () => {
    ledger = { data: null, error: { message: "ledger unavailable" } };

    const res = await request();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).not.toHaveProperty("paymentUrl");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("refuses to hand out a link when recorded payments already cover the order", async () => {
    ledger = { data: [{ amount: 245.55, method: "clover", status: "recorded" }], error: null };

    const res = await request();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).not.toHaveProperty("paymentUrl");
  });
});
