import { describe, expect, it, vi } from "vitest";
import {
  materializeQuoteOrder,
  getQuoteTaxRates,
  resolveStoredQuotePaymentBreakdown,
  validateStructuredQuotePricing,
  type StructuredQuotePricing,
} from "../quote-order";

const validPricing: StructuredQuotePricing = {
  quoteId: "11111111-1111-4111-8111-111111111111",
  subtotalCents: 10000,
  gstCents: 500,
  pstCents: 600,
  totalCents: 11100,
  description: "Structured quote",
  lineItems: [{ description: "Banner", qty: "2", unitPrice: "50.00", taxClass: "printed_good" }],
};

describe("structured quote pricing", () => {
  it("synchronizes DB tax rates from canonical pricing config", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { gst_rate: 0.05, pst_rate: 0.06 }, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const upsert = vi.fn().mockReturnValue({ select });
    const client = { from: vi.fn().mockReturnValue({ upsert }) } as never;
    await expect(getQuoteTaxRates(client)).resolves.toEqual({ gstRate: 0.05, pstRate: 0.06 });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ gst_rate: 0.05, pst_rate: 0.06 }), { onConflict: "id" });
  });

  it("accepts only an exact subtotal/GST/PST reconciliation", () => {
    expect(() => validateStructuredQuotePricing(validPricing)).not.toThrow();
    expect(() => validateStructuredQuotePricing({ ...validPricing, totalCents: 11099 }))
      .toThrow("must reconcile exactly");
  });

  it("refuses arbitrary totals without structured line items", () => {
    expect(() => validateStructuredQuotePricing({ ...validPricing, lineItems: [] }))
      .toThrow("Structured quote line items are required");
  });

  it("requires line items to reconcile to pretax subtotal", () => {
    expect(() => validateStructuredQuotePricing({
      ...validPricing,
      lineItems: [{ description: "Banner", qty: "1", unitPrice: "99.99", taxClass: "printed_good" }],
    })).toThrow("do not reconcile to the subtotal");
  });

  it("uses only the signed revision and exact stored cents for payment review", () => {
    const stored = {
      quote_subtotal_cents: 10000,
      quote_gst_cents: 500,
      quote_pst_cents: 600,
      quote_total_cents: 11100,
      quote_revision: 4,
    };
    expect(resolveStoredQuotePaymentBreakdown(stored, 11100, 4)).toEqual({
      subtotalCents: 10000,
      gstCents: 500,
      pstCents: 600,
      totalCents: 11100,
    });
    expect(resolveStoredQuotePaymentBreakdown(stored, 11101, 4)).toBeNull();
    expect(resolveStoredQuotePaymentBreakdown(stored, 11100, 3)).toBeNull();
    expect(resolveStoredQuotePaymentBreakdown({ ...stored, quote_pst_cents: 599 }, 11100, 4)).toBeNull();
  });
});

describe("materializeQuoteOrder RPC wrapper", () => {
  it("returns the same durable order result across retries", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        order_id: "22222222-2222-4222-8222-222222222222",
        order_number: "TC-2026-0123",
        order_status: "pending_payment",
        total_cents: 11100,
        checkout_action: "create",
        checkout_reservation_id: "33333333-3333-4333-8333-333333333333",
        checkout_url: null,
      }],
      error: null,
    });
    const client = { rpc } as never;
    const first = await materializeQuoteOrder(client, validPricing.quoteId, 11100, 4);
    const retry = await materializeQuoteOrder(client, validPricing.quoteId, 11100, 4);
    expect(retry).toEqual(first);
    expect(first.checkoutAction).toBe("create");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("materialize_quote_order", {
      p_quote_id: validPricing.quoteId,
      p_signed_amount_cents: 11100,
      p_signed_quote_revision: 4,
    });
  });
});
