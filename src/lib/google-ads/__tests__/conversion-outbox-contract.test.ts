import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260720110000_google_ads_conversion_outbox.sql"),
  "utf8",
);
const diagnosticMigration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260723123000_google_data_manager_diagnostics.sql"),
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
    expect(migration).toContain("NEW.conversion_type IS NULL");
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

  it("records accepted ingest as submitted rather than delivered", () => {
    expect(worker).toContain('status: "submitted"');
    expect(worker).toContain("data_manager_request_id: result.requestId");
    expect(worker).not.toMatch(/uploadPaidConversion\(job\)[\s\S]{0,1200}status: "sent"/);
  });

  it("acknowledges sent only when exactly one unchanged submitted row is returned", () => {
    expect(worker).toContain('.eq("status", "submitted")');
    expect(worker).toContain('.eq("data_manager_request_id", job.data_manager_request_id)');
    expect(worker).toContain('.select("id")');
    expect(worker).toContain("updateError || !updated");
  });

  it("keeps unattributed paid orders visible for reconciliation", () => {
    expect(migration).toContain("'not_attributable'");
    expect(migration).toContain("latest_paid_gclid");
  });

  it("bounds both sequential claims within the five-minute worker deadline", () => {
    expect(worker).toContain("const CLAIM_LIMIT = 1");
    expect(worker.match(/p_limit: CLAIM_LIMIT/g)).toHaveLength(3);
  });

  it("claims due diagnostics with row locking and a crash lease", () => {
    expect(diagnosticMigration).toContain("claim_google_ads_conversion_diagnostics");
    expect(diagnosticMigration).toContain("status = 'submitted'");
    expect(diagnosticMigration).toContain("next_diagnostic_at <= now()");
    expect(diagnosticMigration).toContain("FOR UPDATE SKIP LOCKED");
    expect(diagnosticMigration).toContain("next_diagnostic_at = now() + interval '15 minutes'");
    expect(diagnosticMigration).toContain("diagnostic_claimed_at = now()");
    expect(diagnosticMigration).not.toContain("diagnostics_checked_at = now()");
  });

  it("preserves the repaired enqueue trigger while adding asynchronous state", () => {
    expect(diagnosticMigration).toContain("'submitted'");
    expect(diagnosticMigration).not.toContain("CREATE OR REPLACE FUNCTION public.enqueue_paid_google_ads_conversion");
    expect(diagnosticMigration).toContain("preserving the NULL conversion_type");
  });

  it("bounds regular index creation and documents the coordinated rollback", () => {
    expect(diagnosticMigration).toContain("v_outbox_count > 10000");
    expect(diagnosticMigration).toContain("CONCURRENTLY is unavailable");
    expect(diagnosticMigration).toContain("WHERE status = 'submitted'");
    expect(diagnosticMigration).toContain("stable order_number/transaction ID");
  });

  it("delegates alerts to the shared lifecycle rollup", () => {
    expect(worker).not.toContain("sendTelegramNotification");
    expect(lifecycleData).toContain('.from("google_ads_conversion_outbox")');
    expect(lifecycleData).toContain('.from("quote_measurement_event_outbox")');
    expect(lifecycleData).toContain("measurementOutboxes");
    expect(lifecycleData).toContain('row.status === "submitted"');
    expect(lifecycleData).toContain("row.next_diagnostic_at == null");
  });

  it("uses the actual paid order states for lifecycle bookkeeping visibility", () => {
    expect(lifecycleData).toContain(
      'new Set(["payment_received", "in_production", "ready_for_pickup", "complete"])',
    );
    expect(lifecycleData).not.toContain('new Set(["paid", "in_production"');
  });
});
