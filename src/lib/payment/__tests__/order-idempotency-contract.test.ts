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
    expect(route).toContain('.select("checkout_line_key, line_total")');
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

describe("one Clover session per catalog checkout reservation", () => {
  it("uses locked create/resume/wait transitions and never recycles ambiguous creation", () => {
    const migration = source("supabase/migrations/20260720120000_quote_wave_provisioning.sql");
    const reserve = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.reserve_order_checkout"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.complete_order_checkout"),
    );
    expect(reserve).toContain("FOR UPDATE;");
    expect(reserve).toContain("'resume'::text");
    expect(reserve).toContain("'wait'::text");
    expect(reserve).toContain("quote_checkout_state = 'ambiguous'");
    expect(reserve).not.toContain("quote_checkout_state = 'ambiguous' AND");
    expect(reserve).toContain("v_order.status <> 'pending_payment'");
    expect(reserve).toContain("v_order.paid_at IS NOT NULL");
    expect(reserve).toContain("ORDER_WAVE_NOT_READY");
    expect(reserve).toContain("v_order.wave_invoice_approved_at IS NULL");
  });

  it("gates the initial POST and durable pay link on the same reservation", () => {
    const route = source("src/app/api/orders/route.ts");
    const gateway = source("src/app/pay/[token]/page.tsx");
    for (const code of [route, gateway]) {
      const reserve = code.indexOf("reserveOrderCheckout(");
      const clover = code.indexOf("createCloverCheckout(");
      const complete = code.indexOf("completeOrderCheckout(");
      expect(reserve).toBeGreaterThan(0);
      expect(clover).toBeGreaterThan(reserve);
      expect(complete).toBeGreaterThan(clover);
      expect(code.slice(reserve, clover)).toContain('action === "resume"');
      expect(code.slice(reserve, clover)).toContain('action === "wait"');
    }
    expect(route).toContain("emailCheckoutUrl = `${siteUrl}/pay/${payToken}`");
    expect(route).not.toContain("checkoutUrl = `${siteUrl}/pay/${payToken}`;\n      } catch {\n        emailCheckoutUrl");
  });
});
