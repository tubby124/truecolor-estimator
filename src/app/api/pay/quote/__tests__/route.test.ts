import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  decodeToken: vi.fn(),
  materialize: vi.fn(),
  failReservation: vi.fn(),
  provisionWave: vi.fn(),
  preflight: vi.fn(),
  createClover: vi.fn(),
  recordAttempt: vi.fn(),
  audit: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock("@/lib/payment/token", () => ({ decodePaymentToken: mocks.decodeToken }));
vi.mock("@/lib/payment/quote-order", () => ({
  materializeQuoteOrder: mocks.materialize,
  failQuoteCheckoutReservation: mocks.failReservation,
  completeQuoteCheckoutReservation: vi.fn(),
}));
vi.mock("@/lib/payment/quote-wave", () => ({
  provisionQuoteWaveInvoice: mocks.provisionWave,
  QuoteWaveProvisioningError: class QuoteWaveProvisioningError extends Error {
    ambiguous = true;
  },
}));
vi.mock("@/lib/payment/wave-click-preflight", () => ({ preflightWaveBeforeCloverCheckout: mocks.preflight }));
vi.mock("@/lib/payment/clover", () => ({
  createCloverCheckout: mocks.createClover,
  CloverCheckoutError: class CloverCheckoutError extends Error { outcome = "definitive"; },
}));
vi.mock("@/lib/payments/attempts", () => ({ recordPaymentAttempt: mocks.recordAttempt }));
vi.mock("@/lib/audit/record", () => ({ recordAuditEvent: mocks.audit }));
vi.mock("@/lib/rateLimit", () => ({ rateLimit: mocks.rateLimit, getClientIp: () => "127.0.0.1" }));

import { POST } from "../route";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = "quote-token";

function request() {
  return new NextRequest("https://truecolorprinting.ca/api/pay/quote", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: TOKEN }),
  });
}

function quoteOrder(overrides: Record<string, unknown> = {}) {
  return {
    orderId: ORDER_ID,
    orderNumber: "TC-2026-0001",
    totalCents: 10_000,
    status: "pending_payment",
    checkoutAction: "create",
    checkoutReservationId: "reservation-1",
    checkoutUrl: null,
    ...overrides,
  };
}

describe("quote checkout Wave preflight response boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServiceClient.mockReturnValue({});
    mocks.decodeToken.mockReturnValue({
      quoteId: "22222222-2222-4222-8222-222222222222",
      quoteRevision: 1,
      amountCents: 10_000,
      description: "Quote payment",
      customerEmail: "customer@example.test",
    });
    mocks.materialize.mockReturnValue(quoteOrder());
    mocks.provisionWave.mockResolvedValue({ action: "ready", invoiceId: "wave-invoice-1" });
    mocks.rateLimit.mockReturnValue(true);
    mocks.failReservation.mockRejectedValue(new Error("reservation no longer creating"));
    mocks.audit.mockResolvedValue(undefined);
  });

  it("redirects to the existing order confirmation after full Wave payment even when cleanup cannot release the reservation", async () => {
    mocks.preflight.mockResolvedValue({ action: "already_paid" });

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://truecolorprinting.ca/order-confirmed?oid=${ORDER_ID}`);
    expect(mocks.failReservation).toHaveBeenCalledTimes(1);
    expect(mocks.createClover).not.toHaveBeenCalled();
  });

  it("returns the stale-link page after partial Wave payment even when cleanup cannot release the reservation", async () => {
    mocks.preflight.mockResolvedValue({ action: "updated_link" });

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://truecolorprinting.ca/pay/${TOKEN}?state=stale`);
    expect(mocks.failReservation).toHaveBeenCalledTimes(1);
    expect(mocks.createClover).not.toHaveBeenCalled();
  });

  it("returns the error page after Wave verification failure even when cleanup cannot release the reservation", async () => {
    mocks.preflight.mockRejectedValue(new Error("Wave read timeout"));

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://truecolorprinting.ca/pay/${TOKEN}?state=error`);
    expect(mocks.failReservation).toHaveBeenCalledTimes(1);
    expect(mocks.createClover).not.toHaveBeenCalled();
  });

  it("keeps a resumed Clover URL closed after a partial Wave payment", async () => {
    mocks.materialize.mockReturnValue(quoteOrder({
      checkoutAction: "resume",
      checkoutReservationId: null,
      checkoutUrl: "https://checkout.clover.com/old-session",
    }));
    mocks.preflight.mockResolvedValue({ action: "updated_link" });

    const response = await POST(request());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://truecolorprinting.ca/pay/${TOKEN}?state=stale`);
    expect(mocks.failReservation).not.toHaveBeenCalled();
    expect(mocks.createClover).not.toHaveBeenCalled();
  });
});
