import { describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ providerMessageId: "test" }));
vi.mock("../smtp", () => ({ sendEmail }));
import { sendPaymentRequestEmail } from "../paymentRequest";

describe("payable quote email", () => {
  it("includes the payment link without promising a later invoice and retains order linkage", async () => {
    await sendPaymentRequestEmail({
      orderId: "order-123", orderNumber: "TC-123", quoteOnly: true,
      contact: { name: "Customer", email: "customer@example.com" },
      items: [{ product: "Cards", qty: 1, amount: 100 }],
      subtotal: 100, gst: 5, pst: 6, total: 111,
      paymentUrl: "https://example.com/pay/test", paymentMethod: "clover",
    });
    const options = sendEmail.mock.calls[0][0];
    expect(options.orderId).toBe("order-123");
    expect(options.html).toContain("use the payment button to approve and pay");
    expect(options.html).not.toContain("invoice once you confirm");
    expect(options.html).toContain("https://example.com/pay/test");
    expect(options.text).toContain("https://example.com/pay/test");
  });
});


it("sends itemized Wave instructions in HTML and text without Clover wording", async () => {
  sendEmail.mockClear();
  await sendPaymentRequestEmail({
    orderId: "order-wave", orderNumber: "TC-TEST-WAVE",
    contact: { name: "Owner Test", email: "owner@example.test" },
    items: [{ product: "Sticker sample", qty: 2, amount: 0.50 }, { product: "Flyer sample", qty: 1, amount: 0.50 }],
    subtotal: 1, gst: 0.06, pst: 0.06, total: 1.12,
    paymentUrl: "https://truecolorprinting.ca/pay/test-wave", paymentMethod: "wave",
  });
  const sent = sendEmail.mock.calls[0][0];
  for (const body of [sent.html, sent.text]) {
    expect(body).toMatch(/Wave/i);
    expect(body).not.toContain("Clover");
    expect(body).toContain("Sticker sample");
    expect(body).toContain("Flyer sample");
    expect(body).toContain("$1.12");
    expect(body).toContain("GST");
    expect(body).toContain("PST");
  }
});
