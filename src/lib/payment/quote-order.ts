import type { SupabaseClient } from "@supabase/supabase-js";
import { getConfigNum } from "@/lib/data/loader";

export interface StructuredQuoteLineItem {
  description: string;
  qty: string | number;
  unitPrice: string | number;
  taxClass: "printed_good" | "design_service" | "rush_service" | "installation_service";
}

export interface StructuredQuotePricing {
  quoteId: string;
  totalCents: number;
  subtotalCents: number;
  gstCents: number;
  pstCents: number;
  description: string;
  lineItems: StructuredQuoteLineItem[];
}

export interface QuoteTaxRates {
  gstRate: number;
  pstRate: number;
}

export interface QuotePaymentBreakdown {
  subtotalCents: number;
  gstCents: number;
  pstCents: number;
  totalCents: number;
}

export interface StoredQuotePaymentBreakdown {
  quote_subtotal_cents: unknown;
  quote_gst_cents: unknown;
  quote_pst_cents: unknown;
  quote_total_cents: unknown;
  quote_revision: unknown;
}

/**
 * Accepts a stored breakdown only when it exactly matches both signed token
 * fields. This validates persisted cents; it never derives tax from a total.
 */
export function resolveStoredQuotePaymentBreakdown(
  row: StoredQuotePaymentBreakdown | null,
  signedAmountCents: number,
  signedQuoteRevision: number | undefined,
): QuotePaymentBreakdown | null {
  if (!row || !Number.isSafeInteger(signedAmountCents) || signedAmountCents <= 0 ||
      typeof signedQuoteRevision !== "number" || !Number.isSafeInteger(signedQuoteRevision) || signedQuoteRevision <= 0) {
    return null;
  }
  const subtotalCents = Number(row.quote_subtotal_cents);
  const gstCents = Number(row.quote_gst_cents);
  const pstCents = Number(row.quote_pst_cents);
  const totalCents = Number(row.quote_total_cents);
  const quoteRevision = Number(row.quote_revision);
  if (
    !isNonNegativeInteger(subtotalCents) ||
    !isNonNegativeInteger(gstCents) ||
    !isNonNegativeInteger(pstCents) ||
    !Number.isSafeInteger(totalCents) || totalCents <= 0 ||
    totalCents !== subtotalCents + gstCents + pstCents ||
    totalCents !== signedAmountCents ||
    quoteRevision !== signedQuoteRevision
  ) {
    return null;
  }
  return { subtotalCents, gstCents, pstCents, totalCents };
}

