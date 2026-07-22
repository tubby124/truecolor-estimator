import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260720110000_google_ads_conversion_outbox.sql"),
  "utf8",
);
const worker = readFileSync(
  path.join(process.cwd(), "src/app/api/cron/google-ads-conversions/route.ts"),
  "utf8",
);
const lifecycleData = readFileSync(
  path.join(process.cwd(), "src/app/staff/lifecycle/data.ts"),
  "utf8",
);

describe("Google Ads conversion outbox database contract", () => {
  it("enqueues only paid revenue classifications with pretax value", () => {
    expect(migration).toContain("NEW.paid_at IS NULL");
    expect(migration).toContain("NEW.conversion_type NOT IN ('purchase_online', 'quote_won')");
    expect(migration).toContain("COALESCE(NEW.total, 0) - COALESCE(NEW.gst, 0) - COALESCE(NEW.pst, 0)");
  });

  it("deduplicates by order and claims retries with row locks", () => {
    expect(migration).toContain("UNIQUE (order_id)");
    expect(migration).toContain("UNIQUE (order_number, conversion_type)");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("ON CONFLICT (order_id) DO NOTHING");
  });

  it("documents at-least-once delivery with stable Google orderId deduplication", () => {
    expect(migration).toContain("at-least-once");
    expect(migration).toContain("stable orderId");
  });

  it("acknowledges sent only when exactly one processing row is returned", () => {
    expect(worker).toContain('.eq("status", "processing")');
    expect(worker).toContain('.select("id")');
    expect(worker).toContain("updateError || !updated");
  });

  it("keeps unattributed paid orders visible for reconciliation", () => {
    expect(migration).toContain("'not_attributable'");
    expect(migration).toContain("latest_paid_gclid");
  });

  it("bounds both sequential claims within the five-minute worker deadline", () => {
    expect(worker).toContain("const CLAIM_LIMIT = 1");
    expect(worker.match(/p_limit: CLAIM_LIMIT/g)).toHaveLength(2);
  });

  it("delegates alerts to the shared lifecycle rollup", () => {
    expect(worker).not.toContain("sendTelegramNotification");
    expect(lifecycleData).toContain('.from("google_ads_conversion_outbox")');
    expect(lifecycleData).toContain('.from("quote_measurement_event_outbox")');
    expect(lifecycleData).toContain("measurementOutboxes");
  });

  it("uses the actual paid order states for lifecycle bookkeeping visibility", () => {
    expect(lifecycleData).toContain(
      'new Set(["payment_received", "in_production", "ready_for_pickup", "complete"])',
    );
    expect(lifecycleData).not.toContain('new Set(["paid", "in_production"');
  });
});
