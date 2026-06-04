import { buildSplitPaymentPlan, type SplitPaymentAllocation } from "./split-plan";
import type { OrderPaymentPayer } from "./order-ledger";

export interface SplitPaymentLinkIntentInput {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  siteUrl: string;
  allocations: SplitPaymentAllocation[];
}

export interface SplitPaymentLinkIntent {
  orderId: string;
  orderNumber: string;
  amount: number;
  amountCents: number;
  payer: OrderPaymentPayer;
  description: string;
  customerEmail?: string;
  successRedirectUrl: string;
  externalReference: string;
}

function cleanSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function payerLabel(payer: OrderPaymentPayer): string {
  return payer.company?.trim()
    || payer.name?.trim()
    || payer.email?.trim()
    || "Split payer";
}

export function buildSplitPaymentLinkIntents(input: SplitPaymentLinkIntentInput): SplitPaymentLinkIntent[] {
  const cloverAllocations = input.allocations.filter((allocation) => allocation.method === "clover");
  if (cloverAllocations.length !== input.allocations.length) {
    throw new Error("Clover link intents can only be generated for Clover allocations");
  }

  const plan = buildSplitPaymentPlan(input.orderTotal, input.allocations);
  const siteUrl = cleanSiteUrl(input.siteUrl);
  const successRedirectUrl = `${siteUrl}/order-confirmed?oid=${input.orderId}`;

  return plan.entries.map((entry, index) => {
    const payer = entry.payer ?? {};
    const label = payerLabel(payer);
    const amount = Math.round(entry.amount * 100) / 100;

    return {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      amount,
      amountCents: Math.round(amount * 100),
      payer,
      description: `${input.orderNumber} split payment — ${label}`,
      customerEmail: payer.email ?? undefined,
      successRedirectUrl,
      externalReference: `split:${input.orderId}:${index + 1}`,
    };
  });
}
