import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const MIGRATION = "supabase/migrations/20260805120000_quote_email_attribution.sql";

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
