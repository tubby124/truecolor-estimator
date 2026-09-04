import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodePaymentToken, encodePaymentToken } from "../token";

const QUOTE_ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const LEGACY_SECRET = "test-payment-secret-that-is-long-enough";
const NEXT_SECRET = "next-payment-secret-that-is-long-enough";

function signedToken(secret: string, payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

describe("payment token linkage", () => {
  beforeEach(() => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET", LEGACY_SECRET);
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", "");
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", "");
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
    const token = signedToken(LEGACY_SECRET, {
      v: 1,
      a: 11100,
      d: "Legacy",
      e: Date.now() + 60_000,
    });
    expect(() => decodePaymentToken(token)).toThrow("Unsupported token version");
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

  it("signs new tokens with the staged next key", () => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", NEXT_SECRET);
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", new Date(Date.now() + 60_000).toISOString());

    const token = encodePaymentToken(111, "Order", undefined, undefined, { orderId: ORDER_ID });
    const [encoded, signature] = token.split(".");
    const legacySignature = createHmac("sha256", LEGACY_SECRET).update(encoded).digest("base64url");
    const nextSignature = createHmac("sha256", NEXT_SECRET).update(encoded).digest("base64url");

    expect(signature).toBe(nextSignature);
    expect(signature).not.toBe(legacySignature);
    expect(decodePaymentToken(token)).toMatchObject({ orderId: ORDER_ID });
  });

  it("accepts a legacy v2 token only before the configured cutoff", () => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", NEXT_SECRET);
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", new Date(Date.now() + 60_000).toISOString());
    const token = signedToken(LEGACY_SECRET, {
      v: 2,
      a: 11100,
      d: "Legacy order",
      e: Date.now() + 60_000,
      o: ORDER_ID,
    });

    expect(decodePaymentToken(token)).toMatchObject({ orderId: ORDER_ID });
  });

  it.each([
    ["without a cutoff", ""],
    ["after its cutoff", new Date(Date.now() - 60_000).toISOString()],
    ["with an invalid cutoff", "not-a-timestamp"],
  ])("rejects a legacy v2 token %s", (_label, cutoff) => {
    vi.stubEnv("PAYMENT_TOKEN_SECRET_NEXT", NEXT_SECRET);
    vi.stubEnv("PAYMENT_TOKEN_LEGACY_UNTIL", cutoff);
    const token = signedToken(LEGACY_SECRET, {
      v: 2,
      a: 11100,
      d: "Legacy order",
      e: Date.now() + 60_000,
      o: ORDER_ID,
    });

    expect(() => decodePaymentToken(token)).toThrow("Invalid token signature");
  });
});
