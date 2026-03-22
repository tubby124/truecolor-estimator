/**
 * src/lib/brevo/customerSync.ts
 *
 * Syncs paying customers to Brevo as contacts in the "True Color Customers"
 * list (ID 25). Creates or updates contact attributes on each order.
 *
 * Called from: order completion routes (checkout, manual-order, payment webhook)
 * Non-fatal — callers should catch errors and log rather than failing the order.
 *
 * Uses Brevo REST API (same pattern as smtp.ts). Requires BREVO_API_KEY env var.
 */

const BREVO_API = "https://api.brevo.com/v3";
const CUSTOMER_LIST_ID = 25;

export interface CustomerSyncParams {
  email: string;
  firstName: string;
  lastName?: string;
  company?: string;
  phone?: string;
  orderNumber: string;
  orderTotal: number;
  productSummary: string;
  source: "checkout" | "manual_order" | "quote";
  accountStatus: "active" | "created" | "none";
}

/**
 * Create or update a Brevo contact with order-related attributes,
 * then add them to the True Color Customers list.
 */
export async function syncCustomerToBrevo(
  params: CustomerSyncParams
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[brevo/customerSync] BREVO_API_KEY not set — skipping sync");
    return;
  }

  const {
    email,
    firstName,
    lastName,
    company,
    phone,
    orderNumber,
    orderTotal,
    productSummary,
    source,
    accountStatus,
  } = params;

  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Step 1: Try to get existing contact to read current ORDER_COUNT and TOTAL_SPENT
  let existingOrderCount = 0;
  let existingTotalSpent = 0;
  let firstOrderDate = now;

  try {
    const existing = await brevoFetch(
      apiKey,
      `/contacts/${encodeURIComponent(email)}`
    );
    if (existing) {
      const attrs = (existing.attributes ?? {}) as Record<string, unknown>;
      existingOrderCount =
        typeof attrs.ORDER_COUNT === "number" ? attrs.ORDER_COUNT : 0;
      existingTotalSpent =
        typeof attrs.TOTAL_SPENT === "number" ? attrs.TOTAL_SPENT : 0;
      if (attrs.FIRST_ORDER_DATE) {
        firstOrderDate = attrs.FIRST_ORDER_DATE as string;
      }
    }
  } catch {
    // Contact doesn't exist yet — that's fine, we'll create it
  }

  // Step 2: Create or update contact with attributes
  const attributes: Record<string, string | number> = {
    FIRSTNAME: firstName,
    ORDER_COUNT: existingOrderCount + 1,
    TOTAL_SPENT: Math.round((existingTotalSpent + orderTotal) * 100) / 100,
    LAST_ORDER_DATE: now,
    FIRST_ORDER_DATE: firstOrderDate,
    LAST_ORDER_NUMBER: orderNumber,
    LAST_PRODUCT: productSummary.slice(0, 100),
    CUSTOMER_SOURCE: source,
    CONSENT_TYPE: "implied_business",
    ACCOUNT_STATUS: accountStatus,
  };

  if (lastName) attributes.LASTNAME = lastName;
  if (company) attributes.COMPANY = company;
  if (phone) attributes.SMS = phone;

  const res = await fetch(`${BREVO_API}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      attributes,
      listIds: [CUSTOMER_LIST_ID],
      updateEnabled: true, // update if exists, create if not
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo contact sync failed (${res.status}): ${errText}`);
  }

  console.log(
    `[brevo/customerSync] synced → ${email} | order ${orderNumber} | count=${existingOrderCount + 1} | total=$${(existingTotalSpent + orderTotal).toFixed(2)}`
  );
}

/**
 * Fetch helper for Brevo GET requests.
 * Returns parsed JSON or null on 404.
 */
async function brevoFetch(
  apiKey: string,
  path: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BREVO_API}${path}`, {
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo API error (${res.status}): ${errText}`);
  }

  return (await res.json()) as Record<string, unknown>;
}
