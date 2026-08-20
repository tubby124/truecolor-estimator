import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260725183000_paid_search_feedback_loop.sql",
  ),
  "utf8",
);
const weeklyMigration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260803210000_paid_search_weekly_decision_surface.sql",
  ),
  "utf8",
);
const weeklyPacingMigration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260803235500_paid_search_weekly_observed_day_pacing.sql",
  ),
  "utf8",
);
const weeklyElapsedPacingMigration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260804001500_paid_search_weekly_elapsed_day_pacing.sql",
  ),
  "utf8",
);

const conversionGraphRepairMigration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260820193000_google_ads_conversion_inventory_contract_repair.sql",
  ),
  "utf8",
);

describe("paid-search feedback schema contract", () => {
  it("stages each reporting grain under an exact run attempt and account", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.google_ads_daily_metrics",
    );
    expect(migration).toContain(
      "entity_type IN ('campaign', 'ad_group', 'keyword', 'search_term')",
    );
    expect(
      migration.match(/google_ads_customer_id = '1072816342'/g),
    ).toHaveLength(3);
    expect(migration).not.toContain("google_ads_customer_id ~");
    expect(migration).toContain(
      "UNIQUE (\n      sync_run_id,\n      attempt_token,\n      google_ads_customer_id,\n      metric_date,\n      entity_type,\n      entity_key",
    );
    expect(migration).toContain(
      "FOREIGN KEY (sync_run_id, google_ads_customer_id)",
    );
    expect(migration).toContain(
      "google_ads_optimization_proposals_run_key_uidx\n    UNIQUE (\n      sync_run_id,\n      attempt_token,\n      google_ads_customer_id,\n      proposal_key",
    );
  });

  it("serializes identical account/range calls and permits safe failed retry generations", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.google_ads_metric_sync_runs",
    );
    expect(migration).toContain("attempt_token uuid NOT NULL");
    expect(migration).toContain(
      "status IN ('running', 'succeeded', 'partial', 'failed')",
    );
    expect(migration).toContain(
      "UNIQUE (google_ads_customer_id, idempotency_key)",
    );
    expect(migration).toContain("UNIQUE (id, google_ads_customer_id)");
    expect(migration).toContain(
      "Failed retries rotate this token so abandoned child rows can never become published.",
    );
    expect(migration).toContain("google_ads_metric_sync_runs_freshness_idx");
    expect(migration).toContain("google_ads_daily_metrics_sync_account_idx");
  });

  it("publishes only rows from the receipt's current succeeded attempt", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW public.google_ads_published_daily_metrics",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW public.google_ads_published_optimization_proposals",
    );
    expect(migration.match(
      /WITH \(security_invoker = true, security_barrier = true\)/g,
    )).toHaveLength(2);
    expect(migration.match(
      /sync_run\.attempt_token = (?:metric|proposal)\.attempt_token/g,
    )).toHaveLength(2);
    expect(migration.match(/WHERE sync_run\.status = 'succeeded'/g)).toHaveLength(2);
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.google_ads_published_daily_metrics",
    );
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.google_ads_published_optimization_proposals",
    );
    expect(migration).toContain(
      "GRANT INSERT, UPDATE ON TABLE public.google_ads_daily_metrics",
    );
    expect(migration).not.toContain(
      "GRANT SELECT, INSERT, UPDATE ON TABLE public.google_ads_daily_metrics",
    );
    expect(migration).toContain(
      "SECURITY DEFINER\nSET search_path = ''",
    );
    expect(migration.match(
      /GRANT EXECUTE ON FUNCTION public\.google_ads_published_/g,
    )).toHaveLength(2);
    expect(migration).toContain(
      "'service_role',\n    'public.google_ads_daily_metrics',\n    'SELECT'",
    );
    expect(weeklyMigration).toContain(
      "CREATE OR REPLACE VIEW public.google_ads_published_weekly_campaign_performance",
    );
    expect(weeklyMigration).toContain(
      "GRANT SELECT ON TABLE public.google_ads_published_weekly_campaign_performance",
    );
    expect(weeklyMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.google_ads_published_weekly_campaign_rows()",
    );
    expect(weeklyMigration).toContain(
      "has_table_privilege(\n       'service_role',\n       'public.google_ads_daily_metrics',\n       'SELECT'",
    );
  });

  it("repairs the conversion goal attestation for the live secondary About Us action", () => {
    expect(conversionGraphRepairMigration).toContain(
      "DROP CONSTRAINT IF EXISTS google_ads_metric_sync_runs_conversion_goal_attestation_check",
    );
    expect(conversionGraphRepairMigration).toContain(
      "ADD CONSTRAINT google_ads_metric_sync_runs_conversion_goal_attestation_check",
    );
    expect(conversionGraphRepairMigration).toContain(
      "Live 2026-08-20 conversion graph",
    );
    expect(conversionGraphRepairMigration).toContain(
      '"name": "About Us"',
    );
    expect(conversionGraphRepairMigration).toContain(
      '"primaryForGoal": false',
    );
    expect(conversionGraphRepairMigration).toContain(
      '"includeInConversionsMetric": false',
    );
    expect(conversionGraphRepairMigration).toContain(
      "jsonb_array_length(conversion_goal_attestation -> 'conversionActions') BETWEEN 3 AND 100",
    );
    expect(conversionGraphRepairMigration).toContain(
      "Unknown included/biddable actions are intentionally rejected by the application contract",
    );
    expect(conversionGraphRepairMigration).not.toMatch(/DROP CONSTRAINT IF EXISTS (?!google_ads_metric_sync_runs_conversion_goal_attestation_check)/);
  });

  it("attests self-owned conversion tracking and non-biddable legacy goals only on success", () => {
    expect(migration).toContain(
      '"googleAdsConversionCustomer": "customers/1072816342"',
    );
    expect(migration).toContain(
      '"conversionTrackingStatus": "CONVERSION_TRACKING_MANAGED_BY_SELF"',
    );
    expect(migration).toContain('"conversionTrackingId": "18330693756"');
    expect(migration).toContain('"crossAccountConversionTrackingId": null');
    expect(migration).toContain('"id": "7694360837"');
    expect(migration).toContain('"id": "7694360840"');
    expect(migration).toContain('"id": "7694360843"');
    expect(migration).toContain('"id": "7688596965"');
    expect(migration.match(
      /"ownerCustomer": "customers\/1072816342"/g,
    )).toHaveLength(4);
    expect(migration).toContain(
      '{"category": "PURCHASE", "origin": "WEBSITE", "biddable": true}',
    );
    expect(migration).toContain(
      '{"category": "PAGE_VIEW", "origin": "WEBSITE", "biddable": false}',
    );
    expect(migration).toMatch(
      /status = 'succeeded'[\s\S]+conversion_goal_attestation IS NOT NULL/,
    );
    expect(migration).toMatch(
      /status IN \('partial', 'failed'\)[\s\S]+conversion_goal_attestation IS NULL/,
    );
  });

  it("keeps proposals permanently review-only with typed non-mutation evidence", () => {
    expect(migration).toContain("status = 'pending_review'");
    expect(migration).toContain("execution_state = 'review_only'");
    expect(migration).toContain("requires_human_review boolean NOT NULL DEFAULT true");
    expect(migration).toContain("auto_apply boolean NOT NULL DEFAULT false");
    expect(migration).toContain("evidence @> '{\"review_only\": true}'::jsonb");
    expect(migration).toContain("NEGATIVE_KEYWORD_REVIEW");
    expect(migration).toContain("mutation-shaped keys rejected");
    expect(migration).not.toContain("proposed_change jsonb");
    expect(migration).not.toMatch(
      /status IN \([\s\S]{0,200}'approved'|'executed'|'execution_failed'/,
    );
    expect(migration.match(/\bCREATE OR REPLACE FUNCTION\b/g)).toHaveLength(2);
    expect(migration).not.toMatch(/\bLANGUAGE plpgsql\b/i);
    expect(migration).not.toMatch(/\bCREATE TRIGGER\b/i);
  });

  it("asserts staging, publication, RLS, and ACL postconditions", () => {
    expect(migration).toContain(
      "to_regclass('public.google_ads_published_daily_metrics') IS NULL",
    );
    expect(migration).toContain("google_ads_metric_sync_runs_id_account_uidx");
    expect(migration).toContain("google_ads_daily_metrics_run_day_entity_uidx");
    expect(migration).toContain(
      "google_ads_optimization_proposals_sync_account_fk",
    );
    expect(migration).toContain(
      "google_ads_optimization_proposals_run_key_uidx",
    );
    expect(migration).toContain("'security_invoker=true' = ANY");
    expect(migration).toContain("'security_barrier=true' = ANY");
    expect(migration).toContain("has_function_privilege(");
    expect(migration).toContain("relation.relrowsecurity");
    expect(migration).toContain("FROM pg_policies");
    expect(migration.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(3);
    expect(
      migration.match(/FROM PUBLIC, anon, authenticated, service_role/g),
    ).toHaveLength(7);
  });

  it("documents pre-tax bidding and observation semantics", () => {
    expect(migration).toContain("Revenue and conversion value are CAD pre-tax values");
    expect(migration).toContain(
      "Page views, carts, and submitted quotes must not be counted here",
    );
    expect(migration).toContain("cart activity is not a bidding conversion");
    expect(migration).toContain("submitted quotes are not bidding conversions");
    expect(weeklyMigration).toContain("search_impression_share numeric(8,6)");
    expect(weeklyMigration).toContain("search_rank_lost_impression_share numeric(8,6)");
    expect(weeklyMigration).toContain("search_budget_lost_impression_share numeric(8,6)");
    expect(weeklyMigration).toContain(
      "THEN 'raise CPC ceiling, auctions lost on price'",
    );
    expect(weeklyMigration).toContain(
      "THEN 'raise daily budget, budget-limited'",
    );
    expect(weeklyMigration).toContain(
      "THEN 'thin market; bids cannot fix; reach change requires an approved contract change'",
    );
    expect(weeklyMigration).not.toMatch(/\b(?:CREATE TRIGGER|LANGUAGE plpgsql)\b/i);
    expect(weeklyPacingMigration).toContain(
      "count(DISTINCT metric.metric_date) AS observed_days",
    );
    expect(weeklyPacingMigration).toContain(
      "weekly_spend_cad / campaign_observed_days",
    );
    expect(weeklyPacingMigration).toContain(
      "pilot_weekly_spend_cad / pilot_observed_days",
    );
    expect(weeklyPacingMigration).not.toMatch(
      /\b(?:CREATE TRIGGER|INSERT INTO|UPDATE public|DELETE FROM)\b/i,
    );
    expect(weeklyElapsedPacingMigration).toContain(
      "FROM public.google_ads_metric_sync_runs AS sync_run",
    );
    expect(weeklyElapsedPacingMigration).toContain(
      "max(sync_run.date_to) AS completed_through",
    );
    expect(weeklyElapsedPacingMigration).toContain(
      "weekly_spend_cad / completed_calendar_days",
    );
    expect(weeklyElapsedPacingMigration).toContain(
      "pilot_weekly_spend_cad / completed_calendar_days",
    );
    expect(weeklyElapsedPacingMigration).not.toContain(
      "count(DISTINCT metric.metric_date)",
    );
    expect(weeklyElapsedPacingMigration).not.toMatch(
      /\b(?:CREATE TRIGGER|INSERT INTO|UPDATE public|DELETE FROM)\b/i,
    );
  });
});
