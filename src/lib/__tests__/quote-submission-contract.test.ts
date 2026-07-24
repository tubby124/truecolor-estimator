import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("quote submission exact-once contract", () => {
  const producers = [
    "src/components/paid/PaidQuoteForm.tsx",
    "src/components/contact/ContactForm.tsx",
    "src/app/quote/page.tsx",
    "src/app/portal/[brokerage]/PortalOrderForm.tsx",
  ];

  it("sends a stable browser-generated submission key from every active quote form", () => {
    for (const path of producers) {
      const contents = source(path);
      expect(contents, path).toContain("getOrCreateQuoteSubmission");
      expect(contents, path).toContain("clearQuoteSubmission");
      expect(contents, path).toContain('"submission_key"');
    }
    const clientGuard = source("src/lib/quote-request-client.ts");
    expect(clientGuard).toContain("window.sessionStorage");
    expect(clientGuard).toContain("fingerprintQuotePayload");
  });

  it("gives every active quote form a Turnstile token path", () => {
    for (const path of producers) {
      const contents = source(path);
      expect(contents, path).toContain(
        "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY",
      );
      expect(contents, path).toContain('"cf-turnstile-response"');
    }
  });

  it("deduplicates at the database boundary and returns the existing quote on a race", () => {
    const route = source("src/app/api/quote-request/route.ts");
    const migration = source(
      "supabase/migrations/20260724070000_quote_request_idempotency.sql",
    );
    const concurrentIndexScript = source(
      "scripts/db/prepare-quote-request-idempotency-index.sh",
    );

    expect(migration).toContain("ADD COLUMN IF NOT EXISTS submission_key uuid");
    expect(migration).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_submission_key_uidx",
    );
    expect(migration).toContain("precreate quote_requests_submission_key_uidx concurrently");
    expect(migration).toContain(
      "quote request idempotency postcondition failed",
    );
    expect(concurrentIndexScript).toContain(
      "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS quote_requests_submission_key_uidx",
    );
    expect(concurrentIndexScript).toContain("pg_catalog.pg_get_indexdef");
    expect(route).toContain('.eq("submission_key", submissionKey)');
    expect(route).toContain('insertError?.code === "23505"');
    expect(route).toContain("insertedId = racedQuote.id as string");
    expect(route).toContain("return quoteSuccess(insertedId, isDuplicate)");
    expect(route).toContain(
      "const path = `quote-requests/${submissionKey}/item-${i}-${safeName}`",
    );
  });

  it("persists provider acceptance and retries incomplete emails without duplicating them", () => {
    const route = source("src/app/api/quote-request/route.ts");
    const migration = source(
      "supabase/migrations/20260724070000_quote_request_idempotency.sql",
    );
    expect(migration).toContain("staff_notification_sent_at timestamptz");
    expect(migration).toContain("customer_confirmation_sent_at timestamptz");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.quote_request_deliveries");
    expect(migration).toContain("claim_quote_request_delivery");
    expect(migration).toContain("complete_quote_request_delivery");
    expect(migration).toContain("record_quote_request_delivery_failure");
    expect(migration).toContain("list_quote_request_deliveries");
    expect(migration).toContain("resolve_stale_quote_request_delivery");
    expect(migration).toContain("QUOTE_REQUEST_DELIVERY_RESOLUTION_NOT_STALE");
    expect(migration).toContain("quote_request_deliveries_provider_id_check");
    expect(migration).toContain("'delivery_failed'");
    expect(migration).toContain("'post_acceptance_failed'");
    expect(migration).toContain("THEN 'delivery_failed'");
    expect(migration).toContain("interval '23 hours'");
    expect(route).toContain("idempotencyKey: `quote-request/${delivery.delivery_id}`");
    expect(route).toContain('"quote_request_delivery_id"');
    expect(route).toContain('"complete_quote_request_delivery"');
    expect(route).toContain('"record_quote_request_delivery_failure"');
    expect(route).toContain(
      '"Your quote was saved, but its confirmation is still being delivered.',
    );
    expect(route).not.toContain("will get back to you within 1 business day");
  });
});
