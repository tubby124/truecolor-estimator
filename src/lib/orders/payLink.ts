/**
 * Shared /pay/{token} link generator — used by the payment-followup cron
 * (chase emails), the aging-orders digest, every staff re-send/recovery path,
 * and the customer-facing retry pages.
 *
 * Token is self-contained (no stored state). Amount MUST be the balance due
 * (order total minus counted ledger payments) — never the raw order total —
 * so a link can never double-charge a partially-paid customer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { encodePaymentToken } from "@/lib/payment/token";
import {
  nextPaymentAmount,
  remainingBalanceCents,
  summarizeOrderPayments,
  type OrderPaymentLedgerEntry,
} from "@/lib/payments/order-ledger";

export interface PayLinkInput {
  orderId: string;
  orderNumber: string;
  total: number;
  customerEmail: string;
  siteUrl: string;
  ledger?: OrderPaymentLedgerEntry[] | null;
}

export function buildPayLink(input: PayLinkInput): string {
  const amount = nextPaymentAmount(input.total, input.ledger ?? []);
  const redirectUrl = `${input.siteUrl}/order-confirmed?oid=${input.orderId}`;
  const token = encodePaymentToken(
    amount,
    `True Color Order ${input.orderNumber}`,
    input.customerEmail,
    redirectUrl,
    { orderId: input.orderId },
  );
  return `${input.siteUrl}/pay/${token}`;
}

/**
 * Ledger entries for one order. Throws on a failed read on purpose: falling
 * back to "nothing paid" would mint a full-total link for a customer who
 * already paid part of the order.
 */
export async function fetchOrderLedger(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderPaymentLedgerEntry[]> {
  const { data, error } = await supabase
    .from("order_payments")
    .select("amount, method, status")
    .eq("order_id", orderId);
  if (error) throw new Error(error.message || "Payment ledger lookup failed");

  return ((data ?? []) as Array<{ amount: number | string; method: string; status: string | null }>)
    .map((row) => ({
      amount: Number(row.amount),
      method: row.method as OrderPaymentLedgerEntry["method"],
      status: (row.status ?? "recorded") as OrderPaymentLedgerEntry["status"],
    }));
}

export interface ResolvedOrderPayLink {
  paymentUrl: string;
  amountDue: number;
  amountDueCents: number;
  amountPaid: number;
  orderTotal: number;
}

/**
 * Ledger-aware link for an existing order — the one call site every path that
 * hands a customer a pay link should use.
 */
export async function resolveOrderPayLink(
  supabase: SupabaseClient,
  input: {
    orderId: string;
    orderNumber: string;
    total: number;
    customerEmail: string;
    siteUrl: string;
  },
): Promise<ResolvedOrderPayLink> {
  const ledger = await fetchOrderLedger(supabase, input.orderId);
  const summary = summarizeOrderPayments(input.total, ledger);

  return {
    paymentUrl: buildPayLink({ ...input, ledger }),
    amountDue: summary.balanceDue,
    amountDueCents: remainingBalanceCents(input.total, ledger),
    amountPaid: summary.amountPaid,
    orderTotal: summary.orderTotal,
  };
}

export { nextPaymentAmount, remainingBalanceCents, summarizeOrderPayments };

