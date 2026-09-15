import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), document: vi.fn(), send: vi.fn(), audit: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ requireStaffUser: mocks.auth, createServiceClient: () => ({ from: mocks.from }) }));
vi.mock("@/lib/wave/invoice", () => ({ getWavePaidInvoiceDocument: mocks.document, sendWaveInvoice: mocks.send }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));

import { GET, POST } from "../route";

let status: string;
let waveInvoiceId: string | null;
function orderQuery() {
  const query: Record<string, unknown> = {};
  query.select = () => query;
  query.eq = () => query;
  query.single = async () => ({
    data: {
      id: "order", order_number: "TC-TEST", status, wave_invoice_id: waveInvoiceId,
      customers: { name: "Test", email: "test@example.test" },
    },
    error: null,
  });
  return query;
}
function context() { return { params: Promise.resolve({ id: "order" }) }; }

beforeEach(() => {
  vi.clearAllMocks();
  status = "payment_received";
  waveInvoiceId = "wave-invoice";
  mocks.auth.mockResolvedValue({ email: "staff@example.test" });
  mocks.from.mockReturnValue(orderQuery());
  mocks.document.mockResolvedValue({ invoiceNumber: "W-100", viewUrl: "https://wave.example.test/paid" });
  mocks.send.mockResolvedValue(undefined);
  mocks.audit.mockResolvedValue(undefined);
});

describe("staff Wave paid-invoice actions", () => {
  it("requires staff authorization", async () => {
    mocks.auth.mockResolvedValue(NextResponse.json({}, { status: 401 }));
    expect((await GET(new NextRequest("https://example.test"), context())).status).toBe(401);
  });

  it("opens only a Wave-confirmed paid document", async () => {
    const response = await GET(new NextRequest("https://example.test"), context());
    expect(await response.json()).toEqual(expect.objectContaining({ documentUrl: "https://wave.example.test/paid", invoiceNumber: "W-100" }));
    expect(mocks.document).toHaveBeenCalledWith("wave-invoice");
  });

  it("blocks a paid-document action for an unpaid order", async () => {
    status = "pending_payment";
    expect((await GET(new NextRequest("https://example.test"), context())).status).toBe(409);
    expect(mocks.document).not.toHaveBeenCalled();
  });

  it("emails the official Wave paid invoice and records provider acceptance", async () => {
    const response = await POST(new NextRequest("https://example.test", { method: "POST" }), context());
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, accepted: true, email: "test@example.test" }));
    expect(mocks.send).toHaveBeenCalledWith("wave-invoice", "test@example.test", expect.objectContaining({ subject: "Paid invoice — Order TC-TEST" }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.objectContaining({ channel: "wave", outcome: "accepted" }) }));
  });
});
