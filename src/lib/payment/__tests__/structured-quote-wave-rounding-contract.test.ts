import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(path.join(
  process.cwd(),
  "supabase/migrations/20260915220000_structured_quote_wave_line_tax_rounding.sql",
), "utf8");

describe("structured quote Wave line-rounding migration", () => {
  it("is additive and preserves aggregate-tax historical revisions", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS structured_tax_rounding_version");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS quote_tax_rounding_version");
    expect(migration).toContain("DEFAULT 'aggregate_v1'");
    expect(migration).toContain("quote_requests_tax_rounding_version_check");
    expect(migration).not.toContain("UPDATE public.quote_requests SET quote_");
  });

  it("uses explicit per-line markers and fail-closed RPC preflights", () => {
    expect(migration).toContain("'wave_per_line_v1'");
    expect(migration).toContain("taxRoundingVersion");
    expect(migration).toContain("QUOTE_TAX_ROUNDING_VERSION_MISMATCH");
    expect(migration).toContain("pg_get_functiondef");
    expect(migration).toContain("pricing tax guard changed");
    expect(migration).toContain("materialization tax guard changed");
    expect(migration).toContain("pricing v2 tax guard changed");
  });

  it("validates saved quote tax components when a payment link materializes an order", () => {
    expect(migration).toContain("public.materialize_quote_order");
    expect(migration).toContain("v_quote.quote_tax_rounding_version");
    expect(migration).toContain("v_quote.quote_gst_cents <> v_expected_gst");
    expect(migration).toContain("v_quote.quote_pst_cents <> v_expected_pst");
    expect(migration).toContain("materialization payment method changed");
    expect(migration).toContain("''wave'', p_quote_id, ''quote_won''");
    expect(migration).toContain("existing-order payment transition changed");
    expect(migration).toContain("NOT IN (''creating'', ''ready'', ''ambiguous'')");
    expect(migration).toContain("quote_checkout_expires_at IS NOT NULL");
    expect(migration).toContain("v_order.quote_checkout_expires_at <= now()");
  });
});
