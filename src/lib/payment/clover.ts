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
    ? "https://scl-sandbox.dev.clover.com"
    : "https://scl.clover.com";

export interface CloverCheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export async function createCloverCheckout(
  amountCents: number,
  description: string,
  customerEmail?: string
): Promise<CloverCheckoutResult> {
  const privateKey = process.env.CLOVER_ECOMM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("CLOVER_ECOMM_PRIVATE_KEY not configured");
  }

  const body: Record<string, unknown> = {
    shoppingCart: {
      lineItems: [
        {
          name: description,
          unitQty: 1,
          price: amountCents,
        },
      ],
    },
  };

  if (customerEmail) {
    body.customer = { email: customerEmail };
  }

  const res = await fetch(`${BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
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
