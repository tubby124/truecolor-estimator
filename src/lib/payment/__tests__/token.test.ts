import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodePaymentToken, encodePaymentToken } from "../token";

const QUOTE_ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";

describe("payment token linkage", () => {
  beforeEach(() => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET", "test-payment-secret-that-is-long-enough");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("round-trips a signed quote id and revision", () => {
    const token = encodePaymentToken(111, "Quote", "buyer@example.com", undefined, {
      quoteId: QUOTE_ID,
      quoteRevision: 3,
    });
    expect(decodePaymentToken(token)).toMatchObject({
      amountCents: 11100,
      quoteId: QUOTE_ID,
      quoteRevision: 3,
    });
  });

  it("round-trips a signed order id", () => {
    const token = encodePaymentToken(111, "Order", "buyer@example.com", undefined, {
      orderId: ORDER_ID,
    });
    expect(decodePaymentToken(token)).toMatchObject({
      amountCents: 11100,
      orderId: ORDER_ID,
    });
  });

  it("rejects contextless, mixed, and revisionless token creation", () => {
    expect(() => encodePaymentToken(111, "No context")).toThrow("exactly one");
    expect(() => encodePaymentToken(111, "Mixed", undefined, undefined, {
      quoteId: QUOTE_ID,
      orderId: ORDER_ID,
      quoteRevision: 1,
    })).toThrow("exactly one");
    expect(() => encodePaymentToken(111, "Quote", undefined, undefined, {
      quoteId: QUOTE_ID,
    })).toThrow("positive revision");
  });

  it("rejects a correctly signed legacy token", () => {
    const payload = Buffer.from(JSON.stringify({
      v: 1,
      a: 11100,
      d: "Legacy",
      e: Date.now() + 60_000,
    })).toString("base64url");
    const signature = createHmac("sha256", "test-payment-secret-that-is-long-enough")
      .update(payload)
      .digest("base64url");
    expect(() => decodePaymentToken(`${payload}.${signature}`)).toThrow("Unsupported token version");
  });

  it("rejects tampering with signed linkage", () => {
    const token = encodePaymentToken(111, "Quote", undefined, undefined, {
      quoteId: QUOTE_ID,
      quoteRevision: 1,
    });
    const [payload, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    decoded.q = ORDER_ID;
    const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    expect(() => decodePaymentToken(`${tamperedPayload}.${signature}`)).toThrow("Invalid token signature");
  });
});
