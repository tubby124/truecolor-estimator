/**
 * Wave invoice helpers — server-only.
 *
 * Flow:
 *   1. createOrFindCustomer(email, name) → customerId
 *   2. createInvoice(customerId, items, contact) → { invoiceId, invoiceNumber }
 *
 * Invoices are created as DRAFT (not sent). Sending is a future trigger
 * tied to order status = "ready_for_pickup".
 */

import { getConfigNum } from "@/lib/data/loader";
import { waveQuery, WAVE_BUSINESS_ID, WAVE_GST_TAX_ID, WAVE_PST_TAX_ID, WAVE_PRINT_PRODUCT_ID } from "./client";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface WaveLineItem {
  description: string; // e.g. "24×36 in Coroplast Sign — single-sided"
  unitPrice: number;   // pre-tax, dollars
  qty: number;
  applyGst: boolean;
  applyPst?: boolean;  // SK PST 6% for taxable printed-material charges
}

export interface WaveInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl: string | null;
  viewUrl: string | null;
}

// --------------------------------------------------------------------------
// Find existing customer by email (exported for use in status route + webhooks)
// --------------------------------------------------------------------------

export async function findCustomerByEmail(email: string): Promise<string | null> {
  const data = await waveQuery<{
    business: { customers: { edges: { node: { id: string; email: string } }[] } };
  }>(
    `query($bizId: ID!, $email: String!) {
      business(id: $bizId) {
        customers(email: $email) {
          edges { node { id email } }
        }
      }
    }`,
    { bizId: WAVE_BUSINESS_ID, email }
  ).catch(() => null);

  const edges = data?.business?.customers?.edges ?? [];
  return edges[0]?.node?.id ?? null;
}

// --------------------------------------------------------------------------
// Create customer in Wave
// --------------------------------------------------------------------------

async function createWaveCustomer(name: string, email: string): Promise<string> {
  const data = await waveQuery<{
    customerCreate: { didSucceed: boolean; customer: { id: string } | null; inputErrors: { message: string }[] };
  }>(
    `mutation($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed
        inputErrors { path message }
        customer { id name email }
      }
    }`,
    {
      input: {
        businessId: WAVE_BUSINESS_ID,
        name,
        email,
      },
    }
  );

  if (!data.customerCreate.didSucceed || !data.customerCreate.customer) {
    const errs = data.customerCreate.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave customerCreate failed: ${errs}`);
  }

  return data.customerCreate.customer.id;
}

// --------------------------------------------------------------------------
// Public: find or create customer
// --------------------------------------------------------------------------

export async function createOrFindWaveCustomer(
  email: string,
  name: string
): Promise<string> {
  // Try to find by email first
  const existing = await findCustomerByEmail(email);
  if (existing) return existing;
  return createWaveCustomer(name, email);
}

// --------------------------------------------------------------------------
// Public: create invoice (DRAFT — not sent)
// --------------------------------------------------------------------------

export async function createWaveInvoice(
  customerId: string,
  items: WaveLineItem[],
  opts?: {
    isRush?: boolean;
    orderNumber?: string;
    memo?: string;
    /** Explicit invoice title override. Wins over orderNumber-based title. */
    title?: string;
  }
): Promise<WaveInvoiceResult> {
  // Wave invoiceCreate requires productId (ID!) on every line item.
  // We use a single generic "Print Services" product (WAVE_PRINT_PRODUCT_ID) for all lines;
  // unitPrice per-line overrides the product's default price.
  // Field names confirmed via Wave schema introspection: unitPrice (not unitValue), quantity as Decimal.
  const lineItems = items.map((item) => ({
    productId: WAVE_PRINT_PRODUCT_ID,
    description: item.description,
    quantity: String(item.qty),
    unitPrice: item.unitPrice.toFixed(2),
    taxes: [
        ...(item.applyGst ? [{ salesTaxId: WAVE_GST_TAX_ID }] : []),
        ...(item.applyPst ? [{ salesTaxId: WAVE_PST_TAX_ID }] : []),
      ],
  }));

  if (opts?.isRush) {
    // Rush is part of the total taxable printed-material charge under SK
    // PST-20, so both GST and PST apply.
    lineItems.push({
      productId: WAVE_PRINT_PRODUCT_ID,
      description: "Rush production fee — same-day turnaround",
      quantity: "1",
      unitPrice: getConfigNum("rush_fee_flat").toFixed(2),
      taxes: [{ salesTaxId: WAVE_GST_TAX_ID }, { salesTaxId: WAVE_PST_TAX_ID }],
    });
  }

  const memo =
    opts?.memo ??
    `Pickup at 216 33rd St W, Saskatoon SK. Questions? Call (306) 954-8688.`;

  const data = await waveQuery<{
    invoiceCreate: {
      didSucceed: boolean;
      inputErrors: { message: string }[];
      invoice: { id: string; invoiceNumber: string; pdfUrl: string | null; viewUrl: string | null } | null;
    };
  }>(
    `mutation($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        inputErrors { path message }
        invoice { id invoiceNumber pdfUrl viewUrl }
      }
    }`,
    {
      input: {
        businessId: WAVE_BUSINESS_ID,
        customerId,
        status: "DRAFT",
        title: opts?.title
          ?? (opts?.orderNumber ? `True Color Order ${opts.orderNumber}` : "True Color Print Order"),
        memo,
        items: lineItems,
      },
    }
  );

  if (!data.invoiceCreate.didSucceed || !data.invoiceCreate.invoice) {
    const errs = data.invoiceCreate.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave invoiceCreate failed: ${errs}`);
  }

  const inv = data.invoiceCreate.invoice;
  return {
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    pdfUrl: inv.pdfUrl ?? null,
    viewUrl: inv.viewUrl ?? null,
  };
}

