import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("catalog order submission idempotency contract", () => {
  it("carries one browser UUID into a unique persisted order key", () => {
    const checkout = source("src/app/checkout/page.tsx");
    const route = source("src/app/api/orders/route.ts");
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");

    expect(checkout).toContain('CHECKOUT_SUBMISSION_KEY = "tc_checkout_submission_id"');
    expect(checkout).toContain("crypto.randomUUID()");
    expect(checkout).toContain("checkout_submission_id: getOrCreateCheckoutSubmissionId()");
    expect(checkout).toContain("buildCatalogWaveInvoicePlan");
    expect(route).toContain("buildCatalogWaveInvoicePlan");
    expect(route).toContain("checkout_submission_id,");
    expect(route).toContain("checkout_request_fingerprint:");
    expect(route).toContain("createHash(\"sha256\")");
    expect(route).toContain("order.checkout_request_fingerprint === checkoutRequestFingerprint");
    expect(route).toContain('.eq("checkout_submission_id", checkout_submission_id)');
    expect(route).toContain("resumedOrder = true");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS checkout_submission_id uuid");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_submission_id_uidx");
    expect(migration).toContain("orders_checkout_fingerprint_check");
    expect(migration).toContain("orders_wave_invoice_id_uidx");
    expect(migration).toContain("orders_quote_checkout_session_id_uidx");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS checkout_line_key text");
    expect(migration).toContain("CREATE UNIQUE INDEX order_items_checkout_line_key_uidx");
    expect(route).toContain("checkout_line_key: `${checkout_submission_id}:${index}`");
    expect(route).toContain('.upsert(orderItems, { onConflict: "checkout_line_key", ignoreDuplicates: true })');
    expect(route).toMatch(/\.select\("checkout_line_key, line_total(?:, [^"]+)?"\)/);
    expect(checkout).toContain("if (res.status === 503)");
    expect(checkout).toContain('throw new Error("CHECKOUT_ACCOUNTING_PENDING")');
    expect(checkout).toContain("if (res.status === 409)");
    expect(checkout).toContain("sessionStorage.removeItem(CHECKOUT_SUBMISSION_KEY)");
    expect(checkout).toContain('throw new Error("CHECKOUT_RETRY_AVAILABLE")');
    const errors = source("src/lib/errors/sanitize.ts");
    expect(errors).toContain("CHECKOUT_ACCOUNTING_PENDING");
    expect(errors).toContain("Please do not retry or pay again");
  });

  it("reuses stored order data after a duplicate POST and never starts Wave for a new order", () => {
    const route = source("src/app/api/orders/route.ts");
    const provision = route.indexOf("provisionOrderWaveInvoice(");
    const resumedPlan = route.indexOf("resumedOrder ? undefined", provision);
    expect(resumedPlan).toBeGreaterThan(provision);
    expect(route).toContain("order.status !== \"pending_payment\"");
    expect(route).toContain("This checkout attempt is no longer payable");
    expect(route).toContain("storedSubmission.discount_amount");
    expect(route).toContain("} else if (rawDiscountCode?.trim())");
  });
});

describe("catalog online payment routing", () => {
  it("returns only an authenticated Wave payment URL after invoice provisioning", () => {
    const route = source("src/app/api/orders/route.ts");
    const checkout = source("src/app/checkout/page.tsx");
    const provision = route.indexOf("provisionOrderWaveInvoice(");
    const resolve = route.indexOf("resolveWaveOnlineCheckout(");
    expect(provision).toBeGreaterThan(0);
    expect(resolve).toBeGreaterThan(provision);
    expect(route).toContain('payment_method: "wave" | "etransfer"');
    expect(route).toContain('payment_method !== "wave" && payment_method !== "etransfer"');
    expect(route).toContain('payment_method === "wave"');
    expect(route).not.toContain("createCloverCheckout(");
    expect(route).not.toContain("reserveOrderCheckout(");
    expect(checkout).toContain('useState<"wave" | "etransfer">("wave")');
    expect(checkout).toContain('if (payMethod === "wave" && data.checkoutUrl)');
    expect(checkout).not.toContain("Clover's secure checkout");
    const gateway = source("src/app/pay/[token]/page.tsx");
    expect(gateway).toContain("resolveWaveOnlineCheckout(");
    expect(gateway).not.toContain("createCloverCheckout(");
    expect(gateway).not.toContain("reserveOrderCheckout(");
  });
});
