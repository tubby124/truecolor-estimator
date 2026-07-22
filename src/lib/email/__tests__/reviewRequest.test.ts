import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("../smtp", () => ({ sendEmail }));

import { sendReviewRequestEmail } from "../reviewRequest";

describe("sendReviewRequestEmail", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ providerMessageId: "resend-1" });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("links, schedules, and deduplicates the logical order email", async () => {
    await sendReviewRequestEmail({
      orderId: "order-1",
      customerId: "customer-1",
      customerName: "Jamie Customer",
      customerEmail: "jamie@example.com",
      orderNumber: "TC-1001",
      scheduledAt: "2026-07-22T18:00:00.000Z",
      items: [{ product_name: "Coroplast Signs", qty: 2 }],
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jamie@example.com",
        orderId: "order-1",
        customerId: "customer-1",
        scheduledAt: "2026-07-22T18:00:00.000Z",
        idempotencyKey: "review-request/order-1",
        tags: [{ name: "email_type", value: "review_request" }],
        subject: "How did your 2 coroplast signs turn out?",
      })
    );
  });
});
