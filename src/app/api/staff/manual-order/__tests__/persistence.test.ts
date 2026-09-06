import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ client: {} as unknown, provision: vi.fn(), email: vi.fn(), staffEmail: vi.fn(), token: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: async () => ({ email: "staff@example.test" }), createServiceClient: () => mocks.client }));
vi.mock("@/lib/payment/quote-wave", () => ({ provisionOrderWaveInvoice: mocks.provision }));
vi.mock("@/lib/payment/token", () => ({ encodePaymentToken: mocks.token }));
vi.mock("@/lib/email/paymentRequest", () => ({ sendPaymentRequestEmail: mocks.email }));
vi.mock("@/lib/email/staffNotification", () => ({ sendStaffOrderNotification: mocks.staffEmail }));
vi.mock("@/lib/email/accountWelcome", () => ({ sendAccountWelcomeEmail: vi.fn() }));
vi.mock("@/lib/brevo/customerSync", () => ({ syncCustomerToBrevo: vi.fn() }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));
vi.mock("@/lib/notifications/telegram", () => ({ sendTelegramNotification: async () => {}, escapeTelegramHtml: (v: string) => v }));
import { POST } from "../route";

const base = { expectedPricing: { gstRate: .05, pstRate: .06, subtotalCents: 1000, gstCents: 50, pstCents: 60, totalCents: 1110 }, submissionId: "11111111-1111-4111-8111-111111111111", contact: { name: "Test Customer", email: "buyer@example.test" }, items: [{ product: "Banner", qty: 3, amount: 10, unitPrice: 10 / 3 }], payment_method: "clover", acquisition_source: "walk_in" };
const request = (body = base) => new NextRequest("http://localhost/api/staff/manual-order", { method: "POST", body: JSON.stringify(body) });

function database(options: { itemFailure?: boolean; insertFailure?: boolean; race?: boolean } = {}) {
  let saved: Record<string, unknown> | null = null;
  const insertedLines: Record<string, unknown>[] = [];
  let orderInserts = 0;
  const from = (table: string) => {
    let operation = "select";
    let payload: Record<string, unknown> = {};
    let count = false;
    const filters: Record<string, unknown> = {};
    const finish = async () => {
      if (table === "quote_requests") return { data: [], error: null };
      if (table === "customers") return { data: { id: "customer-id" }, error: null };
      if (table === "order_items") {
        insertedLines.push(payload);
        return { data: null, error: options.itemFailure ? { message: "write failed" } : null };
      }
      if (table === "orders" && operation === "insert") {
        orderInserts++;
        if (options.insertFailure) return { data: null, error: { code: "XX000", message: "write failed" } };
        saved = { ...payload, id: "order-id", order_number: "TC-TEST-0001" };
        return { data: saved, error: options.race ? { code: "23505", message: "orders_checkout_submission_id_uidx" } : null };
      }
      if (count) return { count: 0, data: null, error: null };
      return { data: filters.checkout_submission_id ? saved : null, error: null };
    };
    const chain = {
      select: (_value?: unknown, opts?: { count?: string }) => { count = !!opts?.count; return chain; },
      insert: (value: Record<string, unknown>) => { operation = "insert"; payload = value; return chain; },
      upsert: () => chain, update: () => chain,
      eq: (key: string, value: unknown) => { filters[key] = value; return chain; },
      is: () => chain, not: () => chain, gte: () => chain, order: () => chain, limit: () => chain,
      single: finish, maybeSingle: finish,
      then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => finish().then(resolve, reject),
    };
    return chain;
  };
  mocks.client = { from, auth: { admin: { createUser: async () => ({ error: { message: "already registered" } }) } } };
  return { insertedLines, orderInserts: () => orderInserts, saved: () => saved };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.provision.mockResolvedValue({ action: "ready", invoiceId: "wave-id" });
  mocks.email.mockResolvedValue(undefined);
  mocks.token.mockReturnValue("signed-token");
  mocks.audit.mockResolvedValue(undefined);
});

describe("manual order persistence and repeat protection", () => {
  it("rejects a stale reviewed total before any customer/order write or provider call", async () => {
    const db = database();
    const result = await POST(request({ ...base, expectedPricing: { ...base.expectedPricing, totalCents: 1109 } }));
    expect(result.status).toBe(409);
    expect(db.orderInserts()).toBe(0);
    expect(mocks.provision).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("saves bespoke cents and provenance, then uses identical token/email/Wave amounts", async () => {
    const db = database();
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(db.saved()).toMatchObject({ subtotal: 10, gst: .5, pst: .6, total: 11.1 });
    expect(db.insertedLines[0]).toMatchObject({ qty: 3, line_total: 10, line_items_json: [expect.objectContaining({ pricingSource: "staff_manual", originalAmount: 10, applyPst: true })] });
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 10, gst: .5, pst: .6, total: 11.1, items: [expect.objectContaining({ unitPrice: undefined, amount: 10 })] }));
    expect(mocks.token.mock.calls[0][0]).toBe(11.1);
    expect(mocks.provision.mock.calls[0][2].waveItems).toEqual([expect.objectContaining({ qty: 1, unitPrice: 10, applyPst: true })]);
  });
  it("returns the saved request on repeat without another invoice or email", async () => {
    const db = database();
    await POST(request());
    const again = await POST(request());
    expect(await again.json()).toMatchObject({ duplicate: true, orderId: "order-id" });
    expect(db.orderInserts()).toBe(1);
    expect(mocks.email).toHaveBeenCalledTimes(1);
    expect(mocks.provision).toHaveBeenCalledTimes(1);
  });
  it("holds a concurrent unique-claim loser without sending", async () => {
    const db = database({ race: true });
    expect(await (await POST(request())).json()).toMatchObject({ duplicate: true });
    expect(db.orderInserts()).toBe(1);
    expect(mocks.provision).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("rejects changed details on a reused submission ID", async () => {
    database(); await POST(request());
    const result = await POST(request({ ...base, items: [{ ...base.items[0], amount: 20 }] }));
    expect(result.status).toBe(409);
    expect(mocks.email).toHaveBeenCalledTimes(1);
  });
  it.each([{ itemFailure: true }, { insertFailure: true }])("sends nothing after a failed save %j", async (option) => {
    database(option);
    const result = await POST(request());
    expect(result.status).toBeGreaterThanOrEqual(500);
    expect(mocks.provision).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("reports failed delivery truthfully and repeat submission does not send again", async () => {
    database(); mocks.email.mockRejectedValue(new Error("provider timeout"));
    expect(await (await POST(request())).json()).toMatchObject({ customerEmailSent: false, deliveryWarning: expect.any(String) });
    expect(await (await POST(request())).json()).toMatchObject({ duplicate: true });
    expect(mocks.email).toHaveBeenCalledTimes(1);
  });
});
