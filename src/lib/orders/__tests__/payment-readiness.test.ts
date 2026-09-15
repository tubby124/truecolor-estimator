import { describe, expect, it } from "vitest";
import { paymentLinkBlock } from "../payment-readiness";
const ready = { status: "pending_payment", wave_invoice_id: "invoice", wave_invoice_approved_at: "2026-01-01", quote_wave_state: "ready" };
describe("payment link preflight", () => {
  it("allows an approved unpaid order", () => expect(paymentLinkBlock(ready)).toBeNull());
  it("blocks a provider-paid order before local status catches up", () => expect(paymentLinkBlock({ ...ready, wave_payment_recorded_at: "2026-01-01" })).toMatch(/already recorded/));
  it("blocks orphan/ambiguous invoice preparation", () => expect(paymentLinkBlock({ ...ready, wave_invoice_id: null, quote_wave_state: "ambiguous" })).toMatch(/invoice needs repair/));
  it.each(["ambiguous", "creating"])("blocks %s checkout", state => expect(paymentLinkBlock({ ...ready, quote_checkout_state: state })).toMatch(/earlier checkout/));
  it("blocks archived and quote-linked replacement links", () => {
    expect(paymentLinkBlock({ ...ready, is_archived: true })).toMatch(/archived/);
    expect(paymentLinkBlock({ ...ready, quote_request_id: "quote" })).toMatch(/original quote/);
  });
});
