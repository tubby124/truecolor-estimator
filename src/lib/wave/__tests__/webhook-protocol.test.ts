import { createHmac } from "node:crypto";
import { expect, it } from "vitest";
import { verifyWaveWebhookSignature, wavePaymentEventInvoice } from "../webhook-protocol";
const secret = "fixture-secret", now = 1700000000, body = '{ "event_type": "invoice.paid" }';
function signature(timestamp = now, payload = body) { return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`; }
it("verifies the documented timestamp.raw-body signature", () => {
  expect(verifyWaveWebhookSignature(signature(), String(now), body, secret, now)).toBe(true);
  expect(verifyWaveWebhookSignature(signature(), String(now), body.replace(' ', ''), secret, now)).toBe(false);
  expect(verifyWaveWebhookSignature(signature(), String(now), body, "wrong-secret", now)).toBe(false);
});
it("rejects stale, future, mismatched, missing, duplicate and legacy signature headers", () => {
  for (const t of [now - 301, now + 301]) expect(verifyWaveWebhookSignature(signature(t), String(t), body, secret, now)).toBe(false);
  expect(verifyWaveWebhookSignature(signature(), String(now - 1), body, secret, now)).toBe(false);
  expect(verifyWaveWebhookSignature(signature(), "", body, secret, now)).toBe(false);
  expect(verifyWaveWebhookSignature(signature()+`,t=${now}`, String(now), body, secret, now)).toBe(false);
  expect(verifyWaveWebhookSignature('sha256='+createHmac('sha256',secret).update(body).digest('hex'), String(now), body, secret, now)).toBe(false);
});
it("encodes raw provider IDs with the configured business and rejects identity injection", () => {
  const business = Buffer.from('Business:business-fixture').toString('base64');
  const event = { event_type: 'invoice.paid', business_id: 'business-fixture', data: { invoice_id: '123456789' } };
  expect(wavePaymentEventInvoice(event,business)?.invoiceId).toBe(Buffer.from('Business:business-fixture;Invoice:123456789').toString('base64'));
  expect(() => wavePaymentEventInvoice({...event,data:{invoice_id:'123;Invoice:other'}},business)).toThrow();
  expect(() => wavePaymentEventInvoice({...event,business_id:'other'},business)).toThrow();
});
