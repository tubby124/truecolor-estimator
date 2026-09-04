import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260902130000_commerce_purchase_outbox.sql"),
  "utf8",
);

describe("universal commerce purchase outbox contract", () => {
  it("records every confirmed paid order with one stable business event key", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.commerce_purchase_outbox");
    expect(migration).toContain("UNIQUE (order_id)");
    expect(migration).toContain("UNIQUE (business_event_key)");
    expect(migration).toContain("'purchase:' || NEW.id::text");
    expect(migration).toContain("AFTER INSERT OR UPDATE OF status, paid_at ON public.orders");
    expect(migration).toContain("ON CONFLICT (order_id) DO NOTHING");
  });

  it("holds delivery by default and exposes missing or divergent rows for reconciliation", () => {
    expect(migration).toContain("DEFAULT 'held'");
    expect(migration).toContain("CREATE OR REPLACE VIEW public.commerce_purchase_reconciliation");
    for (const status of ["missing_outbox", "paid_at_mismatch", "total_mismatch", "tax_mismatch", "matched"]) {
      expect(migration).toContain(`'${status}'`);
    }
  });
});