export async function getQuoteTaxRates(supabase: SupabaseClient): Promise<QuoteTaxRates> {
  const canonical = {
    gstRate: getConfigNum("gst_rate"),
    pstRate: getConfigNum("pst_rate"),
  };
  const { data, error } = await supabase
    .from("truecolor_tax_config")
    .upsert({
      id: true,
      gst_rate: canonical.gstRate,
      pst_rate: canonical.pstRate,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select("gst_rate, pst_rate")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message || "Quote tax configuration is unavailable");
  const gstRate = Number(data.gst_rate);
  const pstRate = Number(data.pst_rate);
  if (!Number.isFinite(gstRate) || gstRate < 0 || !Number.isFinite(pstRate) || pstRate < 0) {
    throw new Error("Quote tax configuration is invalid");
  }
  if (gstRate !== canonical.gstRate || pstRate !== canonical.pstRate) {
    throw new Error("Quote tax configuration did not synchronize to canonical pricing config");
  }
  return canonical;
}

export interface QuoteOrderResult {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  status: string;
  checkoutAction: "create" | "resume" | "wait";
  checkoutReservationId: string | null;
  checkoutUrl: string | null;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function validateStructuredQuotePricing(input: StructuredQuotePricing): void {
  if (
    !Number.isSafeInteger(input.totalCents) || input.totalCents <= 0 ||
    !isNonNegativeInteger(input.subtotalCents) ||
    !isNonNegativeInteger(input.gstCents) ||
    !isNonNegativeInteger(input.pstCents) ||
    input.totalCents !== input.subtotalCents + input.gstCents + input.pstCents
  ) {
    throw new Error("Quote subtotal, GST, PST, and total must reconcile exactly");
  }
  if (!input.description.trim() || input.description.length > 200) {
    throw new Error("Quote description is required");
  }
  if (!Array.isArray(input.lineItems) || input.lineItems.length === 0) {
    throw new Error("Structured quote line items are required for Pay Now");
  }

  let lineSubtotalCents = 0;
  for (const item of input.lineItems) {
    const qty = Number(item.qty);
    const unitPrice = Number(item.unitPrice);
    if (
      !item.description?.trim() || item.description.trim().length > 200 ||
      !["printed_good", "design_service", "rush_service", "installation_service"].includes(item.taxClass) ||
      !Number.isSafeInteger(qty) || qty <= 0 ||
      !Number.isFinite(unitPrice) || unitPrice < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(item.unitPrice).trim())
    ) {
      throw new Error("Quote contains an invalid structured line item");
    }
    lineSubtotalCents += Math.round(qty * unitPrice * 100);
  }
  if (lineSubtotalCents !== input.subtotalCents) {
    throw new Error("Quote line items do not reconcile to the subtotal");
  }
}

function rpcErrorMessage(error: { message?: string } | null, fallback: string): string {
  return error?.message?.trim() || fallback;
}

export async function setStructuredQuotePricing(
  supabase: SupabaseClient,
  input: StructuredQuotePricing,
): Promise<{ convertedOrderId: string | null; orderRepriced: boolean; quoteRevision: number }> {
  validateStructuredQuotePricing(input);
  const { data, error } = await supabase.rpc("set_structured_quote_pricing", {
    p_quote_id: input.quoteId,
    p_total_cents: input.totalCents,
    p_subtotal_cents: input.subtotalCents,
    p_gst_cents: input.gstCents,
    p_pst_cents: input.pstCents,
    p_description: input.description.trim(),
    p_line_items: input.lineItems,
  });
  if (error) throw new Error(rpcErrorMessage(error, "Could not save structured quote pricing"));
  const row = Array.isArray(data) ? data[0] : data;
  const quoteRevision = Number(row?.quote_revision);
  if (!Number.isSafeInteger(quoteRevision) || quoteRevision <= 0) {
    throw new Error("Structured quote pricing RPC returned an invalid revision");
  }
  return {
    convertedOrderId: typeof row?.converted_order_id === "string" ? row.converted_order_id : null,
    orderRepriced: row?.order_repriced === true,
    quoteRevision,
  };
}

export async function materializeQuoteOrder(
  supabase: SupabaseClient,
  quoteId: string,
  signedAmountCents: number,
  signedQuoteRevision: number,
): Promise<QuoteOrderResult> {
  if (
    !Number.isSafeInteger(signedAmountCents) || signedAmountCents <= 0 ||
    !Number.isSafeInteger(signedQuoteRevision) || signedQuoteRevision <= 0
  ) {
    throw new Error("Invalid signed quote amount");
  }
  const { data, error } = await supabase.rpc("materialize_quote_order", {
    p_quote_id: quoteId,
    p_signed_amount_cents: signedAmountCents,
    p_signed_quote_revision: signedQuoteRevision,
  });
  if (error) throw new Error(rpcErrorMessage(error, "Could not create quote order"));
  const row = Array.isArray(data) ? data[0] : data;
  if (
    !row || typeof row.order_id !== "string" || typeof row.order_number !== "string" ||
    typeof row.order_status !== "string" || !Number.isFinite(Number(row.total_cents)) ||
    !["create", "resume", "wait"].includes(row.checkout_action)
  ) {
    throw new Error("Quote order RPC returned an invalid result");
  }
  return {
    orderId: row.order_id,
    orderNumber: row.order_number,
    status: row.order_status,
    totalCents: Number(row.total_cents),
    checkoutAction: row.checkout_action,
    checkoutReservationId: typeof row.checkout_reservation_id === "string" ? row.checkout_reservation_id : null,
    checkoutUrl: typeof row.checkout_url === "string" ? row.checkout_url : null,
  };
}

export async function completeQuoteCheckoutReservation(
  supabase: SupabaseClient,
  input: { orderId: string; reservationId: string; checkoutUrl: string; sessionId: string; expiresAt: string },
): Promise<void> {
  const { data, error } = await supabase.rpc("complete_quote_checkout_reservation", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_checkout_url: input.checkoutUrl,
    p_session_id: input.sessionId,
    p_expires_at: input.expiresAt,
  });
  if (error || data !== true) throw new Error(error?.message || "Checkout reservation could not be finalized");
}

export async function failQuoteCheckoutReservation(
  supabase: SupabaseClient,
  input: { orderId: string; reservationId: string; ambiguous: boolean; error: string },
): Promise<void> {
  const { data, error } = await supabase.rpc("fail_quote_checkout_reservation", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_ambiguous: input.ambiguous,
    p_error: input.error,
  });
  if (error || data !== true) throw new Error(error?.message || "Checkout reservation failure could not be recorded");
}

export async function markQuoteSent(
  supabase: SupabaseClient,
  quoteId: string,
  replyBody: string,
  qualifies = false,
): Promise<{ qualificationCreated: boolean }> {
  const { data, error } = await supabase.rpc("mark_quote_sent", {
    p_quote_id: quoteId,
    p_reply_body: replyBody,
    p_qualifies: qualifies,
  });
  if (error) throw new Error(rpcErrorMessage(error, "Could not update quote lifecycle"));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.lifecycle_status !== "string" || typeof row.replied_at !== "string") {
    throw new Error("Quote lifecycle update did not return a row");
  }
  return { qualificationCreated: row.qualification_created === true };
}
