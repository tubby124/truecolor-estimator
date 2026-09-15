/** Shared preflight for order-scoped Clover links. No payment is inferred from status labels. */
export interface PaymentReadiness {
  status?: string | null;
  paid_at?: string | null;
  voided_at?: string | null;
  is_archived?: boolean | null;
  wave_invoice_id?: string | null;
  wave_invoice_approved_at?: string | null;
  wave_payment_recorded_at?: string | null;
  quote_wave_state?: string | null;
  quote_checkout_state?: string | null;
  quote_request_id?: string | null;
}

export function paymentLinkBlock(order: PaymentReadiness): string | null {
  if (order.voided_at || order.is_archived) return "This order is voided or archived. No payment link can be issued.";
  if (order.paid_at || order.wave_payment_recorded_at || order.status !== "pending_payment") {
    return "Payment is already recorded. Reconcile the payment before requesting more money.";
  }
  if (!order.wave_invoice_id || !order.wave_invoice_approved_at || order.quote_wave_state !== "ready") {
    return "The invoice needs repair before payment can be requested. No payment link was issued.";
  }
  if (order.quote_checkout_state === "ambiguous" || order.quote_checkout_state === "creating") {
    return "An earlier checkout needs verification before another payment link can be issued.";
  }
  if (order.quote_request_id) return "This quote-linked order needs its original quote payment flow. No replacement link was issued.";
  return null;
}
