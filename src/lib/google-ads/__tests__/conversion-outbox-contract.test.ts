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
const reevaluationMigration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260810120000_outbox_reevaluation.sql"),
  "utf8",
);
const quoteLeadMigration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260816010000_google_ads_quote_lead_outbox.sql"),
  "utf8",
);
const manualOrderRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/staff/manual-order/route.ts"),
  "utf8",
);
/** The manual-order route's attribution column list moved into this shared
 *  helper so the Pay Now path can reuse it; the list is still the contract. */
const quoteAttributionHelper = readFileSync(
  path.join(process.cwd(), "src/lib/quotes/quote-attribution.ts"),
  "utf8",
);
const rollupSource = readFileSync(
  path.join(process.cwd(), "src/lib/lifecycle/rollup.ts"),
  "utf8",
);
/** Executable SQL only. The migration's WHY block quotes the old
 *  `ON CONFLICT ... DO NOTHING` clause it replaces, so a raw substring check
 *  would match the comment instead of the statement. */
const reevaluationSql = reevaluationMigration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

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
    expect(worker.match(/p_limit: CLAIM_LIMIT/g)).toHaveLength(4);
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

describe("Google Ads qualified quote lead outbox database contract", () => {
  it("is one row per quote with RLS and no browser-side delivery path", () => {
    expect(quoteLeadMigration).toContain("CREATE TABLE IF NOT EXISTS public.google_ads_quote_lead_outbox");
    expect(quoteLeadMigration).toContain("quote_request_id uuid NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE RESTRICT");
    expect(quoteLeadMigration).toContain("ALTER TABLE public.google_ads_quote_lead_outbox ENABLE ROW LEVEL SECURITY");
    expect(quoteLeadMigration).toContain("REVOKE ALL ON TABLE public.google_ads_quote_lead_outbox FROM anon, authenticated");
    expect(quoteLeadMigration).not.toContain("CREATE POLICY");
  });

  it("uses the existing latest-paid then first-touch click-ID precedence and never replays a quote", () => {
    expect(quoteLeadMigration).toContain("NEW.latest_paid_gclid");
    expect(quoteLeadMigration).toContain("NEW.latest_paid_gbraid");
    expect(quoteLeadMigration).toContain("NEW.latest_paid_wbraid");
    expect(quoteLeadMigration).toContain("NEW.gclid");
    expect(quoteLeadMigration).toContain("num_nonnulls(v_gclid, v_gbraid, v_wbraid) = 1 THEN 'pending' ELSE 'not_attributable'");
    expect(quoteLeadMigration).toContain("AFTER INSERT ON public.quote_requests");
    expect(quoteLeadMigration).toContain("ON CONFLICT (quote_request_id) DO NOTHING");
  });
});

describe("Google Ads conversion outbox re-evaluation", () => {
  it("re-fires on classification and on every click-ID column", () => {
    const triggerDef = /AFTER INSERT OR UPDATE OF([\s\S]*?)ON public\.orders/
      .exec(reevaluationMigration)?.[1];
    expect(triggerDef).toBeTruthy();
    for (const column of [
      "status",
      "paid_at",
      "conversion_type",
      "gclid",
      "gbraid",
      "wbraid",
      "latest_paid_gclid",
      "latest_paid_gbraid",
      "latest_paid_wbraid",
    ]) {
      expect(triggerDef).toContain(column);
    }
  });

  it("replaces DO NOTHING with a guarded promotion instead of a blind overwrite", () => {
    expect(reevaluationSql).toContain("ON CONFLICT (order_id) DO UPDATE SET");
    expect(reevaluationSql).not.toContain("ON CONFLICT (order_id) DO NOTHING");
    expect(reevaluationSql).toContain(
      "WHERE google_ads_conversion_outbox.status = 'not_attributable'",
    );
    expect(reevaluationSql).toContain(
      "AND num_nonnulls(EXCLUDED.gclid, EXCLUDED.gbraid, EXCLUDED.wbraid) = 1",
    );
  });

  it("resets delivery bookkeeping when it promotes a row back to pending", () => {
    for (const reset of [
      "status = 'pending'",
      "attempt_count = 0",
      "next_attempt_at = now()",
      "processing_started_at = NULL",
      "last_error = NULL",
      "data_manager_request_id = NULL",
      "submitted_at = NULL",
      "diagnostic_attempt_count = 0",
    ]) {
      expect(reevaluationMigration).toContain(reset);
    }
  });

  it("preserves the NULL guard and the atomic latest-paid selection", () => {
    expect(reevaluationMigration).toContain("NEW.conversion_type IS NULL");
    expect(reevaluationMigration).toContain(
      "NEW.conversion_type NOT IN ('purchase_online', 'quote_won')",
    );
    expect(reevaluationMigration).toContain("v_gclid := NULLIF(NEW.latest_paid_gclid, '')");
    expect(reevaluationMigration).toContain(
      "COALESCE(NEW.total, 0) - COALESCE(NEW.gst, 0) - COALESCE(NEW.pst, 0)",
    );
    expect(reevaluationMigration.indexOf("NEW.conversion_type IS NULL")).toBeLessThan(
      reevaluationMigration.indexOf("INSERT INTO public.google_ads_conversion_outbox"),
    );
  });

  it("documents the three locks that made late repair impossible", () => {
    expect(reevaluationMigration).toContain("ONE-SHOT TRIGGER");
    expect(reevaluationMigration).toContain("DO NOTHING");
    expect(reevaluationMigration).toContain("TERMINAL not_attributable");
    expect(reevaluationMigration).toContain("95 of 98 paid orders");
  });

  it("keeps the SECURITY DEFINER trigger function off the API roles", () => {
    expect(reevaluationMigration).toContain(
      "REVOKE ALL ON FUNCTION public.enqueue_paid_google_ads_conversion()",
    );
  });
});

