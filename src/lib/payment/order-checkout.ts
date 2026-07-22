import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrderCheckoutReservation {
  action: "create" | "resume" | "wait";
  reservationId: string | null;
  checkoutUrl: string | null;
}

function firstRow(data: unknown): Record<string, unknown> | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? row as Record<string, unknown> : null;
}

export async function reserveOrderCheckout(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderCheckoutReservation> {
  const { data, error } = await supabase.rpc("reserve_order_checkout", { p_order_id: orderId });
  if (error) throw new Error(error.message || "Checkout could not be reserved");
  const row = firstRow(data);
  if (!row || !["create", "resume", "wait"].includes(String(row.checkout_action))) {
    throw new Error("Checkout reservation returned an invalid result");
  }
  return {
    action: row.checkout_action as OrderCheckoutReservation["action"],
    reservationId: typeof row.checkout_reservation_id === "string" ? row.checkout_reservation_id : null,
    checkoutUrl: typeof row.checkout_url === "string" ? row.checkout_url : null,
  };
}

export async function completeOrderCheckout(
  supabase: SupabaseClient,
  input: {
    orderId: string;
    reservationId: string;
    checkoutUrl: string;
    sessionId: string;
    expiresAt: string;
  },
): Promise<void> {
  const { data, error } = await supabase.rpc("complete_order_checkout", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_checkout_url: input.checkoutUrl,
    p_session_id: input.sessionId,
    p_expires_at: input.expiresAt,
  });
  if (error || data !== true) throw new Error(error?.message || "Checkout reservation could not be completed");
}

export async function failOrderCheckout(
  supabase: SupabaseClient,
  input: { orderId: string; reservationId: string; ambiguous: boolean; error: string },
): Promise<void> {
  const { data, error } = await supabase.rpc("fail_order_checkout", {
    p_order_id: input.orderId,
    p_reservation_id: input.reservationId,
    p_ambiguous: input.ambiguous,
    p_error: input.error,
  });
  if (error || data !== true) throw new Error(error?.message || "Checkout reservation failure could not be recorded");
}
