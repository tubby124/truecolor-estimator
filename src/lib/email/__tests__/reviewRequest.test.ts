import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn());
vi.mock("../smtp", () => ({ sendEmail }));
import { sendReviewRequestEmail } from "../reviewRequest";

describe("sendReviewRequestEmail", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ providerMessageId: "resend-1" });
  });

  it("links the initial request to one order with a stable idempotency key", async () => {
    await expect(sendReviewRequestEmail({
      orderId: "order-1", customerId: "customer-1", customerName: "Jamie Customer",
      customerEmail: "jamie@example.com", orderNumber: "TC-1001", touch: "initial",
      items: [{ product_name: "Coroplast Signs", qty: 2 }],
    })).resolves.toEqual({ providerMessageId: "resend-1" });

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "jamie@example.com", orderId: "order-1", customerId: "customer-1",
      idempotencyKey: "review-request/initial/order-1",
      tags: [{ name: "email_type", value: "review_request" }, { name: "review_touch", value: "initial" }],
      subject: "Quick gut check on your 2 coroplast signs",
    }));
  });

  it("uses a different stable key for the one permitted reminder", async () => {
    await sendReviewRequestEmail({
      orderId: "order-1", customerId: "customer-1", customerName: "Jamie Customer",
      customerEmail: "jamie@example.com", orderNumber: "TC-1001", touch: "reminder",
    });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: "review-request/reminder/order-1",
      subject: "One last quick thing about your order",
    }));
  });
});
