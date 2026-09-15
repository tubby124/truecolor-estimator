import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const m = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), send: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: m.auth, createServiceClient: () => ({ from: m.from }) }));
vi.mock("@/lib/email/paymentReceipt", () => ({ sendPaymentReceipt: m.send }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: m.audit }));
import { POST } from "../route";
let status: string, previous: unknown, historyError: unknown, ledger: unknown[];
function chain(data: unknown, error: unknown = null) {
  const q: Record<string, unknown> = {};
  for (const name of ["select", "eq", "like", "in", "order", "limit"]) q[name] = () => q;
  q.single = q.maybeSingle = async () => ({ data, error });
  return q;
}
function listChain(data: unknown, error: unknown = null) {
  const q: Record<string, unknown> = {};
  for (const name of ["select", "eq", "order"]) q[name] = () => q;
  q.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve);
  return q;
}
function request(body?: object) {
  return POST(new NextRequest("https://example.test/api/receipt", { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) }), { params: Promise.resolve({ id: "order" }) });
}
beforeEach(() => {
  vi.clearAllMocks(); status = "payment_received"; previous = null; historyError = null; ledger = [];
  m.auth.mockResolvedValue({ email: "staff@example.test" });
  m.from.mockImplementation(table => table === "email_log"
    ? chain(previous, historyError)
    : table === "order_payments"
      ? listChain(ledger)
      : chain({ id: "order", order_number: "TC-TEST", status, subtotal: 100, gst: 5, pst: 6, total: 111, payment_method: "clover_card", customers: { name: "Test", email: "test@example.test" }, order_items: [] }));
});
describe("staff receipt delivery", () => {
  it("requires staff authorization", async () => { m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 })); expect((await request()).status).toBe(401); expect(m.from).not.toHaveBeenCalled(); });
  it("cannot send a paid receipt for an unpaid order", async () => { status = "pending_payment"; expect((await request()).status).toBe(409); expect(m.send).not.toHaveBeenCalled(); });
  it("does not send another copy when automatic delivery already succeeded", async () => { previous = { sent_at: "2026-01-01" }; const response = await request(); expect(await response.json()).toMatchObject({ alreadySent: true }); expect(m.send).not.toHaveBeenCalled(); });
  it("fails closed when receipt history cannot be checked", async () => { historyError = { message: "offline" }; expect((await request()).status).toBe(503); expect(m.send).not.toHaveBeenCalled(); });
  it("gives first delivery a stable key", async () => { expect((await request()).status).toBe(200); expect(m.send).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: "payment-receipt:order:v1" })); });
  it("uses every recorded ledger provider instead of the intended order method", async () => {
    ledger = [
      { amount: 50, method: "wave", status: "recorded" },
      { amount: 61, method: "etransfer", status: "recorded" },
    ];
    expect((await request()).status).toBe(200);
    expect(m.send).toHaveBeenCalledWith(expect.objectContaining({ paymentSources: ["wave", "etransfer"] }));
  });
  it("requires a request identity for an intentional resend", async () => { previous = { sent_at: "2026-01-01" }; expect((await request({ resend: true })).status).toBe(400); expect(m.send).not.toHaveBeenCalled(); });
  it("keys an intentional resend independently for safe request retries", async () => { const requestId = "22222222-2222-4222-8222-222222222222"; expect((await request({ resend: true, requestId, requestCreatedAt: Date.now() })).status).toBe(200); expect(m.send).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: `receipt-resend:order:${requestId}` })); });
  it.each([undefined, "invalid", NaN, Date.now() - 301_000, Date.now() + 60_000])("rejects expired or invalid resend timestamp %s", async requestCreatedAt => {
    expect((await request({ resend: true, requestId: "22222222-2222-4222-8222-222222222222", requestCreatedAt })).status).toBe(400);
    expect(m.send).not.toHaveBeenCalled();
  });
  it("retains the provider key for a same-request retry within the freshness window", async () => {
    const body = { resend: true, requestId: "22222222-2222-4222-8222-222222222222", requestCreatedAt: Date.now() };
    await request(body); await request(body);
    expect(m.send.mock.calls.map(c => c[0].idempotencyKey)).toEqual(["receipt-resend:order:22222222-2222-4222-8222-222222222222", "receipt-resend:order:22222222-2222-4222-8222-222222222222"]);
  });

});
