import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const MIGRATION = "supabase/migrations/20260805120000_quote_email_attribution.sql";
const SKIP_LINKED_MIGRATION =
  "supabase/migrations/20260816000000_attribute_quote_conversions_skip_linked.sql";

describe("quote email attribution contract", () => {
  it("records how each conversion was attributed", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS attribution_method text");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS attributed_at timestamptz");
    expect(sql).toContain("attribution_method IN ('pay_now', 'email_match')");
  });

  it("never lets two quotes claim the same order", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_converted_order_id_uidx",
    );
  });

  it("leaves the structured Pay Now path untouched", () => {
    const sql = source(MIGRATION);
    expect(sql).not.toContain("UPDATE public.orders");
    expect(sql).toContain("o.quote_request_id IS NULL");
  });

  it("supports a side-effect-free dry run", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("p_dry_run boolean DEFAULT false");
    expect(sql).toContain("AND NOT p_dry_run");
  });

  it("only ever fills empty conversion fields", () => {
    const sql = source(MIGRATION);
    expect(sql).toContain("q.converted_order_id IS NULL");
    expect(sql).toContain("won_at = COALESCE(q.won_at,");
    expect(sql).toContain("converted_at = COALESCE(q.converted_at,");
  });
});

/**
 * /api/staff/manual-order writes orders.quote_request_id when the order is
 * created, which is before it is paid. The cron's candidate set only filtered on
 * `o.quote_request_id IS NULL` per order, so a quote already spoken for by an
 * unpaid order could still be claimed for someone else's paid order — and the
 * payment sync would then re-point converted_order_id at the wrong sale.
 */
describe("quote email attribution skips already-linked quotes", () => {
  it("replaces the function rather than forking a second attribution path", () => {
    const sql = source(SKIP_LINKED_MIGRATION);
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.attribute_quote_conversions");
    expect(sql).toContain("p_window_days integer DEFAULT 60");
    expect(sql).toContain("p_dry_run boolean DEFAULT false");
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.attribute_quote_conversions\(integer, boolean\) TO service_role/,
    );
  });

  it("excludes every quote an order already references", () => {
    const sql = source(SKIP_LINKED_MIGRATION);
    expect(sql).toMatch(
      /AND NOT EXISTS\s*\(\s*SELECT 1 FROM public\.orders o2\s*WHERE o2\.quote_request_id = q\.id\s*\)/,
    );
    // The per-order guard from the original definition must survive alongside it.
    expect(sql).toContain("o.quote_request_id IS NULL");
    expect(sql).toContain("claimed.converted_order_id = o.id");
  });

  it("still writes only to quote_requests", () => {
    const sql = source(SKIP_LINKED_MIGRATION);
    expect(sql).toContain("UPDATE public.quote_requests q");
    expect(sql).not.toContain("UPDATE public.orders");
    expect(sql).toContain("AND NOT p_dry_run");
  });
});
