import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  currentStatus: "ready_for_pickup",
  currentCompletedAt: null as string | null,
  existingReview: false,
  sendReview: vi.fn(),
  audit: vi.fn(),
}));

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/lib/email/reviewRequest", () => ({ sendReviewRequestEmail: harness.sendReview }));
vi.mock("@/lib/email/statusUpdate", () => ({ sendOrderStatusEmail: vi.fn() }));
vi.mock("@/lib/email/paymentReceipt", () => ({ sendPaymentReceipt: vi.fn() }));
vi.mock("@/lib/customers/incrementOrderStats", () => ({ incrementCustomerOrderStats: vi.fn() }));
vi.mock("@/lib/notifications/telegram", () => ({
  sendTelegramNotification: vi.fn(),
  escapeTelegramHtml: (value: string) => value,
}));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: harness.audit }));
vi.mock("@/lib/wave/invoice", () => ({
  approveWaveInvoice: vi.fn(),
  recordWavePayment: vi.fn(),
  findCustomerByEmail: vi.fn(),
  getWaveInvoicePublicUrl: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  requireStaffUser: async () => ({ id: "staff-1", email: "info@true-color.ca" }),
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "email_log") {
        return {
          select: () => ({
            eq: () => ({
              ilike: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: harness.existingReview ? { id: "email-1" } : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: (columns: string) => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                status: harness.currentStatus,
                order_number: "TC-1001",
                completed_at: harness.currentCompletedAt,
              },
              error: null,
            }),
            single: async () => ({
              data: {
                order_number: "TC-1001",
                customer_id: CUSTOMER_ID,
                order_items: [{ product_name: "Coroplast Signs", qty: 2 }],
                customers: { name: "Jamie", email: "jamie@example.com" },
                selected_columns: columns,
              },
              error: null,
            }),
          }),
        }),
        update: (values: Record<string, unknown>) => {
          const chain = {
            eq: () => chain,
            is: () => chain,
            select: () => chain,
            maybeSingle: async () => {
            if (typeof values.status === "string") harness.currentStatus = values.status;
            if (typeof values.completed_at === "string") {
              harness.currentCompletedAt = values.completed_at;
            }
              return { data: { id: ORDER_ID }, error: null };
            },
          };
          return chain;
        },
      };
    },
  }),
}));

import { PATCH } from "../route";

function completeOrder() {
  const req = new NextRequest(`http://localhost/api/staff/orders/${ORDER_ID}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "complete" }),
  });
  return PATCH(req, { params: Promise.resolve({ id: ORDER_ID }) });
}

describe("complete-order review scheduling", () => {
  beforeEach(() => {
    harness.currentStatus = "ready_for_pickup";
    harness.currentCompletedAt = null;
    harness.existingReview = false;
    harness.sendReview.mockReset();
    harness.sendReview.mockResolvedValue(undefined);
    harness.audit.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T16:00:00.000Z"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("schedules one linked request exactly two hours after completion", async () => {
    expect((await completeOrder()).status).toBe(200);

    expect(harness.sendReview).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      customerId: CUSTOMER_ID,
      customerName: "Jamie",
      customerEmail: "jamie@example.com",
      orderNumber: "TC-1001",
      scheduledAt: "2026-07-22T18:00:00.000Z",
      items: [{ product_name: "Coroplast Signs", qty: 2 }],
    });
  });

  it("safely retries a recent complete update when the durable log is missing", async () => {
    harness.currentStatus = "complete";
    harness.currentCompletedAt = "2026-07-22T15:55:00.000Z";

    expect((await completeOrder()).status).toBe(200);
    expect(harness.sendReview).toHaveBeenCalledOnce();
  });

  it("does not reschedule an order with a durable review log", async () => {
    harness.existingReview = true;

    expect((await completeOrder()).status).toBe(200);
    expect(harness.sendReview).not.toHaveBeenCalled();
  });

  it("keeps the completed status successful when scheduling fails", async () => {
    harness.sendReview.mockRejectedValueOnce(new Error("provider unavailable"));

    const response = await completeOrder();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      status: "complete",
      reviewRequestWarning:
        "Order completed, but the review request needs a safe retry within 23 hours.",
    });
  });

  it("reuses the original completion time and payload on a safe retry", async () => {
    harness.sendReview.mockRejectedValueOnce(new Error("provider unavailable"));

    await completeOrder();
    expect(harness.currentCompletedAt).toBe("2026-07-22T16:00:00.000Z");

    harness.sendReview.mockResolvedValueOnce(undefined);
    vi.setSystemTime(new Date("2026-07-22T16:10:00.000Z"));
    await completeOrder();

    expect(harness.currentCompletedAt).toBe("2026-07-22T16:00:00.000Z");
    expect(harness.sendReview).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ scheduledAt: "2026-07-22T18:00:00.000Z" })
    );
  });

  it("refuses an unverified retry after the provider idempotency window", async () => {
    harness.currentStatus = "complete";
    harness.currentCompletedAt = "2026-07-20T16:00:00.000Z";

    const response = await completeOrder();
    expect(response.status).toBe(200);
    expect(harness.sendReview).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      reviewRequestWarning: expect.stringContaining("safe provider idempotency window"),
    });
  });
});