describe("manual order conversion identity", () => {
  it("classifies every manual order instead of inserting conversion_type NULL", () => {
    expect(manualOrderRoute).toContain(
      'conversion_type: quoteRequestId ? "quote_won" : "purchase_online"',
    );
  });

  it("mirrors the online path's conversion_key shape", () => {
    expect(manualOrderRoute).toContain("`quote_won:${quoteRequestId}`");
    expect(manualOrderRoute).toContain("`purchase_online:${orderNumber}`");
  });

  it("copies the same attribution columns materialize_quote_order copies", () => {
    // Names are identical on quote_requests and orders, so the RPC's insert
    // column list is the contract. Drift here silently loses the click ID.
    const rpcMigration = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260720100000_quote_conversion_measurement.sql",
      ),
      "utf8",
    );
    const landingPathMigration = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260820180000_landing_path_attribution.sql",
      ),
      "utf8",
    );
    // Deployed attribution now spans the original quote conversion RPC migration
    // plus the later landing-path migration; checking the composed chain keeps
    // helper-declared columns from drifting without rewriting historical SQL.
    const composedAttributionMigration = `${rpcMigration}\n${landingPathMigration}`;
    expect(manualOrderRoute).toContain("pickQuoteAttributionForOrder");
    const declaredBlock = /export const QUOTE_ATTRIBUTION_COLUMNS = \[([\s\S]*?)\] as const;/
      .exec(quoteAttributionHelper)?.[1] ?? "";
    const declared = [...declaredBlock.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
    expect(declared).toContain("landing_path");
    expect(declared).toContain("latest_paid_landing_path");
    expect(declared.length).toBeGreaterThanOrEqual(37);
    for (const column of declared) {
      expect(composedAttributionMigration).toContain(column);
    }
  });

  it("refuses a second order against an already-linked quote", () => {
    expect(manualOrderRoute).toContain('.eq("quote_request_id", requestedQuoteId)');
    expect(manualOrderRoute).toContain("status: 409");
  });
});

describe("paid revenue that never reached the outbox", () => {
  it("registers both blind-spot signals in the shared rollup", () => {
    expect(rollupSource).toContain("paidOrdersMissingConversionType7d");
    expect(rollupSource).toContain("paidOrdersMissingOutboxRow7d");
    expect(rollupSource).toContain('key: "conversion:missing-type"');
    expect(rollupSource).toContain('key: "conversion:missing-outbox-row"');
  });

  it("queries the orders side, not just existing outbox rows", () => {
    expect(lifecycleData).toContain("paidOrdersMissingConversionType7d");
    expect(lifecycleData).toContain("paidOrdersMissingOutboxRow7d");
    expect(lifecycleData).toContain('.not("paid_at", "is", null)');
  });
});
