import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), wave: vi.fn(), void: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth, createServiceClient: () => ({ from: mocks.db }) }));
vi.mock("@/lib/wave/client", () => ({ waveQuery: mocks.wave, WAVE_BUSINESS_ID: "business" }));
vi.mock("@/lib/wave/invoice", () => ({ voidWaveInvoice: mocks.void }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));
import { POST } from "../route";
const original = { id: "order", order_number: "SYNTHETIC", status: "pending_payment", paid_at: null, wave_payment_recorded_at: null, wave_invoice_id: "invoice", voided_at: null, quote_request_id: null, payment_reference: null, quote_checkout_state: null, quote_wave_state: "ready", wave_invoice_approved_at: "2026-09-06", total: 111 };
let order: Record<string, unknown>;
let claim: { data: unknown; error: unknown };
let finalized: { data: unknown; error: unknown };
let attempts: { data: unknown; error: unknown };
let queries: Array<Array<unknown>>;
function chain(result: unknown) {
  const calls: Array<unknown> = []; queries.push(calls);
  const q: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "update"]) q[method] = (...args: unknown[]) => { calls.push([method, ...args]); return q; };
  q.maybeSingle = async () => result;
  q.limit = async () => result;
  return q;
}
const request = () => POST(new NextRequest("https://example.test/void", { method: "POST", body: JSON.stringify({ reason: "Correct quantity" }) }), { params: Promise.resolve({ id: "order" }) });
beforeEach(() => {
  vi.clearAllMocks(); queries = []; order = { ...original };
  claim = { data: { id: "order" }, error: null }; finalized = { data: { id: "order" }, error: null }; attempts = { data: [], error: null };
  mocks.auth.mockResolvedValue({ email: "staff@example.test" });
  let orderCalls = 0;
  mocks.db.mockImplementation((table) => table === "payment_attempts" ? chain(attempts) : chain(++orderCalls === 1 ? { data: order, error: null } : orderCalls === 2 ? claim : finalized));
  mocks.wave.mockResolvedValue({ business: { invoice: { id: "invoice", status: "SAVED", amountPaid: { value: "0.00" }, total: { value: "111.00" } } } });
  mocks.void.mockResolvedValue(undefined);
});
describe("complete unpaid correction safety", () => {
  it("claims an unchanged unpaid order before voiding and returns replacement only after persistence", async () => {
    expect((await request()).status).toBe(200);
    expect(mocks.void).toHaveBeenCalledOnce();
    expect(queries[2]).toContainEqual(["is", "paid_at", null]);
    expect(queries[2]).toContainEqual(["is", "payment_reference", null]);
    expect(queries[2]).toContainEqual(["eq", "total", 111]);
    expect(queries.flat().filter((call) => Array.isArray(call) && call[0] === "update")).toHaveLength(2);
  });
  it.each([{ paid_at: "today" }, { status: "in_production" }, { wave_invoice_id: null }, { quote_wave_state: "ambiguous" }, { payment_reference: "checkout" }, { quote_checkout_state: "creating" }, { quote_checkout_state: "ambiguous" }, { quote_request_id: "quote" }, { voided_at: "today" }])("blocks paid, progressed, duplicate and uncertain state %j", async (patch) => {
    Object.assign(order, patch); expect((await request()).status).toBe(409); expect(mocks.void).not.toHaveBeenCalled();
  });
  it.each(["PARTIAL", "PAID", "OVERPAID", "UNKNOWN"])("blocks accounting status %s", async (status) => {
    mocks.wave.mockResolvedValue({ business: { invoice: { id: "invoice", status, amountPaid: { value: "0" }, total: { value: "111" } } } });
    expect((await request()).status).toBe(409); expect(mocks.void).not.toHaveBeenCalled();
  });
  it.each([
    { amountPaid: { value: "0.01" } },
    { amountPaid: null },
    { amountPaid: { value: "unknown" } },
    { total: { value: "112" } },
    { id: "different-invoice" },
  ])("blocks changed or unknown Wave balances %j", async (patch) => {
    mocks.wave.mockResolvedValue({ business: { invoice: { id: "invoice", status: "SAVED", amountPaid: { value: "0" }, total: { value: "111" }, ...patch } } });
    expect((await request()).status).toBe(409); expect(mocks.void).not.toHaveBeenCalled();
  });
  it("holds on provider read failure", async () => {
    mocks.wave.mockRejectedValue(new Error("unavailable"));
    expect((await request()).status).toBe(502); expect(mocks.void).not.toHaveBeenCalled();
  });
  it("fails closed on payment lookup errors", async () => { attempts = { data: null, error: "unavailable" }; expect((await request()).status).toBe(409); expect(mocks.void).not.toHaveBeenCalled(); });
  it("blocks a concurrent payment or correction that wins the claim", async () => { claim = { data: null, error: null }; expect((await request()).status).toBe(409); expect(mocks.void).not.toHaveBeenCalled(); });
  it("does not issue replacement after ambiguous provider void", async () => { mocks.void.mockRejectedValue(new Error("timeout")); const r = await request(); expect(r.status).toBe(502); expect(await r.json()).not.toHaveProperty("replacementUrl"); });
  it("does not issue replacement on persistence failure or lost final row", async () => { finalized = { data: null, error: null }; const r = await request(); expect(r.status).toBe(502); expect(await r.json()).not.toHaveProperty("replacementUrl"); });
});
