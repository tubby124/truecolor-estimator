import { describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn().mockResolvedValue({ providerMessageId: "test" }));
vi.mock("../smtp", () => ({ sendEmail }));
import { buildPaymentRequestEmail, sendPaymentRequestEmail } from "../paymentRequest";

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
    expect(options.subject).toBe("Your quote & payment link — $111.00 CAD");
    expect(options.html).toContain("Pay securely through Wave to accept this quote");
    expect(options.html).not.toContain("invoice once you confirm");
    expect(options.html).toContain("https://example.com/pay/test");
    expect(options.text).toContain("https://example.com/pay/test");
  });
});

it("renders a non-live preview with one payment CTA before the quote details", () => {
  const rendered = buildPaymentRequestEmail({
    orderNumber: "Preview only", quoteOnly: true,
    contact: { name: "Owner Test", email: "owner@example.test" },
    items: [{ product: "Sign", qty: 1, amount: 20 }],
    subtotal: 20, gst: 1, pst: 1.2, total: 22.2,
    paymentUrl: "#preview-payment-link", paymentMethod: "wave",
  });
  expect(rendered.subject).toBe("Your quote & payment link — $22.20 CAD");
  expect(rendered.html).toContain("#preview-payment-link");
  expect(rendered.html.indexOf("Pay $22.20 securely")).toBeLessThan(rendered.html.indexOf("Order Summary"));
  expect(rendered.html).not.toContain("Clover");
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
