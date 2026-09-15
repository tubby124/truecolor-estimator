import type { SupabaseClient } from "@supabase/supabase-js";
import { waveQuery, WAVE_BUSINESS_ID } from "./client";
import { parseWaveMinorUnitValue } from "./invoice";

export interface WaveInvoicePayment {
  id: string;
  amount: string;
  paymentDate: string | null;
  createdAt: string;
  paymentMethod: string | null;
  origin: string | null;
  state: string | null;
  paymentProvider: string | null;
  transactionType: string | null;
  memo: string | null;
  account: { id: string; name: string } | null;
}

export interface WaveInvoicePaymentSnapshot {
  id: string;
  invoiceNumber: string;
  status: string;
  modifiedAt: string;
  currency: { code: string };
  total: { minorUnitValue: string };
  amountDue: { minorUnitValue: string };
  amountPaid: { minorUnitValue: string };
  payments: WaveInvoicePayment[];
}

export interface VerifiedWaveProviderPayment {
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  amountCents: number;
  paidAt: string;
  paymentMethod: string | null;
  origin: "CUSTOMER";
  state: "PAID";
  paymentProvider: "WPP";
  transactionType: "SALE";
}

export interface WavePaymentAcceptance {
  outcome:
    | "transitioned"
    | "partial"
    | "overpaid"
    | "already_processed"
    | "not_found"
    | "not_payable"
    | "ledger_conflict";
  order_id: string | null;
  order_number: string | null;
  source_payment_method: string | null;
  actual_payment_provider: string | null;
  payment_transitioned: boolean;
  amount_paid_cents: number;
  balance_due_cents: number;
  effects_pending: number;
}

export interface WaveInvoiceReconciliation {
  snapshot: WaveInvoicePaymentSnapshot;
  verifiedPayments: VerifiedWaveProviderPayment[];
  ignoredPayments: number;
  acceptances: WavePaymentAcceptance[];
}

const INVOICE_PAYMENT_QUERY = `
  query WaveInvoicePayments($businessId: ID!, $invoiceId: ID!) {
    business(id: $businessId) {
      invoice(id: $invoiceId) {
        id
        invoiceNumber
        status
        modifiedAt
        currency { code }
        total { minorUnitValue }
        amountDue { minorUnitValue }
        amountPaid { minorUnitValue }
        payments {
          id
          amount
          paymentDate
          createdAt
          paymentMethod
          origin
          state
          paymentProvider
          transactionType
          memo
          account { id name }
        }
      }
    }
  }
`;

function firstRow(data: unknown): WavePaymentAcceptance | null {
  const row = Array.isArray(data) ? data[0] : data;
  return row && typeof row === "object" ? row as WavePaymentAcceptance : null;
}

/** Convert Wave InvoicePayment.amount (a major-unit String) to exact cents. */
export function parseWavePaymentAmount(value: unknown): number {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("Wave returned an invalid payment amount or fractional cents");
  }
  const [whole, fraction = ""] = value.split(".");
  const exact = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (exact <= BigInt(0) || exact > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Wave returned a non-positive or unsafe payment amount");
  }
  return Number(exact);
}

export async function getWaveInvoicePaymentSnapshot(
  invoiceId: string,
): Promise<WaveInvoicePaymentSnapshot> {
  if (!invoiceId.trim() || invoiceId.length > 300) throw new Error("Invalid Wave invoice ID");
  const data = await waveQuery<{
    business: { invoice: WaveInvoicePaymentSnapshot | null } | null;
  }>(INVOICE_PAYMENT_QUERY, { businessId: WAVE_BUSINESS_ID, invoiceId });
  const invoice = data.business?.invoice;
  if (!invoice || invoice.id !== invoiceId || invoice.currency?.code !== "CAD") {
    throw new Error("Wave invoice payment readback is unavailable or not CAD");
  }

  const totalCents = parseWaveMinorUnitValue(invoice.total?.minorUnitValue);
  const dueCents = parseWaveMinorUnitValue(invoice.amountDue?.minorUnitValue);
  const paidCents = parseWaveMinorUnitValue(invoice.amountPaid?.minorUnitValue);
  if (
    totalCents < 0 || dueCents < 0 || paidCents < 0 ||
    Math.max(totalCents - paidCents, 0) !== dueCents
  ) {
    throw new Error("Wave invoice payment totals do not reconcile");
  }
  if (!Array.isArray(invoice.payments)) throw new Error("Wave invoice payments are unavailable");
  return invoice;
}

