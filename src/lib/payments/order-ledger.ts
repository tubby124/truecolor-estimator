export type OrderPaymentMethod = "clover" | "etransfer" | "cash" | "wave" | "other";

export type OrderPaymentStatus = "recorded" | "voided" | "refunded";

export type DerivedPaymentStatus = "unpaid" | "partial" | "paid" | "overpaid";

export interface OrderPaymentPayer {
  name?: string | null;
  company?: string | null;
  email?: string | null;
}

export interface OrderPaymentLedgerEntry {
  amount: number;
  method: OrderPaymentMethod;
  status?: OrderPaymentStatus | null;
  externalReference?: string | null;
  payer?: OrderPaymentPayer | null;
  recordedAt?: string | null;
}

export interface OrderPaymentSummary {
  orderTotal: number;
  amountPaid: number;
  balanceDue: number;
  overpaidAmount: number;
  status: DerivedPaymentStatus;
  countedPayments: number;
}

function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function normalizePaymentAmount(amount: number): number {
  return fromCents(Math.max(0, toCents(amount)));
}

export function isCountedPayment(entry: Pick<OrderPaymentLedgerEntry, "amount" | "status">): boolean {
  const status = entry.status ?? "recorded";
  return status === "recorded" && toCents(entry.amount) > 0;
}

export function summarizeOrderPayments(
  orderTotal: number,
  payments: OrderPaymentLedgerEntry[]
): OrderPaymentSummary {
  const totalCents = Math.max(0, toCents(orderTotal));
  const counted = payments.filter(isCountedPayment);
  const paidCents = counted.reduce((sum, payment) => sum + Math.max(0, toCents(payment.amount)), 0);
  const balanceCents = Math.max(0, totalCents - paidCents);
  const overpaidCents = Math.max(0, paidCents - totalCents);

  let status: DerivedPaymentStatus;
  if (paidCents <= 0) {
    status = "unpaid";
  } else if (overpaidCents > 0) {
    status = "overpaid";
  } else if (balanceCents === 0) {
    status = "paid";
  } else {
    status = "partial";
  }

  return {
    orderTotal: fromCents(totalCents),
    amountPaid: fromCents(paidCents),
    balanceDue: fromCents(balanceCents),
    overpaidAmount: fromCents(overpaidCents),
    status,
    countedPayments: counted.length,
  };
}

export function nextPaymentAmount(orderTotal: number, payments: OrderPaymentLedgerEntry[]): number {
  return summarizeOrderPayments(orderTotal, payments).balanceDue;
}

export function shouldMarkOrderPaid(summary: Pick<OrderPaymentSummary, "status">): boolean {
  return summary.status === "paid";
}
