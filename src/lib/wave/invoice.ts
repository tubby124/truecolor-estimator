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

import { waveQuery, WAVE_BUSINESS_ID, WAVE_GST_TAX_ID, WAVE_PRINT_PRODUCT_ID } from "./client";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface WaveLineItem {
  description: string; // e.g. "24×36 in Coroplast Sign — single-sided"
  unitPrice: number;   // pre-tax, dollars
  qty: number;
  applyGst: boolean;
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
    taxes: item.applyGst ? [{ salesTaxId: WAVE_GST_TAX_ID }] : [],
  }));

  if (opts?.isRush) {
    lineItems.push({
      productId: WAVE_PRINT_PRODUCT_ID,
      description: "Rush production fee — same-day turnaround",
      quantity: "1",
      unitPrice: "40.00",
      taxes: [],
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
        title: opts?.orderNumber ? `True Color Order ${opts.orderNumber}` : "True Color Print Order",
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
// Record a payment in Wave via moneyTransactionCreate.
//
// Wave has no public `invoicePaymentCreate` mutation — payments are recorded
// as general income transactions. Wave auto-reconciles matching transactions
// (same customer + amount) against outstanding invoices.
//
// Requires env vars: WAVE_INCOME_ACCOUNT_ID + WAVE_BANK_ACCOUNT_ID
// If either is missing, skips gracefully (non-fatal — status update still succeeds).
//
// externalId = Supabase order UUID → idempotency key prevents duplicate transactions
// if the same order is processed twice (e.g. double-click, webhook + status route).
// --------------------------------------------------------------------------

export type WavePaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "CHECK" | "OTHER";

export async function recordWavePayment(
  _invoiceId: string,        // kept for caller API compat — not used by moneyTransactionCreate
  amount: number,            // dollars, e.g. 125.55
  method: WavePaymentMethod,
  note?: string,
  customerId?: string,       // Wave customer ID — enables auto-reconciliation against invoice
  externalId?: string,       // Supabase order UUID — idempotency key
): Promise<void> {
  const incomeAccountId = process.env.WAVE_INCOME_ACCOUNT_ID;
  const bankAccountId = process.env.WAVE_BANK_ACCOUNT_ID;

  if (!incomeAccountId || !bankAccountId) {
    console.warn(
      "[recordWavePayment] WAVE_INCOME_ACCOUNT_ID or WAVE_BANK_ACCOUNT_ID not configured — skipping Wave payment recording"
    );
    return;
  }

  const paymentDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const description = note ?? `Payment received — ${method}`;

  const lineItem: Record<string, unknown> = {
    accountId: incomeAccountId,
    amount: amount.toFixed(2),
    balance: "INCREASE",
  };
  if (customerId) lineItem.customerId = customerId;

  const input: Record<string, unknown> = {
    businessId: WAVE_BUSINESS_ID,
    date: paymentDate,
    description,
    anchor: {
      accountId: bankAccountId,
      amount: amount.toFixed(2),
      direction: "DEPOSIT",
    },
    lineItems: [lineItem],
  };
  if (externalId) input.externalId = externalId;

  const data = await waveQuery<{
    moneyTransactionCreate: {
      didSucceed: boolean;
      inputErrors: { message: string }[];
      transaction: { id: string } | null;
    };
  }>(
    `mutation($input: MoneyTransactionCreateInput!) {
      moneyTransactionCreate(input: $input) {
        didSucceed
        inputErrors { path message }
        transaction { id }
      }
    }`,
    { input }
  );

  if (!data.moneyTransactionCreate.didSucceed) {
    const errs = data.moneyTransactionCreate.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave moneyTransactionCreate failed: ${errs}`);
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
