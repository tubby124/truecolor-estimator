import { isCountedPayment, summarizeOrderPayments, type DerivedPaymentStatus, type OrderPaymentLedgerEntry } from "./order-ledger";

export type AccountingPaymentRow = OrderPaymentLedgerEntry & {
  id: string;
  waveRecordedAt?: string | null;
};

export interface SplitPaymentAccountingInput {
  orderTotal: number;
  payments: AccountingPaymentRow[];
  hasWaveInvoice: boolean;
  waveInvoiceApproved: boolean;
}

export interface SplitPaymentAccountingDecision {
  derivedStatus: DerivedPaymentStatus;
  markOrderPaid: boolean;
  sendPaidReceipt: boolean;
  approveWaveInvoice: boolean;
  wavePaymentsToRecord: AccountingPaymentRow[];
  setOrderWavePaymentRecordedAt: boolean;
  needsReview: boolean;
  reason: string;
}

export function decideSplitPaymentAccounting(input: SplitPaymentAccountingInput): SplitPaymentAccountingDecision {
  const summary = summarizeOrderPayments(input.orderTotal, input.payments);
  const countedPayments = input.payments.filter(isCountedPayment);
  const wavePaymentsToRecord = input.hasWaveInvoice
    ? countedPayments.filter((payment) => !payment.waveRecordedAt)
    : [];

  if (summary.status === "overpaid") {
    return {
      derivedStatus: summary.status,
      markOrderPaid: false,
      sendPaidReceipt: false,
      approveWaveInvoice: false,
      wavePaymentsToRecord: [],
      setOrderWavePaymentRecordedAt: false,
      needsReview: true,
      reason: `order is overpaid by $${summary.overpaidAmount.toFixed(2)} — staff review required`,
    };
  }

  const fullyPaid = summary.status === "paid";
  const everyCountedPaymentRecordedToWave = countedPayments.length > 0
    && countedPayments.every((payment) => Boolean(payment.waveRecordedAt));

  return {
    derivedStatus: summary.status,
    markOrderPaid: fullyPaid,
    sendPaidReceipt: fullyPaid,
    approveWaveInvoice: input.hasWaveInvoice && !input.waveInvoiceApproved && countedPayments.length > 0,
    wavePaymentsToRecord,
    setOrderWavePaymentRecordedAt: input.hasWaveInvoice && fullyPaid && everyCountedPaymentRecordedToWave,
    needsReview: false,
    reason: fullyPaid
      ? "ledger covers the full order total"
      : `ledger is partial — $${summary.balanceDue.toFixed(2)} remains due`,
  };
}
