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

import { waveQuery, WAVE_BUSINESS_ID, WAVE_GST_TAX_ID } from "./client";

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
// Find existing customer by email
// --------------------------------------------------------------------------

async function findCustomerByEmail(email: string): Promise<string | null> {
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
  const lineItems = items.map((item) => ({
    description: item.description,
    quantity: String(item.qty),
    unitValue: item.unitPrice.toFixed(2),
    taxes: item.applyGst ? [{ salesTaxId: WAVE_GST_TAX_ID }] : [],
  }));

  if (opts?.isRush) {
    lineItems.push({
      description: "Rush production fee — same-day turnaround",
      quantity: "1",
      unitValue: "40.00",
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

export async function sendWaveInvoice(invoiceId: string): Promise<void> {
  const data = await waveQuery<{
    invoiceSend: { didSucceed: boolean; inputErrors: { message: string }[] };
  }>(
    `mutation($input: InvoiceSendInput!) {
      invoiceSend(input: $input) {
        didSucceed
        inputErrors { path message }
      }
    }`,
    { input: { invoiceId } }
  );

  if (!data.invoiceSend.didSucceed) {
    const errs = data.invoiceSend.inputErrors?.map((e) => e.message).join(", ");
    throw new Error(`Wave invoiceSend failed: ${errs}`);
  }
}
