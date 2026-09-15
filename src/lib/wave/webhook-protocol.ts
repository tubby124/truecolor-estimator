import { createHmac, timingSafeEqual } from "node:crypto";

/** Wave's current timestamped raw-body protocol; no legacy replayable fallback. */
export function verifyWaveWebhookSignature(signature: string, timestampHeader: string, body: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const parts = signature.split(",").map(p => p.trim());
  if (parts.length !== 2) return false;
  const timestamp = parts.find(p => /^t=\d+$/.test(p))?.slice(2);
  const digest = parts.find(p => /^v1=[a-f0-9]{64}$/i.test(p))?.slice(3);
  if (!timestamp || !digest || timestamp !== timestampHeader) return false;
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) || Math.abs(nowSeconds - seconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest();
  const received = Buffer.from(digest, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function wavePaymentEventInvoice(event: Record<string, unknown>, configuredBusinessId: string): { eventType: string; invoiceId: string } | null {
  if (typeof event.event_type !== "string" || !["invoice.paid", "invoice.partially_paid", "invoice.overpaid"].includes(event.event_type)) return null;
  const business = Buffer.from(configuredBusinessId, "base64").toString("utf8");
  if (!business.startsWith("Business:") || event.business_id !== business.slice("Business:".length)) throw new Error("Wave business does not match configured account");
  const data = event.data;
  const invoiceId = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>).invoice_id : undefined;
  // Invoice IDs are normally decimal strings; Wave also documents UUID resources.
  if (typeof invoiceId !== "string" || !/^(?:\d{1,40}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(invoiceId)) throw new Error("Wave invoice ID is invalid");
  return { eventType: event.event_type, invoiceId: Buffer.from(`${business};Invoice:${invoiceId}`).toString("base64") };
}
