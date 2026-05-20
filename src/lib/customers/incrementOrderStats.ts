/**
 * Increment a customer's lifetime stats (order_count + total_spent) at
 * payment confirmation. Replaces the old per-order-creation increment
 * which inflated stats for abandoned/unpaid orders.
 *
 * Called from:
 *   - /api/webhooks/clover           (Clover card payment captured)
 *   - /api/staff/orders/[id]/status  (manual payment_received flip)
 *   - /api/staff/orders/[id]/confirm-etransfer (eTransfer confirmed)
 *
 * Idempotent at the call site — each caller only fires when the order
 * actually transitions from pending_payment to payment_received (filtered
 * via .eq("status", "pending_payment") on the update select).
 *
 * Non-fatal — logs but never throws. Customer stats are best-effort and
 * never block a payment confirmation.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function incrementCustomerOrderStats(
  supabase: SupabaseClient,
  customerId: string | null | undefined,
  orderTotal: number,
): Promise<void> {
  if (!customerId || !(orderTotal > 0)) return;
  try {
    const { data: c, error: readErr } = await supabase
      .from("customers")
      .select("order_count, total_spent")
      .eq("id", customerId)
      .single();
    if (readErr || !c) {
      console.error("[incrementCustomerOrderStats] read failed:", readErr?.message ?? "no row");
      return;
    }
    const next = {
      order_count: (c.order_count ?? 0) + 1,
      total_spent: Math.round(((c.total_spent ?? 0) + orderTotal) * 100) / 100,
    };
    const { error: writeErr } = await supabase
      .from("customers")
      .update(next)
      .eq("id", customerId);
    if (writeErr) console.error("[incrementCustomerOrderStats] write failed:", writeErr.message);
  } catch (err) {
    console.error("[incrementCustomerOrderStats] unexpected error:", err);
  }
}
