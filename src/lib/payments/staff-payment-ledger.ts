import { summarizeOrderPayments, type DerivedPaymentStatus, type OrderPaymentLedgerEntry, type OrderPaymentMethod, type OrderPaymentPayer } from "./order-ledger";

const VALID_METHODS: OrderPaymentMethod[] = ["clover", "etransfer", "cash", "wave", "other"];

export interface StaffLedgerPaymentInput {
  amount: unknown;
  method: unknown;
  payer?: OrderPaymentPayer | null;
  externalReference?: unknown;
  notes?: unknown;
  allowOverpayment?: unknown;
}

export interface StaffLedgerExistingPayment extends OrderPaymentLedgerEntry {
  id?: string;
  waveRecordedAt?: string | null;
  notes?: string | null;
}

export interface StaffLedgerBuildInput {
  orderId: string;
  orderTotal: number;
  existingPayments: StaffLedgerExistingPayment[];
  body: StaffLedgerPaymentInput;
  recordedBy: string;
}

export interface StaffLedgerBuildResult {
  ok: true;
  insert: Record<string, unknown>;
  nextSummary: {
    status: DerivedPaymentStatus;
    amountPaid: number;
    balanceDue: number;
    overpaidAmount: number;
  };
  warning?: string;
}

export interface StaffLedgerBuildError {
  ok: false;
  status: number;
  error: string;
}

export type StaffLedgerBuildResponse = StaffLedgerBuildResult | StaffLedgerBuildError;

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePayer(payer: OrderPaymentPayer | null | undefined): OrderPaymentPayer {
  return {
    name: cleanString(payer?.name),
    company: cleanString(payer?.company),
    email: cleanString(payer?.email)?.toLowerCase() ?? null,
  };
}

function hasPayerIdentity(payer: OrderPaymentPayer): boolean {
  return Boolean(payer.name || payer.company || payer.email);
}

export function buildStaffLedgerPayment(input: StaffLedgerBuildInput): StaffLedgerBuildResponse {
  const amount = normalizeAmount(input.body.amount);
  if (amount === null || amount <= 0) {
    return { ok: false, status: 400, error: "Payment amount must be greater than zero" };
  }

  const method = typeof input.body.method === "string" ? input.body.method.trim() : "";
  if (!VALID_METHODS.includes(method as OrderPaymentMethod)) {
    return { ok: false, status: 400, error: "Invalid payment method" };
  }

  const payer = normalizePayer(input.body.payer);
  if (!hasPayerIdentity(payer)) {
    return { ok: false, status: 400, error: "Payer name, company, or email is required" };
  }

  const candidatePayment: StaffLedgerExistingPayment = {
    amount,
    method: method as OrderPaymentMethod,
    status: "recorded",
    payer,
    externalReference: cleanString(input.body.externalReference),
    notes: cleanString(input.body.notes),
  };

  const nextSummaryRaw = summarizeOrderPayments(input.orderTotal, [...input.existingPayments, candidatePayment]);
  const allowOverpayment = input.body.allowOverpayment === true;

  if (nextSummaryRaw.status === "overpaid" && !allowOverpayment) {
    return {
      ok: false,
      status: 409,
      error: `Payment would overpay this order by $${nextSummaryRaw.overpaidAmount.toFixed(2)}`,
    };
  }

  const warning = nextSummaryRaw.status === "overpaid"
    ? `Order would be overpaid by $${nextSummaryRaw.overpaidAmount.toFixed(2)}; staff review required`
    : undefined;

  return {
    ok: true,
    insert: {
      order_id: input.orderId,
      amount,
      currency: "CAD",
      method,
      status: "recorded",
      payer_name: payer.name,
      payer_company: payer.company,
      payer_email: payer.email,
      external_reference: candidatePayment.externalReference,
      recorded_by: input.recordedBy,
      notes: candidatePayment.notes,
      metadata: {},
    },
    nextSummary: {
      status: nextSummaryRaw.status,
      amountPaid: nextSummaryRaw.amountPaid,
      balanceDue: nextSummaryRaw.balanceDue,
      overpaidAmount: nextSummaryRaw.overpaidAmount,
    },
    warning,
  };
}

export function mapOrderPaymentRow(row: Record<string, unknown>): StaffLedgerExistingPayment {
  return {
    id: cleanString(row.id) ?? undefined,
    amount: normalizeAmount(row.amount) ?? 0,
    method: (cleanString(row.method) ?? "other") as OrderPaymentMethod,
    status: cleanString(row.status) as StaffLedgerExistingPayment["status"],
    payer: {
      name: cleanString(row.payer_name),
      company: cleanString(row.payer_company),
      email: cleanString(row.payer_email),
    },
    externalReference: cleanString(row.external_reference),
    waveRecordedAt: cleanString(row.wave_recorded_at),
    recordedAt: cleanString(row.recorded_at),
    notes: cleanString(row.notes),
  };
}
