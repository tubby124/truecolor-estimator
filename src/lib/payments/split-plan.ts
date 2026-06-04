import { summarizeOrderPayments, type OrderPaymentLedgerEntry, type OrderPaymentMethod, type OrderPaymentPayer } from "./order-ledger";

export interface SplitPaymentAllocation {
  amount: number;
  method: OrderPaymentMethod;
  payer: OrderPaymentPayer;
  externalReference?: string | null;
}

export interface SplitPaymentPlan {
  entries: OrderPaymentLedgerEntry[];
  amountAllocated: number;
  remainingUnallocated: number;
  coversOrder: boolean;
}

export function buildSplitPaymentPlan(
  orderTotal: number,
  allocations: SplitPaymentAllocation[],
  opts: { requireFullAllocation?: boolean } = {}
): SplitPaymentPlan {
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    throw new Error("Order total must be greater than zero");
  }

  if (allocations.length < 1) {
    throw new Error("At least one payment allocation is required");
  }

  const entries = allocations.map((allocation, index): OrderPaymentLedgerEntry => {
    if (!Number.isFinite(allocation.amount) || allocation.amount <= 0) {
      throw new Error(`Payment allocation #${index + 1} must be greater than zero`);
    }

    const payerLabel = allocation.payer.company?.trim()
      || allocation.payer.name?.trim()
      || allocation.payer.email?.trim();
    if (!payerLabel) {
      throw new Error(`Payment allocation #${index + 1} needs a payer name, company, or email`);
    }

    return {
      amount: allocation.amount,
      method: allocation.method,
      status: "recorded",
      externalReference: allocation.externalReference ?? null,
      payer: {
        name: allocation.payer.name?.trim() || null,
        company: allocation.payer.company?.trim() || null,
        email: allocation.payer.email?.trim().toLowerCase() || null,
      },
    };
  });

  const summary = summarizeOrderPayments(orderTotal, entries);
  if (summary.status === "overpaid") {
    throw new Error(`Payment allocations exceed order total by $${summary.overpaidAmount.toFixed(2)}`);
  }

  if (opts.requireFullAllocation && summary.status !== "paid") {
    throw new Error(`Payment allocations leave $${summary.balanceDue.toFixed(2)} unallocated`);
  }

  return {
    entries,
    amountAllocated: summary.amountPaid,
    remainingUnallocated: summary.balanceDue,
    coversOrder: summary.status === "paid",
  };
}
