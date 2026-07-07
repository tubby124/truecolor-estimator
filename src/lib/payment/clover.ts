/**
 * Clover Hosted Checkout — creates a payment session and returns the checkout URL.
 *
 * Sessions expire 15 minutes after creation; our /pay/[token] gateway creates a
 * fresh session on every click so email links never expire.
 *
 * Docs: https://docs.clover.com/dev/docs/hosted-checkout-api
 * Auth: Authorization: Bearer <CLOVER_ECOMM_PRIVATE_KEY>
 */

const BASE_URL =
  process.env.CLOVER_ENVIRONMENT === "sandbox"
    ? "https://apisandbox.dev.clover.com/invoicingcheckoutservice"
    : "https://www.clover.com/invoicingcheckoutservice";

// Clover rejects Hosted Checkout requests when a line item name is 127+
// characters. Manual multi-item orders can produce long combined descriptions,
// so keep the customer-facing payment session creatable while preserving the
// order number/details in our own receipt/email/Wave records.
export const CLOVER_LINE_ITEM_NAME_MAX = 126;

export function normalizeCloverLineItemName(name: string): string {
  const normalized = name.replace(/\s+/g, " ").trim() || "True Color order";
  if (normalized.length <= CLOVER_LINE_ITEM_NAME_MAX) return normalized;

  return `${normalized.slice(0, CLOVER_LINE_ITEM_NAME_MAX - 3).trimEnd()}...`;
}

export interface CloverCheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export async function fetchCloverPaymentAmountCents(paymentId: string): Promise<number | null> {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const accessToken = process.env.CLOVER_API_KEY ?? process.env.CLOVER_ECOMM_PRIVATE_KEY;
  if (!merchantId || !accessToken) return null;

  const res = await fetch(`https://api.clover.com/v3/merchants/${merchantId}/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clover payment lookup API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { amount?: unknown };
  const amount = typeof data.amount === "number" ? data.amount : Number(data.amount ?? NaN);
  return Number.isFinite(amount) ? amount : null;
}

export async function createCloverCheckout(
  amountCents: number,
  description: string,
  customerEmail?: string,
  redirectUrl?: string,
  externalReferenceId?: string
): Promise<CloverCheckoutResult> {
  const privateKey = process.env.CLOVER_ECOMM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("CLOVER_ECOMM_PRIVATE_KEY not configured");
  }

  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!merchantId) {
    throw new Error("CLOVER_MERCHANT_ID not configured");
  }

  const body: Record<string, unknown> = {
    shoppingCart: {
      lineItems: [
        {
          name: normalizeCloverLineItemName(description),
          unitQty: 1,
          price: amountCents,
        },
      ],
    },
  };

  // Clover requires a non-null customer object
  body.customer = customerEmail ? { email: customerEmail } : { firstName: "Customer" };

  // After payment, redirect back to our site
  if (redirectUrl) body.redirectUrl = redirectUrl;

  // Tag with our internal order UUID so Clover includes it in PAYMENT webhook events
  if (externalReferenceId) body.externalReferenceId = externalReferenceId;

  const res = await fetch(`${BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "X-Clover-Merchant-Id": merchantId,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clover checkout API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { href?: string; checkoutSessionId?: string };

  if (!data.href) {
    throw new Error("Clover checkout API returned no href");
  }

  return {
    checkoutUrl: data.href,
    sessionId: data.checkoutSessionId ?? "",
  };
}