// --------------------------------------------------------------------------
// Record a payment in Wave via invoicePaymentCreateManual.
//
// This mutation directly links the payment to the invoice and marks the
// invoice as PAID (or PARTIAL). Verified live in prod 2026-05-26 — the
// previous moneyTransactionCreate path created orphan deposits and never
// closed the invoice, which is why this was rewritten.
//
// Requires env var: WAVE_BANK_ACCOUNT_ID (deposit account). Throws early
// if missing — silent no-op was the failure mode we're killing.
//
// After the mutation succeeds, re-queries the invoice's amountPaid and
// throws if it didn't actually close — catches silent-success-but-failed.
// --------------------------------------------------------------------------

export type WavePaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "CHECK" | "OTHER";

// Our enum → Wave's InvoicePaymentMethod enum
const WAVE_PAYMENT_METHOD_MAP: Record<WavePaymentMethod, string> = {
  CREDIT_CARD: "CREDIT_CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  CHECK: "CHEQUE",
  OTHER: "OTHER",
};

export async function recordWavePayment(
  invoiceId: string,
  amount: number,            // dollars, e.g. 125.55
  method: WavePaymentMethod,
  note?: string,
  _customerId?: string,      // kept for caller API compat — not used by invoicePaymentCreateManual
  _externalId?: string,      // kept for caller API compat — not used by invoicePaymentCreateManual
): Promise<void> {
  const bankAccountId = process.env.WAVE_BANK_ACCOUNT_ID;

  if (!bankAccountId) {
    throw new Error(
      "[recordWavePayment] WAVE_BANK_ACCOUNT_ID not configured — cannot record payment in Wave"
    );
  }

  const paymentDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const memo = note ?? `Payment received — ${method}`;
  const amountStr = amount.toFixed(2);

  const input = {
    invoiceId,
    paymentAccountId: bankAccountId,
    amount: amountStr,
    paymentDate,
    paymentMethod: WAVE_PAYMENT_METHOD_MAP[method],
    exchangeRate: "1",
    memo,
  };

  const data = await waveQuery<{
    invoicePaymentCreateManual: {
      didSucceed: boolean;
      inputErrors: { path: string; message: string; code: string }[] | null;
      invoicePayment: {
        id: string;
        amount: string;
        paymentDate: string;
        paymentMethod: string;
        account: { id: string; name: string } | null;
      } | null;
    };
  }>(
    `mutation R($input: InvoicePaymentCreateManualInput!) {
      invoicePaymentCreateManual(input: $input) {
        didSucceed
        inputErrors { path message code }
        invoicePayment { id amount paymentDate paymentMethod account { id name } }
      }
    }`,
    { input }
  );

  if (!data.invoicePaymentCreateManual.didSucceed) {
    const errs = data.invoicePaymentCreateManual.inputErrors?.map((e) => `${e.path}: ${e.message}`).join(", ");
    throw new Error(`Wave invoicePaymentCreateManual failed: ${errs}`);
  }

  // Verification step: re-query the invoice to confirm it's actually marked paid.
  // Catches the silent-success-but-actually-failed mode.
  const verify = await waveQuery<{
    business: { invoice: { id: string; amountPaid: { value: string } | null } | null } | null;
  }>(
    `query($bizId: ID!, $invId: ID!) {
      business(id: $bizId) {
        invoice(id: $invId) { id amountPaid { value } }
      }
    }`,
    { bizId: WAVE_BUSINESS_ID, invId: invoiceId }
  );

  const amountPaidStr = verify.business?.invoice?.amountPaid?.value;
  const amountPaid = amountPaidStr ? Number(amountPaidStr) : 0;

  if (amountPaid < amount - 0.01) {
    throw new Error(
      `Wave payment created but invoice not closed: amountPaid=${amountPaid} expected>=${amount}`
    );
  }
}

