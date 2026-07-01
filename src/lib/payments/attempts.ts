export type PaymentAttemptStatus =
  | "checkout_opened"
  | "card_declined"
  | "payment_captured"
  | "webhook_missing_recovered"
  | "abandoned"
  | "ambiguous";

export interface PaymentAttemptInput {
  order_id?: string | null;
  provider?: "clover";
  status: PaymentAttemptStatus;
  amount?: number | null;
  clover_checkout_session_id?: string | null;
  clover_order_id?: string | null;
  clover_payment_id?: string | null;
  failure_code?: string | null;
  failure_label?: string | null;
  failure_detail?: string | null;
  customer_message?: string | null;
  raw_event?: unknown;
}

export interface LatestPaymentAttempt {
  status: PaymentAttemptStatus;
  amount: number | null;
  failure_label: string | null;
  failure_detail: string | null;
  customer_message: string | null;
  clover_checkout_session_id: string | null;
  clover_payment_id: string | null;
  raw_event?: unknown;
  created_at: string;
}

type SupabaseLike = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  };
};

export const DECLINE_LABELS: Record<string, string> = {
  ECOMM_VALIDATE_POSTAL_CODE_MATCH: "Postal code did not match",
  ECOMM_VALIDATE_CVV_MATCH: "CVV did not match",
  REJECT: "Card rejected by the bank",
  FRAUD: "Declined by fraud prevention",
};

export function customerMessageForAttempt(status: PaymentAttemptStatus, label?: string | null): string {
  if (status === "card_declined") {
    if (label) return `${label}. Please try again or use e-Transfer.`;
    return "Payment did not complete. Please try again or use e-Transfer.";
  }
  if (status === "abandoned") {
    return "Payment was not completed. Your card was not charged by this attempt.";
  }
  if (status === "payment_captured" || status === "webhook_missing_recovered") {
    return "Payment received. Thank you.";
  }
  return "Secure checkout opened. We are waiting for payment confirmation.";
}

export async function recordPaymentAttempt(
  supabase: SupabaseLike,
  input: PaymentAttemptInput,
): Promise<void> {
  const row: Record<string, unknown> = {
    order_id: input.order_id ?? null,
    provider: input.provider ?? "clover",
    status: input.status,
    amount: input.amount ?? null,
    clover_checkout_session_id: input.clover_checkout_session_id ?? null,
    clover_order_id: input.clover_order_id ?? null,
    clover_payment_id: input.clover_payment_id ?? null,
    failure_code: input.failure_code ?? null,
    failure_label: input.failure_label ?? null,
    failure_detail: input.failure_detail ?? null,
    customer_message: input.customer_message ?? customerMessageForAttempt(input.status, input.failure_label),
    raw_event: input.raw_event ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("payment_attempts").insert(row);
  if (error) {
    console.error("[payment-attempts] insert failed (non-fatal):", error.message);
  }
}

export function formatAttemptAge(createdAt: string, now = Date.now()): string {
  const ageMs = Math.max(0, now - new Date(createdAt).getTime());
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
