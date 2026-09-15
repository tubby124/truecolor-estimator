import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOrderLedger, remainingBalanceCents } from "@/lib/orders/payLink";
import { reconcileWaveInvoicePayments } from "@/lib/wave/payments";

const PAID_STATUSES = new Set(["payment_received", "in_production", "ready_for_pickup", "complete"]);
const ACCEPTED_OUTCOMES = new Set(["transitioned", "partial", "overpaid", "already_processed"]);

interface ClickTimeOrder {
  total: number | string;
  status: string;
  voided_at: string | null;
  paid_at: string | null;
  wave_payment_recorded_at: string | null;
  is_archived: boolean | null;
  wave_invoice_id: string | null;
  wave_invoice_approved_at: string | null;
  quote_wave_state: string | null;
}

export type WaveClickPreflightResult =
  | { action: "already_paid" }
  | { action: "updated_link" }
  | { action: "ready"; isPartialBalance: boolean };

function isDurablyApprovedWaveInvoice(order: ClickTimeOrder, expectedInvoiceId: string): boolean {
  return order.wave_invoice_id === expectedInvoiceId &&
    typeof order.wave_invoice_approved_at === "string" && order.wave_invoice_approved_at.trim().length > 0 &&
    order.quote_wave_state === "ready";
}

function isAlreadyPaid(order: ClickTimeOrder): boolean {
  return Boolean(order.paid_at || order.wave_payment_recorded_at || PAID_STATUSES.has(order.status));
}

/**
 * Reads Wave at the click boundary, accepts only authenticated Wave Payments
 * captures atomically, then re-reads local payment truth before Clover may be
 * resumed or created. Callers must treat any throw as a hard checkout block.
 */
export async function preflightWaveBeforeCloverCheckout(
  supabase: SupabaseClient,
  input: { orderId: string; waveInvoiceId: string; requestedAmountCents: number },
): Promise<WaveClickPreflightResult> {
  const reconciliation = await reconcileWaveInvoicePayments(supabase, input.waveInvoiceId, {
    enqueueCustomerEffects: false,
    enqueueStaffEffect: true,
  });
  if (reconciliation.acceptances.some((acceptance) => !ACCEPTED_OUTCOMES.has(acceptance.outcome))) {
    throw new Error("Wave provider payment acceptance did not complete");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("total, status, voided_at, paid_at, wave_payment_recorded_at, is_archived, wave_invoice_id, wave_invoice_approved_at, quote_wave_state")
    .eq("id", input.orderId)
    .maybeSingle();
  const order = data as ClickTimeOrder | null;
  if (error || !order) throw new Error(error?.message || "Order re-read after Wave payment check failed");

  if (order.voided_at || order.is_archived) return { action: "updated_link" };
  if (isAlreadyPaid(order)) return { action: "already_paid" };
  if (order.status !== "pending_payment") return { action: "updated_link" };
  if (!isDurablyApprovedWaveInvoice(order, input.waveInvoiceId)) {
    throw new Error("Wave invoice linkage changed during checkout preflight");
  }

  const remainingCents = remainingBalanceCents(Number(order.total), await fetchOrderLedger(supabase, input.orderId));
  if (remainingCents <= 0) return { action: "already_paid" };
  if (remainingCents !== input.requestedAmountCents) return { action: "updated_link" };
  return {
    action: "ready",
    isPartialBalance: remainingCents < Math.round(Number(order.total) * 100),
  };
}
