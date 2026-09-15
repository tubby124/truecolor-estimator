import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  renderToBuffer: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: mocks.renderToBuffer }));
vi.mock("@/lib/receipt/ReceiptPdf", () => ({ ReceiptPdf: () => null }));

import { GET } from "../route";

const order = {
  id: "order-1",
  order_number: "TC-TEST",
  status: "payment_received",
  receipt_token: "receipt-token",
  subtotal: 100,
  gst: 5,
  pst: 6,
  pst_exempt: false,
  pst_vendor_number: null,
  total: 111,
  is_rush: false,
  discount_code: null,
  discount_amount: null,
  payment_method: "clover_card",
  created_at: "2026-09-15T12:00:00.000Z",
  order_items: [],
  customers: { name: "Test Customer", email: "customer@example.test", company: null },
};

function rowQuery(data: unknown) {
  return {
    select() { return this; },
    eq() { return this; },
    async single() { return { data, error: null }; },
  };
}

function ledgerQuery(data: unknown, error: unknown = null) {
  return {
    select() { return this; },
    eq() { return this; },
    async order() { return { data, error }; },
  };
}

function request(token = "receipt-token") {
  return GET(
    new NextRequest(`https://example.test/api/receipt/order-1/pdf?token=${token}`),
    { params: Promise.resolve({ oid: "order-1" }) },
  );
}

describe("receipt PDF payment sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SECRET_KEY = "test-secret";
    mocks.renderToBuffer.mockResolvedValue(Buffer.from("pdf"));
  });

  it("loads actual ledger providers after token authorization", async () => {
    const from = vi.fn((table: string) => table === "orders"
      ? rowQuery(order)
      : ledgerQuery([
          { amount: 50, method: "wave", status: "recorded" },
          { amount: 61, method: "clover", status: "recorded" },
        ]));
    mocks.createClient.mockReturnValue({ from });

    const response = await request();

    expect(response.status).toBe(200);
    expect(from.mock.calls.map(([table]) => table)).toEqual(["orders", "order_payments"]);
    const element = mocks.renderToBuffer.mock.calls[0][0] as { props: { data: { paymentSources: string[]; paymentPending: boolean } } };
    expect(element.props.data.paymentSources).toEqual(["wave", "clover"]);
    expect(element.props.data.paymentPending).toBe(false);
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="Receipt-TC-TEST.pdf"');
  });

  it("does not load ledger data before token authorization succeeds", async () => {
    const from = vi.fn(() => rowQuery(order));
    mocks.createClient.mockReturnValue({ from });

    const response = await request("wrong-token");

    expect(response.status).toBe(403);
    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.renderToBuffer).not.toHaveBeenCalled();
  });

  it("renders payment pending for an unpaid summary when the ledger read fails", async () => {
    const pendingOrder = { ...order, status: "pending_payment" };
    const from = vi.fn((table: string) => table === "orders"
      ? rowQuery(pendingOrder)
      : ledgerQuery(null, { message: "unavailable" }));
    mocks.createClient.mockReturnValue({ from });

    expect((await request()).status).toBe(200);
    const element = mocks.renderToBuffer.mock.calls[0][0] as { props: { data: { paymentSources: string[]; paymentPending: boolean } } };
    expect(element.props.data.paymentSources).toEqual(["recorded"]);
    expect(element.props.data.paymentPending).toBe(true);
  });

  it("shows the actual source for a partial payment on an unpaid summary", async () => {
    const pendingOrder = { ...order, status: "pending_payment" };
    const from = vi.fn((table: string) => table === "orders"
      ? rowQuery(pendingOrder)
      : ledgerQuery([{ amount: 50, method: "wave", status: "recorded" }]));
    mocks.createClient.mockReturnValue({ from });

    expect((await request()).status).toBe(200);
    const element = mocks.renderToBuffer.mock.calls[0][0] as { props: { data: { paymentSources: string[]; paymentPending: boolean } } };
    expect(element.props.data).toEqual(expect.objectContaining({
      paymentSources: ["wave"],
      paymentPending: false,
    }));
  });
});
