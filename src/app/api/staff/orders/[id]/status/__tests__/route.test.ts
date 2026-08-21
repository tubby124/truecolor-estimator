import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ currentStatus: "ready_for_pickup", sendReview: vi.fn(), audit: vi.fn() }));
const ORDER_ID = "11111111-1111-4111-8111-111111111111";

vi.mock("@/lib/email/reviewRequest", () => ({ sendReviewRequestEmail: harness.sendReview }));
vi.mock("@/lib/email/statusUpdate", () => ({ sendOrderStatusEmail: vi.fn() }));
vi.mock("@/lib/email/paymentReceipt", () => ({ sendPaymentReceipt: vi.fn() }));
vi.mock("@/lib/customers/incrementOrderStats", () => ({ incrementCustomerOrderStats: vi.fn() }));
vi.mock("@/lib/notifications/telegram", () => ({ sendTelegramNotification: vi.fn(), escapeTelegramHtml: (value: string) => value }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: harness.audit }));
vi.mock("@/lib/wave/invoice", () => ({ approveWaveInvoice: vi.fn(), recordWavePayment: vi.fn(), findCustomerByEmail: vi.fn(), getWaveInvoicePublicUrl: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: async () => ({ id: "staff-1", email: "info@true-color.ca" }),
  createServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: harness.currentStatus, order_number: "TC-1001", completed_at: null }, error: null }) }) }),
      update: (values: Record<string, unknown>) => {
        const chain = { eq: () => chain, is: () => chain, select: () => chain, maybeSingle: async () => { if (typeof values.status === "string") harness.currentStatus = values.status; return { data: { id: ORDER_ID }, error: null }; } };
        return chain;
      },
    }),
  }),
}));

import { PATCH } from "../route";

describe("complete-order review lifecycle", () => {
  beforeEach(() => { harness.currentStatus = "ready_for_pickup"; harness.sendReview.mockReset(); });
  afterEach(() => vi.restoreAllMocks());

  it("does not send a review email during the staff completion mutation", async () => {
    const response = await PATCH(new NextRequest(`http://localhost/api/staff/orders/${ORDER_ID}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "complete" }) }), { params: Promise.resolve({ id: ORDER_ID }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, status: "complete" });
    expect(harness.sendReview).not.toHaveBeenCalled();
  });
});
