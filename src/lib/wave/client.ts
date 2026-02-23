/**
 * Wave Accounting GraphQL client
 * Docs: https://developer.waveapps.com/hc/en-us/articles/360019434171
 *
 * Server-only — never import this on the client side.
 * Uses WAVE_API_TOKEN + WAVE_BUSINESS_ID from env vars.
 */

const WAVE_GQL = "https://gql.waveapps.com/graphql/public";

export const WAVE_BUSINESS_ID =
  process.env.WAVE_BUSINESS_ID ??
  "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";

export const WAVE_GST_TAX_ID =
  "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1NhbGVzVGF4OjE5MzI0MzkyNDI=";

// Generic "Print Services" product — created once, used as productId on all invoice line items.
// Wave's invoiceCreate requires productId (ID!) on every line item. This product has unitPrice $0
// and the actual per-line price is set via unitValue on each item, overriding the product default.
export const WAVE_PRINT_PRODUCT_ID =
  process.env.WAVE_PRINT_PRODUCT_ID ??
  "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNjO1Byb2R1Y3Q6MTMwODU2NzUy";

export async function waveQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = process.env.WAVE_API_TOKEN;
  if (!token) throw new Error("WAVE_API_TOKEN not configured");

  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Wave API HTTP ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Wave GQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return json.data as T;
}
