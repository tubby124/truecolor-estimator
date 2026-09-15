import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), send: vi.fn(), audit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth, createServiceClient: () => ({ from: mocks.from }) }));
vi.mock("@/lib/email/statusUpdate", () => ({ sendOrderStatusEmail: mocks.send }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));

import { POST } from "../route";

let status: string;
let previous: unknown;
function chain(data: unknown, error: unknown = null) {
  const query: Record<string, unknown> = {};
  for (const name of ["select", "eq", "like", "in", "order", "limit"]) query[name] = () => query;
  query.single = query.maybeSingle = async () => ({ data, error });
  return query;
}
function request(body?: object) {
  return POST(new NextRequest("https://example.test/api/payment-confirmation", {
    method: "POST",
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { params: Promise.resolve({ id: "order" }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  status = "payment_received";
  previous = null;
  mocks.auth.mockResolvedValue({ email: "staff@example.test" });
  mocks.from.mockImplementation((table: string) => table === "email_log"
    ? chain(previous)
    : chain({
      id: "order", order_number: "TC-TEST", status, total: 111, is_rush: false,
      payment_method: "wave", customers: { name: "Test", email: "test@example.test" }, order_items: [],
    }));
  mocks.send.mockResolvedValue(undefined);
  mocks.audit.mockResolvedValue(undefined);
});

describe("staff payment-update delivery", () => {
  it("requires staff authorization", async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({}, { status: 401 }));
    expect((await request()).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not send a payment update before payment is confirmed", async () => {
    status = "pending_payment";
    expect((await request()).status).toBe(409);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not duplicate an already logged first payment update", async () => {
    previous = { sent_at: "2026-09-15T10:00:00Z" };
    await expect(request()).resolves.toMatchObject({ status: 200 });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("uses a stable provider key for the first delivery", async () => {
    expect((await request()).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      status: "payment_received",
      idempotencyKey: "payment-confirmation:order:v1",
      requireEmailLog: true,
    }));
  });

  it("requires a fresh unique request before an intentional resend", async () => {
    previous = { sent_at: "2026-09-15T10:00:00Z" };
    expect((await request({ resend: true })).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
