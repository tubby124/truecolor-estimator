/**
 * Shared /pay/{token} link generator — used by the payment-followup cron
 * (chase emails) and the aging-orders digest (staff "Resend payment link").
 *
 * Token is self-contained (no stored state). Amount MUST be the balance due
 * (order total minus counted ledger payments) — never the raw order total —
 * so a chase link can never double-charge a partially-paid customer.
 */

import { encodePaymentToken } from "@/lib/payment/token";
import { nextPaymentAmount, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";

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

export { nextPaymentAmount };