export function verifiedWaveProviderPayments(
  snapshot: WaveInvoicePaymentSnapshot,
): VerifiedWaveProviderPayment[] {
  const seen = new Set<string>();
  const verified: VerifiedWaveProviderPayment[] = [];
  for (const payment of snapshot.payments) {
    if (
      payment.origin !== "CUSTOMER" ||
      payment.state !== "PAID" ||
      payment.paymentProvider !== "WPP" ||
      payment.transactionType !== "SALE"
    ) {
      continue;
    }
    if (typeof payment.id !== "string" || !payment.id.trim() || payment.id.length > 300) {
      throw new Error("Wave returned a provider payment without a valid ID");
    }
    if (seen.has(payment.id)) throw new Error("Wave returned a duplicate provider payment ID");
    seen.add(payment.id);
    const createdAt = new Date(payment.createdAt);
    if (!Number.isFinite(createdAt.getTime())) throw new Error("Wave returned an invalid provider payment timestamp");
    verified.push({
      invoiceId: snapshot.id,
      invoiceNumber: snapshot.invoiceNumber,
      paymentId: payment.id,
      amountCents: parseWavePaymentAmount(payment.amount),
      paidAt: createdAt.toISOString(),
      paymentMethod: payment.paymentMethod,
      origin: "CUSTOMER",
      state: "PAID",
      paymentProvider: "WPP",
      transactionType: "SALE",
    });
  }
  return verified.sort((a, b) => a.paidAt.localeCompare(b.paidAt) || a.paymentId.localeCompare(b.paymentId));
}

export async function reconcileWaveInvoicePaymentSnapshot(
  supabase: SupabaseClient,
  snapshot: WaveInvoicePaymentSnapshot,
  options: { enqueueCustomerEffects: boolean; enqueueStaffEffect: boolean },
): Promise<WaveInvoiceReconciliation> {
  const verifiedPayments = verifiedWaveProviderPayments(snapshot);
  const acceptances: WavePaymentAcceptance[] = [];
  for (const payment of verifiedPayments) {
    const { data, error } = await supabase.rpc("accept_wave_provider_payment", {
      p_wave_invoice_id: payment.invoiceId,
      p_wave_payment_id: payment.paymentId,
      p_amount_cents: payment.amountCents,
      p_paid_at: payment.paidAt,
      p_payment_method: payment.paymentMethod,
      p_origin: payment.origin,
      p_state: payment.state,
      p_payment_provider: payment.paymentProvider,
      p_transaction_type: payment.transactionType,
      p_enqueue_customer_effects: options.enqueueCustomerEffects,
      p_enqueue_staff_effect: options.enqueueStaffEffect,
    });
    if (error) throw new Error(error.message || "Wave provider payment acceptance failed");
    const acceptance = firstRow(data);
    if (!acceptance?.outcome) throw new Error("Wave provider payment acceptance returned no result");
    if (acceptance.outcome === "ledger_conflict") {
      throw new Error(`Wave provider payment ${payment.paymentId} conflicts with the local ledger`);
    }
    acceptances.push(acceptance);
  }
  return {
    snapshot,
    verifiedPayments,
    ignoredPayments: snapshot.payments.length - verifiedPayments.length,
    acceptances,
  };
}

export async function reconcileWaveInvoicePayments(
  supabase: SupabaseClient,
  invoiceId: string,
  options: { enqueueCustomerEffects: boolean; enqueueStaffEffect: boolean },
): Promise<WaveInvoiceReconciliation> {
  return reconcileWaveInvoicePaymentSnapshot(
    supabase,
    await getWaveInvoicePaymentSnapshot(invoiceId),
    options,
  );
}
