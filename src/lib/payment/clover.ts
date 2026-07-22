/**
 * Clover Hosted Checkout — creates a payment session and returns the checkout URL.
 *
 * Sessions expire 15 minutes after creation. Direct order links create a fresh
 * session per visit; quote links durably resume a known session and only create
 * a replacement after the prior reservation has safely expired.
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
  expiresAt: string;
}

export class CloverCheckoutError extends Error {
  constructor(message: string, readonly outcome: "definite" | "ambiguous") {
    super(message);
    this.name = "CloverCheckoutError";
  }
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
    throw new CloverCheckoutError("CLOVER_ECOMM_PRIVATE_KEY not configured", "definite");
  }

  const merchantId = process.env.CLOVER_MERCHANT_ID;
  if (!merchantId) {
    throw new CloverCheckoutError("CLOVER_MERCHANT_ID not configured", "definite");
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

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/checkouts`, {
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
  } catch (error) {
    throw new CloverCheckoutError(
      error instanceof Error ? error.message : "Clover checkout request failed",
      "ambiguous",
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CloverCheckoutError(
      `Clover checkout API error ${res.status}: ${text}`,
      res.status >= 500 ? "ambiguous" : "definite",
    );
  }

  const data = (await res.json()) as { href?: string; checkoutSessionId?: string; expirationTime?: number };

  if (!data.href) {
    throw new CloverCheckoutError("Clover checkout API returned no href", "ambiguous");
  }

  return {
    checkoutUrl: data.href,
    sessionId: data.checkoutSessionId ?? "",
    expiresAt: new Date(
      Number.isFinite(data.expirationTime) ? Number(data.expirationTime) : Date.now() + 15 * 60_000,
    ).toISOString(),
  };
}
