import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendPaymentRequestEmail, type PaymentRequestEmailParams } from "../paymentRequest";

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
}));

vi.mock("../smtp", () => ({
  sendEmail: sendEmailMock,
}));

const baseParams: PaymentRequestEmailParams = {
  orderNumber: "TC-TEST-001",
  contact: { name: "Test Customer", email: "customer@example.com", company: "Test Co" },
  items: [{ product: "Coroplast Signs", qty: 1, amount: 100 }],
  subtotal: 100,
  gst: 5,
  pst: 6,
  total: 111,
  paymentUrl: "https://truecolorprinting.ca/pay/test-token",
  paymentMethod: "clover",
};

describe("payment request email semantics harness", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
  });

  it("frames quote mode as approve-and-pay because quote emails include a payment link", async () => {
    await sendPaymentRequestEmail({ ...baseParams, quoteOnly: true });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0];

    expect(payload.subject).toContain("Your Quote");
    expect(payload.html).toContain("Approve & Pay");
    expect(payload.html).toContain(baseParams.paymentUrl);
    expect(payload.text).toContain("--- APPROVE & PAY ---");
    expect(payload.text).toContain(baseParams.paymentUrl);
    expect(payload.html).not.toContain("We'll send you the invoice once you confirm");
  });

  it("frames invoice mode as a direct payment request with the same payment URL", async () => {
    await sendPaymentRequestEmail({ ...baseParams, quoteOnly: false });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0];

    expect(payload.subject).toContain("Payment Request");
    expect(payload.html).toContain("Payment Request");
    expect(payload.html).toContain(baseParams.paymentUrl);
    expect(payload.text).toContain("--- PAY NOW ---");
    expect(payload.text).toContain(baseParams.paymentUrl);
  });
});
