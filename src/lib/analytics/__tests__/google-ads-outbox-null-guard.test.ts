import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260722154500_google_ads_outbox_null_guard.sql",
  ),
  "utf8",
);

describe("Google Ads outbox null-guard repair", () => {
  it("skips databases where the draft Ads trigger is not installed", () => {
    expect(migration).toContain(
      "to_regprocedure('public.enqueue_paid_google_ads_conversion()') IS NULL",
    );
  });

  it("returns before inserting an unclassified legacy order", () => {
    expect(migration).toMatch(
      /OR NEW\.conversion_type IS NULL\s+OR NEW\.conversion_type NOT IN/,
    );
    expect(migration.indexOf("NEW.conversion_type IS NULL")).toBeLessThan(
      migration.indexOf("INSERT INTO public.google_ads_conversion_outbox"),
    );
  });
});
