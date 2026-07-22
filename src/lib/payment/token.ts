/**
 * Payment token — encodes quote amount + description into a signed URL-safe token.
 *
 * The token is embedded in /pay/[token] links in quote emails.
 * Every token is bound to exactly one persisted order or quote. Contextless
 * legacy tokens are intentionally invalid so scanners/reloads cannot create
 * unlinked Clover sessions.
 *
 * Token format: base64url(payload).HMAC-SHA256(payload)
 */

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = 2;
const TOKEN_TTL_DAYS = 30; // aligns with 30-day quote validity

function getSecret(): string {
  const secret = process.env.PAYMENT_TOKEN_SECRET;
  if (!secret) throw new Error("PAYMENT_TOKEN_SECRET not configured");
  return secret;
}

interface TokenPayload {
  v: number;   // version
  a: number;   // amount in cents
  d: string;   // description
  e: number;   // expiry timestamp (ms since epoch)
  em?: string; // customer email (optional)
  r?: string;  // redirect URL after payment (optional)
  q?: string;  // quote_requests UUID (optional; signed, never read from query params)
  o?: string;  // orders UUID (optional; signed, preferred over redirect parsing)
  qr?: number; // structured quote revision (optional; invalidates superseded links)
}

export interface PaymentTokenContext {
  quoteId?: string;
  orderId?: string;
  quoteRevision?: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sign(encoded: string): string {
  return createHmac("sha256", getSecret()).update(encoded).digest("base64url");
}

/**
 * Encodes a payment token. amountDollars is the pre-GST sell price;
 * totalWithGst is what gets stored so the customer pays the right amount.
 */
export function encodePaymentToken(
  totalWithGst: number,
  description: string,
  customerEmail?: string,
  redirectUrl?: string,
  context: PaymentTokenContext = {},
): string {
  const hasQuote = Boolean(context.quoteId);
  const hasOrder = Boolean(context.orderId);
  if (hasQuote === hasOrder) throw new Error("Payment token requires exactly one order or quote context");
  if (hasQuote && (!Number.isSafeInteger(context.quoteRevision) || (context.quoteRevision ?? 0) <= 0)) {
    throw new Error("Quote payment token requires a positive revision");
  }
  const expiry = Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload: TokenPayload = {
    v: TOKEN_VERSION,
    a: Math.round(totalWithGst * 100), // store in cents
    d: description,
    e: expiry,
    ...(customerEmail ? { em: customerEmail } : {}),
    ...(redirectUrl ? { r: redirectUrl } : {}),
    ...(context.quoteId ? { q: context.quoteId } : {}),
    ...(context.orderId ? { o: context.orderId } : {}),
    ...(context.quoteRevision ? { qr: context.quoteRevision } : {}),
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
  customerEmail?: string;
  redirectUrl?: string;
  quoteId?: string;
  orderId?: string;
  quoteRevision?: number;
} {
  const dot = token.lastIndexOf(".");
  if (dot === -1) throw new Error("Invalid token format");

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Verify HMAC signature using constant-time comparison to prevent timing attacks
  const expectedSig = sign(encoded);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    throw new Error("Invalid token signature");
  }

  // Decode payload
  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf-8")
  ) as TokenPayload;

  if (payload.v !== TOKEN_VERSION) throw new Error("Unsupported token version");
  if (Date.now() > payload.e) throw new Error("Payment token expired");
  if (payload.q && !UUID_RE.test(payload.q)) throw new Error("Invalid quote id");
  if (payload.o && !UUID_RE.test(payload.o)) throw new Error("Invalid order id");
  if (payload.qr !== undefined && (!Number.isSafeInteger(payload.qr) || payload.qr <= 0)) {
    throw new Error("Invalid quote revision");
  }
  const hasQuote = Boolean(payload.q);
  const hasOrder = Boolean(payload.o);
  if (hasQuote === hasOrder) throw new Error("Payment token has invalid context");
  if (hasQuote && payload.qr === undefined) throw new Error("Quote payment token has no revision");

  return {
    amountCents: payload.a,
    description: payload.d,
    customerEmail: payload.em,
    redirectUrl: payload.r,
    quoteId: payload.q,
    orderId: payload.o,
    quoteRevision: payload.qr,
  };
}
