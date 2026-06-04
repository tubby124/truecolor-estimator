import type { WavePaymentMethod } from "@/lib/wave/invoice";
import type { OrderPaymentLedgerEntry, OrderPaymentMethod } from "./order-ledger";

const METHOD_TO_WAVE: Record<OrderPaymentMethod, WavePaymentMethod> = {
  clover: "CREDIT_CARD",
  etransfer: "BANK_TRANSFER",
  cash: "CASH",
  wave: "OTHER",
  other: "OTHER",
};

export interface WaveLedgerPaymentRow extends OrderPaymentLedgerEntry {
  id?: string | null;
  waveRecordedAt?: string | null;
}

export interface WaveLedgerPaymentInput {
  orderId: string;
  orderNumber: string;
  waveInvoiceId: string | null | undefined;
  waveInvoiceApprovedAt?: string | null;
  payment: WaveLedgerPaymentRow;
}

export interface WaveLedgerPaymentPlan {
  ok: true;
  approveInvoiceFirst: boolean;
  recordPayment: {
    invoiceId: string;
    amount: number;
    method: WavePaymentMethod;
    note: string;
    externalId: string;
  };
  dbUpdate: {
    wave_recorded_at: string;
  };
}

export interface WaveLedgerPaymentPlanError {
  ok: false;
  error: string;
}

export type WaveLedgerPaymentPlanResult = WaveLedgerPaymentPlan | WaveLedgerPaymentPlanError;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function payerLabel(payment: WaveLedgerPaymentRow): string {
  return clean(payment.payer?.company)
    ?? clean(payment.payer?.name)
    ?? clean(payment.payer?.email)
    ?? "Unknown payer";
}

export function buildWaveLedgerPaymentPlan(input: WaveLedgerPaymentInput): WaveLedgerPaymentPlanResult {
  if (!input.waveInvoiceId) {
    return { ok: false, error: "Order has no Wave invoice ID" };
  }

  if (input.payment.waveRecordedAt) {
    return { ok: false, error: "Payment row is already recorded in Wave" };
  }

  if (input.payment.status === "voided" || input.payment.status === "refunded") {
    return { ok: false, error: "Voided/refunded payment rows must not be recorded in Wave" };
  }

  if (!Number.isFinite(input.payment.amount) || input.payment.amount <= 0) {
    return { ok: false, error: "Payment amount must be greater than zero" };
  }

  const paymentId = clean(input.payment.id);
  if (!paymentId) {
    return { ok: false, error: "Payment row ID is required before recording to Wave" };
  }

  const method = METHOD_TO_WAVE[input.payment.method];
  const label = payerLabel(input.payment);
  const externalRef = clean(input.payment.externalReference);
  const referenceSuffix = externalRef ? ` · Ref ${externalRef}` : "";

  return {
    ok: true,
    approveInvoiceFirst: !input.waveInvoiceApprovedAt,
    recordPayment: {
      invoiceId: input.waveInvoiceId,
      amount: input.payment.amount,
      method,
      note: `${method === "CREDIT_CARD" ? "Clover" : method === "BANK_TRANSFER" ? "eTransfer" : method} — ${label} — Order ${input.orderNumber}${referenceSuffix}`,
      externalId: `${input.orderId}:${paymentId}`,
    },
    dbUpdate: {
      wave_recorded_at: new Date().toISOString(),
    },
  };
}
