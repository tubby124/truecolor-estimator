import { summarizeOrderPayments, type OrderPaymentLedgerEntry } from "@/lib/payments/order-ledger";

export function countPendingPaymentConflicts(rows: {
  total: number | string;
  wave_payment_recorded_at: string | null;
  order_payments: { amount: number | string; method: string; status: string | null }[] | null;
}[]): number {
  return rows.filter(row => {
    if (row.wave_payment_recorded_at) return true;
    const ledger = (row.order_payments ?? []).map(p => ({ ...p, amount: Number(p.amount) })) as OrderPaymentLedgerEntry[];
    const total = Number(row.total);
    return total > 0 && summarizeOrderPayments(total, ledger).balanceDue <= 0;
  }).length;
}