// --------------------------------------------------------------------------
// Fetch a Wave invoice's public viewUrl by invoice ID. Resolves to the
// customer-facing PDF on Wave's CDN (works for DRAFT, APPROVED, and PAID
// states — Wave updates the same URL with the current invoice status).
//
// Used by receipt email to give customers both PDF options after payment:
//   • True Color branded receipt (from /api/receipt/[oid]/pdf)
//   • Official Wave tax invoice (this URL — flips to "PAID" stamp once
//     the Clover webhook records payment)
//
// Returns null on any failure (no env, no token, API hiccup, invalid ID).
// Caller treats null as "skip the Wave PDF download button".
// --------------------------------------------------------------------------

export async function getWaveInvoicePublicUrl(invoiceId: string): Promise<string | null> {
  try {
    const data = await waveQuery<{
      business: { invoice: { id: string; viewUrl: string | null } | null } | null;
    }>(
      `query($bizId: ID!, $invId: ID!) {
        business(id: $bizId) {
          invoice(id: $invId) { id viewUrl }
        }
      }`,
      { bizId: WAVE_BUSINESS_ID, invId: invoiceId }
    );
    return data.business?.invoice?.viewUrl ?? null;
  } catch (err) {
    console.error("[getWaveInvoicePublicUrl] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// --------------------------------------------------------------------------
// Approve a DRAFT invoice (required before sending)
// --------------------------------------------------------------------------

export async function approveWaveInvoice(invoiceId: string): Promise<void> {
  const data = await waveQuery<{
    invoiceApprove: { didSucceed: boolean; inputErrors: { message: string }[] };
  }>(
    `mutation($input: InvoiceApproveInput!) {
      invoiceApprove(input: $input) {
        didSucceed
        inputErrors { path message }
      }
    }`,
    { input: { invoiceId } }
  );

  if (!data.invoiceApprove.didSucceed) {
    const errs = data.invoiceApprove.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave invoiceApprove failed: ${errs}`);
  }
}

// --------------------------------------------------------------------------
// Delete an unpaid Wave invoice. Wave's public GraphQL schema exposes
// `invoiceDelete`; it does not expose the legacy `invoiceVoid` mutation.
// --------------------------------------------------------------------------

export async function voidWaveInvoice(invoiceId: string): Promise<void> {
  const data = await waveQuery<{
    invoiceDelete: { didSucceed: boolean; inputErrors: { message: string }[] };
  }>(
    `mutation($input: InvoiceDeleteInput!) {
      invoiceDelete(input: $input) {
        didSucceed
        inputErrors { path message }
      }
    }`,
    { input: { invoiceId } }
  );

  if (!data.invoiceDelete.didSucceed) {
    const errs = data.invoiceDelete.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave invoiceDelete failed: ${errs}`);
  }
}

// --------------------------------------------------------------------------
// Send an approved invoice to the customer via Wave email
// --------------------------------------------------------------------------

// InvoiceSendInput requires: invoiceId, to (email list), attachPDF (bool)
// Optional: subject, message, fromAddress, ccMyself
export async function sendWaveInvoice(
  invoiceId: string,
  toEmail: string,
  opts?: { subject?: string; message?: string }
): Promise<void> {
  const data = await waveQuery<{
    invoiceSend: { didSucceed: boolean; inputErrors: { message: string }[] };
  }>(
    `mutation($input: InvoiceSendInput!) {
      invoiceSend(input: $input) {
        didSucceed
        inputErrors { path message }
      }
    }`,
    {
      input: {
        invoiceId,
        to: [toEmail],
        attachPDF: true,
        subject: opts?.subject ?? "Your invoice from True Color Display Printing",
        message: opts?.message ?? "Please find your invoice attached. You can also view and pay it online using the link below.",
        ccMyself: true,
      },
    }
  );

  if (!data.invoiceSend.didSucceed) {
    const errs = data.invoiceSend.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave invoiceSend failed: ${errs}`);
  }
}


export interface WaveInvoiceFinancials {
  subtotalCents: number;
  gstCents: number;
  pstCents: number;
  totalCents: number;
}

export interface WaveOnlineInvoiceSnapshot extends WaveInvoiceFinancials {
  id: string;
  invoiceNumber: string;
  status: string;
  viewUrl: string;
  customerEmail: string;
  amountDueCents: number;
  amountPaidCents: number;
  disableCreditCardPayments: boolean;
  disableBankPayments: boolean;
}

/** Parse Wave Money.minorUnitValue without going through floating point.
 * Wave documents this as the exact minor-currency unit and deprecates raw.
 */
export function parseWaveMinorUnitValue(value: unknown): number {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    throw new Error("Wave returned an invalid or fractional minor-unit amount");
  }
  const exact = BigInt(value);
  if (exact > BigInt(Number.MAX_SAFE_INTEGER) || exact < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error("Wave returned an unsafe minor-unit amount");
  }
  return Number(exact);
}

/**
 * Return only a customer-facing Wave document that Wave confirms is paid in
 * full. Staff actions must not expose a draft, a partially paid invoice, or a
 * generic True Color receipt as an "official" financial document.
 */
export async function getWavePaidInvoiceDocument(
  invoiceId: string,
): Promise<{ invoiceNumber: string; viewUrl: string }> {
  type Money = { minorUnitValue: string };
  const data = await waveQuery<{
    business: {
      invoice: {
        id: string;
        invoiceNumber: string;
        status: string;
        viewUrl: string | null;
        currency: { code: string };
        total: Money;
        amountDue: Money;
        amountPaid: Money;
      } | null;
    } | null;
  }>(
    `query WavePaidInvoiceDocument($businessId: ID!, $invoiceId: ID!) {
      business(id: $businessId) {
        invoice(id: $invoiceId) {
          id invoiceNumber status viewUrl
          currency { code }
          total { minorUnitValue }
          amountDue { minorUnitValue }
          amountPaid { minorUnitValue }
        }
      }
    }`,
    { businessId: WAVE_BUSINESS_ID, invoiceId },
  );
  const invoice = data.business?.invoice;
  if (
    !invoice || invoice.id !== invoiceId || invoice.currency?.code !== "CAD" ||
    invoice.status !== "PAID" || !invoice.invoiceNumber?.trim() || !invoice.viewUrl?.trim()
  ) {
    throw new Error("Wave paid invoice document is unavailable");
  }
  const totalCents = parseWaveMinorUnitValue(invoice.total?.minorUnitValue);
  const amountDueCents = parseWaveMinorUnitValue(invoice.amountDue?.minorUnitValue);
  const amountPaidCents = parseWaveMinorUnitValue(invoice.amountPaid?.minorUnitValue);
  if (totalCents <= 0 || amountDueCents !== 0 || amountPaidCents < totalCents) {
    throw new Error("Wave invoice is not paid in full");
  }
  return { invoiceNumber: invoice.invoiceNumber, viewUrl: invoice.viewUrl };
}

/** Read actual provider cents, including each named tax. Never infer tax from a grand total.
 * Fields verified against Wave's official API Reference September 6, 2026. */
export async function getWaveInvoiceFinancials(invoiceId: string): Promise<WaveInvoiceFinancials> {
  type Money = { minorUnitValue: string };
  const data = await waveQuery<{ business: { invoice: {
    id: string; currency: { code: string }; total: Money; taxTotal: Money;
    items: { subtotal: Money; taxes: { salesTax: { id: string }; amount: Money | null }[] }[];
  } | null } | null }>(
    `query($businessId: ID!, $invoiceId: ID!) {
      business(id: $businessId) {
        invoice(id: $invoiceId) {
          id currency { code } total { minorUnitValue } taxTotal { minorUnitValue }
          items { subtotal { minorUnitValue } taxes { salesTax { id } amount { minorUnitValue } } }
        }
      }
    }`, { businessId: WAVE_BUSINESS_ID, invoiceId },
  );
  const invoice = data.business?.invoice;
  if (!invoice || invoice.id !== invoiceId || invoice.currency.code !== "CAD" || !invoice.items.length) {
    throw new Error("Wave invoice financial readback is unavailable or not CAD");
  }
  let subtotalCents = 0, gstCents = 0, pstCents = 0;
  for (const item of invoice.items) {
    subtotalCents += parseWaveMinorUnitValue(item.subtotal.minorUnitValue);
    for (const tax of item.taxes) {
      const amount = parseWaveMinorUnitValue(tax.amount?.minorUnitValue);
      if (tax.salesTax.id === WAVE_GST_TAX_ID) gstCents += amount;
      else if (tax.salesTax.id === WAVE_PST_TAX_ID) pstCents += amount;
      else throw new Error("Wave invoice contains an unexpected tax");
    }
  }
  const totalCents = parseWaveMinorUnitValue(invoice.total.minorUnitValue);
  if (gstCents + pstCents !== parseWaveMinorUnitValue(invoice.taxTotal.minorUnitValue) || subtotalCents + gstCents + pstCents !== totalCents) {
    throw new Error("Wave invoice financial readback does not reconcile");
  }
  return { subtotalCents, gstCents, pstCents, totalCents };
}

/** Complete provider readback used immediately before an online redirect. */
export async function getWaveOnlineInvoiceSnapshot(
  invoiceId: string,
): Promise<WaveOnlineInvoiceSnapshot> {
  type Money = { minorUnitValue: string };
  const data = await waveQuery<{ business: { invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    viewUrl: string | null;
    customer: { email: string | null } | null;
    currency: { code: string };
    total: Money;
    amountDue: Money;
    amountPaid: Money;
    taxTotal: Money;
    disableCreditCardPayments: boolean;
    disableBankPayments: boolean;
    items: { subtotal: Money; taxes: { salesTax: { id: string }; amount: Money | null }[] }[];
  } | null } | null }>(
    `query WaveOnlineInvoice($businessId: ID!, $invoiceId: ID!) {
      business(id: $businessId) {
        invoice(id: $invoiceId) {
          id invoiceNumber status viewUrl
          customer { email }
          currency { code }
          total { minorUnitValue }
          amountDue { minorUnitValue }
          amountPaid { minorUnitValue }
          taxTotal { minorUnitValue }
          disableCreditCardPayments
          disableBankPayments
          items {
            subtotal { minorUnitValue }
            taxes { salesTax { id } amount { minorUnitValue } }
          }
        }
      }
    }`,
    { businessId: WAVE_BUSINESS_ID, invoiceId },
  );
  const invoice = data.business?.invoice;
  if (
    !invoice || invoice.id !== invoiceId || invoice.currency?.code !== "CAD" ||
    !invoice.items?.length || typeof invoice.invoiceNumber !== "string" || !invoice.invoiceNumber.trim() ||
    typeof invoice.customer?.email !== "string" || !invoice.customer.email.trim() ||
    typeof invoice.viewUrl !== "string" || !invoice.viewUrl.trim() ||
    typeof invoice.disableCreditCardPayments !== "boolean" ||
    typeof invoice.disableBankPayments !== "boolean"
  ) {
    throw new Error("Wave online invoice readback is incomplete or not CAD");
  }

  let subtotalCents = 0;
  let gstCents = 0;
  let pstCents = 0;
  for (const item of invoice.items) {
    subtotalCents += parseWaveMinorUnitValue(item.subtotal?.minorUnitValue);
    for (const tax of item.taxes ?? []) {
      const amount = parseWaveMinorUnitValue(tax.amount?.minorUnitValue);
      if (tax.salesTax.id === WAVE_GST_TAX_ID) gstCents += amount;
      else if (tax.salesTax.id === WAVE_PST_TAX_ID) pstCents += amount;
      else throw new Error("Wave invoice contains an unexpected tax");
    }
  }
  const totalCents = parseWaveMinorUnitValue(invoice.total?.minorUnitValue);
  const amountDueCents = parseWaveMinorUnitValue(invoice.amountDue?.minorUnitValue);
  const amountPaidCents = parseWaveMinorUnitValue(invoice.amountPaid?.minorUnitValue);
  const taxTotalCents = parseWaveMinorUnitValue(invoice.taxTotal?.minorUnitValue);
  if (
    [subtotalCents, gstCents, pstCents, totalCents, amountDueCents, amountPaidCents]
      .some((value) => value < 0) ||
    gstCents + pstCents !== taxTotalCents ||
    subtotalCents + taxTotalCents !== totalCents ||
    Math.max(totalCents - amountPaidCents, 0) !== amountDueCents
  ) {
    throw new Error("Wave online invoice amounts do not reconcile");
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    viewUrl: invoice.viewUrl,
    customerEmail: invoice.customer.email,
    subtotalCents,
    gstCents,
    pstCents,
    totalCents,
    amountDueCents,
    amountPaidCents,
    disableCreditCardPayments: invoice.disableCreditCardPayments,
    disableBankPayments: invoice.disableBankPayments,
  };
}
