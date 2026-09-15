import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOrderLedger, remainingBalanceCents } from "@/lib/orders/payLink";
import { preflightWaveBeforeCloverCheckout } from "@/lib/payment/wave-click-preflight";
import { getWaveOnlineInvoiceSnapshot } from "@/lib/wave/invoice";

const PAID_STATUSES = new Set(["payment_received", "in_production", "ready_for_pickup", "complete"]);
// Wave changes an unpaid invoice to SENT/VIEWED when its hosted payment page
// is delivered or opened. Those are still payable states; treating VIEWED as
// terminal strands a customer after their first click.
const PAYABLE_WAVE_STATUSES = new Set(["SAVED", "SENT", "VIEWED", "UNPAID", "OVERDUE", "PARTIAL"]);

interface OnlineOrder {
  total: number | string;
  subtotal: number | string;
  gst: number | string;
  pst: number | string;
  status: string;
  voided_at: string | null;
  paid_at: string | null;
  wave_payment_recorded_at: string | null;
  is_archived: boolean | null;
  wave_invoice_id: string | null;
  wave_invoice_approved_at: string | null;
  quote_wave_state: string | null;
  quote_checkout_state: string | null;
  quote_checkout_expires_at: string | null;
  quote_checkout_url: string | null;
  customers: { email: string | null } | { email: string | null }[] | null;
}

export type WaveOnlineCheckoutResult =
  | {
      action: "ready";
      checkoutUrl: string;
      invoiceId: string;
      invoiceNumber: string;
      amountDueCents: number;
      isPartialBalance: boolean;
    }
  | { action: "already_paid" }
  | { action: "updated_link" };

function cents(value: number | string, label: string): number {
  const amount = Number(value);
  const result = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(result) || Math.abs(amount * 100 - result) > 0.0001) {
    throw new Error(`Stored order ${label} is invalid`);
  }
  return result;
}

function customerEmail(order: OnlineOrder): string {
  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const email = customer?.email?.trim().toLowerCase();
  if (!email) throw new Error("Stored order customer email is unavailable");
  return email;
}

function safeWaveCheckoutUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Wave returned an invalid online invoice URL");
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" || url.username || url.password ||
    !(hostname === "waveapps.com" || hostname.endsWith(".waveapps.com"))
  ) {
    throw new Error("Wave returned an untrusted online invoice URL");
  }
  return url.toString();
}

function isPaid(order: OnlineOrder): boolean {
  return Boolean(order.paid_at || order.wave_payment_recorded_at || PAID_STATUSES.has(order.status));
}

function cloverCheckoutMayStillBeActive(order: OnlineOrder): boolean {
  if (!["creating", "ready", "ambiguous"].includes(order.quote_checkout_state ?? "")) return false;
  const expiresAt = Date.parse(order.quote_checkout_expires_at ?? "");
  return !Number.isFinite(expiresAt) || expiresAt > Date.now();
}

async function loadOrder(supabase: SupabaseClient, orderId: string): Promise<OnlineOrder> {
  const { data, error } = await supabase
    .from("orders")
    .select("total, subtotal, gst, pst, status, voided_at, paid_at, wave_payment_recorded_at, is_archived, wave_invoice_id, wave_invoice_approved_at, quote_wave_state, quote_checkout_state, quote_checkout_expires_at, quote_checkout_url, customers ( email )")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message || "Order lookup failed");
  return data as unknown as OnlineOrder;
}

/**
 * Resolves the existing Wave customer invoice as the only online checkout.
 * Every provider or parity failure is a hard block; callers must not fall back
 * to Clover.
 */
export async function resolveWaveOnlineCheckout(
  supabase: SupabaseClient,
  input: { orderId: string; requestedAmountCents?: number },
): Promise<WaveOnlineCheckoutResult> {
  const initial = await loadOrder(supabase, input.orderId);
  if (initial.voided_at || initial.is_archived || initial.status !== "pending_payment") {
    return isPaid(initial) ? { action: "already_paid" } : { action: "updated_link" };
  }
  if (isPaid(initial)) return { action: "already_paid" };
  const invoiceId = initial.wave_invoice_id?.trim();
  if (
    !invoiceId || !initial.wave_invoice_approved_at?.trim() ||
    initial.quote_wave_state !== "ready"
  ) {
    throw new Error("Wave invoice is not durably ready for online payment");
  }

  const initialBalance = remainingBalanceCents(Number(initial.total), await fetchOrderLedger(supabase, input.orderId));
  if (initialBalance <= 0) return { action: "already_paid" };
  const requestedAmountCents = input.requestedAmountCents ?? initialBalance;
  if (!Number.isSafeInteger(requestedAmountCents) || requestedAmountCents <= 0) {
    throw new Error("Requested payment amount is invalid");
  }

  const preflight = await preflightWaveBeforeCloverCheckout(supabase, {
    orderId: input.orderId,
    waveInvoiceId: invoiceId,
    requestedAmountCents,
  });
  if (preflight.action !== "ready") return preflight;

  const provider = await getWaveOnlineInvoiceSnapshot(invoiceId);
  const current = await loadOrder(supabase, input.orderId);
  if (current.voided_at || current.is_archived || current.status !== "pending_payment") {
    return isPaid(current) ? { action: "already_paid" } : { action: "updated_link" };
  }
  if (isPaid(current)) return { action: "already_paid" };
  if (
    current.wave_invoice_id !== invoiceId || !current.wave_invoice_approved_at?.trim() ||
    current.quote_wave_state !== "ready"
  ) {
    throw new Error("Wave invoice linkage changed during online checkout resolution");
  }
  if (cloverCheckoutMayStillBeActive(current)) {
    throw new Error("An earlier Clover checkout may still be active; Wave checkout is held until it expires");
  }

  const subtotalCents = cents(current.subtotal, "subtotal");
  const gstCents = cents(current.gst, "GST");
  const pstCents = cents(current.pst, "PST");
  const totalCents = cents(current.total, "total");
  if (subtotalCents + gstCents + pstCents !== totalCents) {
    throw new Error("Stored order financials do not reconcile");
  }
  if (
    provider.subtotalCents !== subtotalCents || provider.gstCents !== gstCents ||
    provider.pstCents !== pstCents || provider.totalCents !== totalCents
  ) {
    throw new Error("Wave invoice financials differ from the stored order");
  }

  const balanceCents = remainingBalanceCents(Number(current.total), await fetchOrderLedger(supabase, input.orderId));
  if (balanceCents <= 0) return { action: "already_paid" };
  if (balanceCents !== requestedAmountCents) return { action: "updated_link" };
  if (provider.amountDueCents !== balanceCents) {
    throw new Error("Wave amount due differs from the recorded order balance");
  }
  if (provider.customerEmail.trim().toLowerCase() !== customerEmail(current)) {
    throw new Error("Wave invoice customer differs from the stored order customer");
  }
  if (!PAYABLE_WAVE_STATUSES.has(provider.status)) {
    throw new Error("Wave invoice is not in a payable state");
  }
  if (provider.disableCreditCardPayments && provider.disableBankPayments) {
    throw new Error("Wave online payments are disabled for this invoice");
  }

  return {
    action: "ready",
    checkoutUrl: safeWaveCheckoutUrl(provider.viewUrl),
    invoiceId,
    invoiceNumber: provider.invoiceNumber,
    amountDueCents: balanceCents,
    isPartialBalance: balanceCents < totalCents,
  };
}
