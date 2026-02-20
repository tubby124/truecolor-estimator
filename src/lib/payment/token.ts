/**
 * Payment token — encodes quote amount + description into a signed URL-safe token.
 *
 * The token is embedded in /pay/[token] links in quote emails.
 * On every click, the gateway page decodes it and creates a fresh Clover session.
 *
 * Token format: base64url(payload).HMAC-SHA256(payload)
 */

import { createHmac } from "crypto";

const TOKEN_VERSION = 1;
const TOKEN_TTL_DAYS = 30; // aligns with 30-day quote validity

function getSecret(): string {
  const secret = process.env.PAYMENT_TOKEN_SECRET;
  if (!secret) throw new Error("PAYMENT_TOKEN_SECRET not configured");
  return secret;
}

interface TokenPayload {
  v: number;  // version
  a: number;  // amount in cents
  d: string;  // description
  e: number;  // expiry timestamp (ms since epoch)
}

function sign(encoded: string): string {
  return createHmac("sha256", getSecret()).update(encoded).digest("base64url");
}

/**
 * Encodes a payment token. amountDollars is the pre-GST sell price;
 * totalWithGst is what gets stored so the customer pays the right amount.
 */
export function encodePaymentToken(totalWithGst: number, description: string): string {
  const expiry = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    a: Math.round(totalWithGst * 100), // store in cents
    d: description,
    e: expiry,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

/**
 * Decodes and verifies a payment token.
 * Returns { amountCents, description } or throws on invalid / expired token.
 */
export function decodePaymentToken(token: string): {
  amountCents: number;
  description: string;
} {
  const dot = token.lastIndexOf(".");
  if (dot === -1) throw new Error("Invalid token format");

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Verify HMAC signature
  const expectedSig = sign(encoded);
  if (sig !== expectedSig) throw new Error("Invalid token signature");

  // Decode payload
  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf-8")
  ) as TokenPayload;

  if (payload.v !== TOKEN_VERSION) throw new Error("Unsupported token version");
  if (Date.now() > payload.e) throw new Error("Payment token expired");

  return {
    amountCents: payload.a,
    description: payload.d,
  };
}
