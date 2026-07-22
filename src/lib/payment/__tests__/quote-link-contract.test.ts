import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("quote payment linkage contract", () => {
  it("puts quote id inside the structured quote's signed Pay Now token", () => {
    const route = source("src/app/api/staff/quotes/[id]/send-quote/route.ts");
    expect(route).toContain("quoteId: id");
    expect(route).toContain("quoteRevision: pricingRevision.quoteRevision");
    expect(route).toContain("setStructuredQuotePricing");
  });

  it("keeps quote GET side-effect-free and requires an explicit POST", () => {
    const gateway = source("src/app/pay/[token]/page.tsx");
    const quoteReturn = gateway.indexOf("if (quoteId)");
    expect(quoteReturn).toBeGreaterThan(0);
    expect(quoteReturn).toBeLessThan(gateway.indexOf("createCloverCheckout("));
    expect(gateway).not.toContain("materializeQuoteOrder");
    expect(gateway).toContain('action="/api/pay/quote" method="post"');

    const post = source("src/app/api/pay/quote/route.ts");
    expect(post).toContain("export async function POST");
    expect(post).toContain("payload.quoteRevision");
    expect(post.indexOf("materializeQuoteOrder")).toBeLessThan(post.indexOf("createCloverCheckout("));
  });

  it("uses locked transactional RPCs for duplicate-safe materialization and repair", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.materialize_quote_order");
    expect(migration).toContain("WHERE q.id = p_quote_id FOR UPDATE");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS orders_quote_request_id_uidx");
    expect(migration).toContain("DELETE FROM public.order_items WHERE order_id = p_order_id");
    expect(migration).toContain("o.quote_request_id = p_quote_id OR o.id = v_quote.converted_order_id");
    expect(migration).toContain("v_quote.quote_revision <> p_signed_quote_revision");
  });

  it("atomically reprices pending linked orders and refuses paid revisions", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.set_structured_quote_pricing");
    expect(migration).toContain("v_order_paid_at IS NOT NULL OR v_order_status <> 'pending_payment'");
    expect(migration).toContain("PAID_QUOTE_IMMUTABLE");
    expect(migration).toContain("v_order_payment_reference IS NOT NULL");
    expect(migration).toContain("QUOTE_CHECKOUT_ALREADY_OPENED");
    expect(migration).toContain("PERFORM public.replace_quote_order_items");
  });

  it("never infers tax from a free-form total", () => {
    const reply = source("src/app/api/staff/quotes/[id]/send-reply/route.ts");
    const helper = source("src/lib/payment/quote-order.ts");
    expect(reply).toContain("Use the branded quote builder");
    expect(reply).not.toContain("encodePaymentToken");
    expect(helper).not.toContain("infer");
    expect(helper).not.toContain("resolveQuoteTaxBreakdown");
  });

  it("backfills replied/archive lifecycle and restricts RPC execution", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("WHEN q.is_archived THEN 'archived'");
    expect(migration).toContain("WHEN q.replied_at IS NOT NULL THEN 'quoted'");
    expect(migration).toContain("COALESCE(q.quoted_at, q.replied_at)");
    expect(migration).not.toContain("COALESCE(q.qualified_at, q.replied_at)");
    expect(migration).toContain("converted_at = COALESCE(q.converted_at");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.sync_quote_archive_lifecycle");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.materialize_quote_order");
    expect(migration).toContain("TO service_role");
  });

  it("queues quote qualification durably after the guarded lifecycle transition", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("v_quote.qualified_at IS NULL");
    expect(migration).toContain("v_quote.lifecycle_status IN ('requested', 'quoted')");
    expect(migration).toContain("qualification_created");
    expect(migration).toContain("quote_measurement_event_outbox");
    expect(migration).toContain("ON CONFLICT (quote_id, event_name) DO NOTHING");

    const cron = source("src/app/api/cron/google-ads-conversions/route.ts");
    const eventStart = cron.indexOf('event_name: "quote_qualified"');
    const eventEnd = cron.indexOf("});", eventStart);
    const event = cron.slice(eventStart, eventEnd);
    expect(event).not.toContain("value:");
    expect(event).not.toContain("currency:");
  });

  it("durably queues quote_submit and quote_qualified with unique event keys", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("AFTER INSERT ON public.quote_requests");
    expect(migration).toContain("VALUES (NEW.id, 'quote_submit')");
    expect(migration).toContain("UNIQUE (quote_id, event_name)");
    expect(source("src/app/api/quote-request/route.ts")).not.toContain('event_name: "quote_submit"');
    expect(source("src/app/api/cron/google-ads-conversions/route.ts")).toContain('event_id: `${event.event_name}:${event.quote_id}`');
  });

  it("reserves and resumes checkout atomically so duplicate POSTs cannot open multiple Clover sessions", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("checkout_action text");
    expect(migration).toContain("quote_checkout_state = 'ready'");
    expect(migration).toContain("quote_checkout_url");
    expect(migration).toContain("now() + interval '16 minutes'");

    const post = source("src/app/api/pay/quote/route.ts");
    expect(post).toContain('quoteOrder.checkoutAction === "resume"');
    expect(post).toContain('quoteOrder.checkoutAction === "wait"');
    expect(post.indexOf('quoteOrder.checkoutAction === "wait"')).toBeLessThan(post.indexOf("createCloverCheckout("));
  });

  it("enforces authoritative configured tax formulas in the database", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("public.truecolor_tax_config");
    expect(migration).toContain("QUOTE_TAX_FORMULA_MISMATCH");
    expect(migration).toContain("structured_quote_pst_base_cents");
    expect(migration).toContain("quote_requests_tax_formula_check");
    expect(migration).toContain("Saskatchewan PST-20 taxes the full charge");
    expect(migration).not.toContain("CASE WHEN item->>'taxClass'");
  });

  it("preserves structured service semantics and source JSON in materialized order items", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("v_item->>'taxClass' = 'rush_service'");
    expect(migration).toContain("THEN 'FULL_DESIGN' ELSE 'PRINT_READY'");
    expect(migration).toContain("line_items_json");
    expect(migration).toContain("is_rush = v_is_rush");
  });

  it("gates regular index creation by measured table size and short timeouts", () => {
    const migration = source("supabase/migrations/20260720100000_quote_conversion_measurement.sql");
    expect(migration).toContain("quote conversion index safety gate");
    expect(migration).toContain("SET LOCAL lock_timeout = '5s'");
    expect(migration).toContain("SET LOCAL statement_timeout = '30s'");
    expect(migration).toContain("customers_email_lower_uidx");
    expect(migration).toContain("ON public.customers (lower(email))");
  });

  it("renders quote review from stored signed cents instead of deriving tax in the page", () => {
    const gateway = source("src/app/pay/[token]/page.tsx");
    expect(gateway).toContain("resolveStoredQuotePaymentBreakdown(data, amountCents, quoteRevision)");
    expect(gateway).toContain("Quote subtotal (before tax)");
    expect(gateway).toContain("breakdown.gstCents");
    expect(gateway).toContain("breakdown.pstCents");
    expect(gateway).toContain("breakdown.totalCents");
    expect(gateway).not.toContain("amountCents * 0.");
  });

  it("does not assign speculative revenue to an unpriced quote request", () => {
    expect(source("src/app/api/quote-request/route.ts")).not.toContain("value: 200");
  });

  it("never accepts a public client price when the engine blocks or throws", () => {
    const orders = source("src/app/api/orders/route.ts");
    expect(orders).not.toContain("accepting client price");
    expect(orders).toContain("must use the quote flow");
    expect(orders).toContain("Unable to price ${item.product_name}");
  });
});
