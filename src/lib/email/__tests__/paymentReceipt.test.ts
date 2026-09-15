import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn());

vi.mock("../smtp", () => ({ sendEmail }));

import { sendPaymentReceipt } from "../paymentReceipt";

describe("sendPaymentReceipt", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ providerMessageId: "resend-123" });
  });

  it("forwards a stable provider idempotency key for worker retries", async () => {
    await sendPaymentReceipt({
      orderNumber: "TC-0123",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      createdAt: "2026-07-24T12:00:00.000Z",
      items: [
        {
          product_name: "Coroplast Sign",
          qty: 1,
          width_in: 24,
          height_in: 36,
          sides: 1,
          line_total: 100,
        },
      ],
      subtotal: 100,
      gst: 5,
      pst: 6,
      total: 111,
      isRush: false,
      paymentSources: ["wave"],
      oid: "order-123",
      idempotencyKey: "wave-receipt/order-123",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "wave-receipt/order-123",
        orderId: "order-123",
      }),
    );
  });

  it("renders every recorded provider in HTML and plain text", async () => {
    await sendPaymentReceipt({
      orderNumber: "TC-0456",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      createdAt: "2026-09-15T12:00:00.000Z",
      items: [{
        product_name: "Wall Decal",
        qty: 1,
        width_in: 24,
        height_in: 36,
        sides: 1,
        line_total: 100,
      }],
      subtotal: 100,
      gst: 5,
      pst: 6,
      total: 111,
      isRush: false,
      paymentSources: ["wave", "clover"],
      oid: "order-456",
    });

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining("Paid via Wave Payments + Credit / debit card (Clover)"),
      text: expect.stringContaining("Payment:  Wave Payments + Credit / debit card (Clover)"),
    }));
  });
});
