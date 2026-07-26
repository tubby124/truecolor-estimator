import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { recordCronRun } from "@/lib/cron/heartbeat";
import {
  fetchGoogleAdsDailyPerformance,
  TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS,
  TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
  type GoogleAdsValidatedDailyPerformance,
} from "@/lib/google-ads/performance-client";
import {
  buildReviewOnlySearchTermProposals,
  completedReginaReportWindow,
  mapPerformanceToMetricRecords,
  summarizeSearchTermDisclosure,
  validateManualLookbackDays,
  type GoogleAdsOptimizationProposalRecord,
} from "@/lib/google-ads/performance-feedback";
import { createServiceClient } from "@/lib/supabase/server";
import { constantTimeSecretEqual } from "@/lib/webhooks/shared-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRIC_UPSERT_CHUNK_SIZE = 500;
const PROPOSAL_UPSERT_CHUNK_SIZE = 200;
const GENERIC_SYNC_ERROR = "Google Ads performance sync failed";
const RECEIPT_SELECT = [
  "id",
  "attempt_token",
  "status",
  "campaign_rows",
  "ad_group_rows",
  "keyword_rows",
  "search_term_rows",
  "proposal_rows",
  "search_term_disclosure_summary",
].join(",");

interface SyncReceipt {
  id: string;
  attempt_token: string;
  status: "running" | "succeeded" | "partial" | "failed";
  campaign_rows: number;
  ad_group_rows: number;
  keyword_rows: number;
  search_term_rows: number;
  proposal_rows: number;
  search_term_disclosure_summary: unknown;
}

function authorized(req: NextRequest, secret: string): boolean {
  return constantTimeSecretEqual(
    req.headers.get("authorization") ?? "",
    `Bearer ${secret}`,
  );
}

function requestedLookbackDays(req: NextRequest): number | undefined {
  const raw = new URL(req.url).searchParams.get("days");
  if (raw === null) return undefined;
  if (!/^\d+$/.test(raw)) {
    throw new Error("lookbackDays must be an integer from 1 to 31");
  }
  return validateManualLookbackDays(Number(raw));
}

function assertCanonicalInventory(
  performance: GoogleAdsValidatedDailyPerformance,
): void {
  const { inventory } = performance;
  if (
    inventory.customerId !== TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID
    || inventory.currencyCode !== "CAD"
    || inventory.timeZone !== "America/Regina"
    || inventory.campaigns.length !== TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.length
  ) {
    throw new Error("INVENTORY_VALIDATION_FAILED");
  }

  const byId = new Map(inventory.campaigns.map((campaign) => [campaign.id, campaign]));
  for (const expected of TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS) {
    const actual = byId.get(expected.id);
    if (
      !actual
      || actual.name !== expected.name
      || !(expected.allowedStatuses as readonly string[]).includes(actual.status)
    ) {
      throw new Error("INVENTORY_VALIDATION_FAILED");
    }
  }

  const expectedOwner = `customers/${TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID}`;
  if (
    inventory.conversionTracking.googleAdsConversionCustomer !== expectedOwner
    || inventory.conversionTracking.conversionTrackingStatus
      !== "CONVERSION_TRACKING_MANAGED_BY_SELF"
    || inventory.conversionTracking.conversionTrackingId !== "18330693756"
    || inventory.conversionTracking.crossAccountConversionTrackingId !== null
  ) {
    throw new Error("INVENTORY_VALIDATION_FAILED");
  }

  const expectedConversionActions = [
    {
      id: "7694360837",
      name: "purchase_online",
      category: "PURCHASE",
      origin: "WEBSITE",
      primaryForGoal: true,
      includeInConversionsMetric: true,
    },
    {
      id: "7694360840",
      name: "quote_won",
      category: "PURCHASE",
      origin: "WEBSITE",
      primaryForGoal: true,
      includeInConversionsMetric: true,
    },
    {
      id: "7694360843",
      name: "qualified_call_60s",
      category: "PHONE_CALL_LEAD",
      origin: "CALL_FROM_ADS",
      primaryForGoal: false,
      includeInConversionsMetric: false,
    },
    {
      id: "7688596965",
      name: "About Us",
      category: "PAGE_VIEW",
      origin: "WEBSITE",
      primaryForGoal: true,
      includeInConversionsMetric: false,
    },
  ] as const;
  const conversionById = new Map(
    inventory.conversionActions.map((action) => [action.id, action]),
  );
  for (const expected of expectedConversionActions) {
    const actual = conversionById.get(expected.id);
    if (
      !actual
      || actual.name !== expected.name
      || actual.status !== "ENABLED"
      || actual.category !== expected.category
      || actual.origin !== expected.origin
      || actual.ownerCustomer !== expectedOwner
      || actual.primaryForGoal !== expected.primaryForGoal
      || actual.includeInConversionsMetric !== expected.includeInConversionsMetric
    ) {
      throw new Error("INVENTORY_VALIDATION_FAILED");
    }
  }

  const expectedCustomerGoals = [
    { category: "PURCHASE", origin: "WEBSITE", biddable: true },
    { category: "PAGE_VIEW", origin: "WEBSITE", biddable: false },
    {
      category: "PHONE_CALL_LEAD",
      origin: "CALL_FROM_ADS",
      biddable: false,
    },
  ] as const;
  for (const expected of expectedCustomerGoals) {
    if (!inventory.customerConversionGoals.some((actual) =>
      actual.category === expected.category
      && actual.origin === expected.origin
      && actual.biddable === expected.biddable
    )) {
      throw new Error("INVENTORY_VALIDATION_FAILED");
    }
  }
  if (inventory.customerConversionGoals.some((actual) =>
    actual.biddable
    && !expectedCustomerGoals.some((expected) =>
      expected.biddable
      && actual.category === expected.category
      && actual.origin === expected.origin
    )
  )) {
    throw new Error("INVENTORY_VALIDATION_FAILED");
  }
  for (const action of inventory.conversionActions) {
    if (
      !expectedConversionActions.some(({ id }) => id === action.id)
      && (action.primaryForGoal || action.includeInConversionsMetric)
    ) {
      throw new Error("INVENTORY_VALIDATION_FAILED");
    }
  }
}

function sanitizedReceiptError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message === "INVENTORY_VALIDATION_FAILED"
    || /account inventory|campaign inventory|canonical campaign/i.test(message)
  ) {
    return "Google Ads account inventory validation failed";
  }
  if (/GOOGLE_ADS_|OAuth|credentials?/i.test(message)) {
    return "Google Ads authentication failed";
  }
  if (message === "METRIC_UPSERT_FAILED") {
    return "Google Ads metric snapshot persistence failed";
  }
  if (message === "PROPOSAL_UPSERT_FAILED") {
    return "Google Ads proposal persistence failed";
  }
  if (message === "SUCCESS_RECEIPT_UPDATE_FAILED") {
    return "Google Ads success receipt persistence failed";
  }
  return GENERIC_SYNC_ERROR;
}

function reviewOnlyProposalRecord(
  proposal: GoogleAdsOptimizationProposalRecord,
) {
  const proposalType = proposal.proposed_change.proposal_type;
  const recommendationType = proposalType === "NEGATIVE_KEYWORD_REVIEW"
    ? "negative_keyword_review"
    : proposalType === "PROMOTE_EXACT_REVIEW"
      ? "exact_keyword_review"
      : "search_term_review";

  return {
    google_ads_customer_id: proposal.google_ads_customer_id,
    proposal_key: proposal.proposal_key,
    evidence_date_from: proposal.evidence_date_from,
    evidence_date_to: proposal.evidence_date_to,
    entity_type: proposal.entity_type,
    entity_key: proposal.entity_key,
    recommendation_type: recommendationType,
    rationale: proposal.rationale,
    evidence: proposal.proposed_change,
    status: "pending_review",
    execution_state: "review_only",
    requires_human_review: true,
    auto_apply: false,
    updated_at: proposal.updated_at,
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let lookbackDays: number | undefined;
  try {
    lookbackDays = requestedLookbackDays(req);
  } catch {
    return NextResponse.json(
      { ok: false, error: "days must be an integer from 1 to 31" },
      { status: 400 },
    );
  }

  const range = lookbackDays === undefined
    ? completedReginaReportWindow()
    : completedReginaReportWindow(new Date(), lookbackDays);
  const supabase = createServiceClient();
  const startedAt = new Date().toISOString();
  const idempotencyKey = [
    "google-ads-performance-v1",
    TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
    range.startDate,
    range.endDate,
  ].join(":");

  let syncRunId: string;
  let attemptToken: string;
  try {
    const findReceipt = async (): Promise<SyncReceipt | null> => {
      const { data, error } = await supabase
        .from("google_ads_metric_sync_runs")
        .select(RECEIPT_SELECT)
        .eq("google_ads_customer_id", TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (error) throw new Error("RUNNING_RECEIPT_READ_FAILED");
      return data as SyncReceipt | null;
    };

    let ownsReceipt = false;
    let receipt = await findReceipt();
    if (!receipt) {
      const insertedAttemptToken = randomUUID();
      const { data: inserted, error: insertError } = await supabase
        .from("google_ads_metric_sync_runs")
        .insert({
          attempt_token: insertedAttemptToken,
          google_ads_customer_id: TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
          idempotency_key: idempotencyKey,
          date_from: range.startDate,
          date_to: range.endDate,
          status: "running",
          campaign_rows: 0,
          ad_group_rows: 0,
          keyword_rows: 0,
          search_term_rows: 0,
          proposal_rows: 0,
          verified_currency_code: null,
          verified_time_zone: null,
          canonical_campaign_inventory: null,
          conversion_goal_attestation: null,
          search_term_disclosure_summary: null,
          error_detail: null,
          started_at: startedAt,
          completed_at: null,
          updated_at: startedAt,
        })
        .select(RECEIPT_SELECT)
        .maybeSingle();
      if (!insertError && inserted) {
        receipt = inserted as unknown as SyncReceipt;
        ownsReceipt = true;
      } else if (insertError?.code === "23505") {
        receipt = await findReceipt();
      } else {
        throw new Error("RUNNING_RECEIPT_WRITE_FAILED");
      }
    }

    if (!receipt) throw new Error("RUNNING_RECEIPT_READ_FAILED");
    if (receipt.status === "succeeded") {
      const metrics =
        Number(receipt.campaign_rows)
        + Number(receipt.ad_group_rows)
        + Number(receipt.keyword_rows)
        + Number(receipt.search_term_rows);
      await recordCronRun(
        "google-ads-performance",
        true,
        `range=${range.startDate}..${range.endDate} idempotent=1`,
      );
      return NextResponse.json({
        ok: true,
        idempotent: true,
        dateFrom: range.startDate,
        dateTo: range.endDate,
        metricsUpserted: metrics,
        proposalsPrepared: Number(receipt.proposal_rows),
        disclosure: receipt.search_term_disclosure_summary,
      });
    }
    if (receipt.status === "running") {
      if (!ownsReceipt) {
        return NextResponse.json(
          { ok: false, error: "Google Ads performance sync already running" },
          { status: 409 },
        );
      }
    }

    if (receipt.status !== "running") {
      const reclaimedAttemptToken = randomUUID();
      const reclaimedAt = new Date().toISOString();
      const { data: reclaimed, error: reclaimError } = await supabase
        .from("google_ads_metric_sync_runs")
        .update({
          attempt_token: reclaimedAttemptToken,
          status: "running",
          campaign_rows: 0,
          ad_group_rows: 0,
          keyword_rows: 0,
          search_term_rows: 0,
          proposal_rows: 0,
          verified_currency_code: null,
          verified_time_zone: null,
          canonical_campaign_inventory: null,
          conversion_goal_attestation: null,
          search_term_disclosure_summary: null,
          error_detail: null,
          started_at: reclaimedAt,
          completed_at: null,
          updated_at: reclaimedAt,
        })
        .eq("id", receipt.id)
        .eq("status", receipt.status)
        .eq("attempt_token", receipt.attempt_token)
        .select(RECEIPT_SELECT)
        .maybeSingle();
      if (reclaimError) throw new Error("RUNNING_RECEIPT_WRITE_FAILED");
      if (!reclaimed) {
        const current = await findReceipt();
        if (current?.status === "succeeded") {
          const metrics =
            Number(current.campaign_rows)
            + Number(current.ad_group_rows)
            + Number(current.keyword_rows)
            + Number(current.search_term_rows);
          await recordCronRun(
            "google-ads-performance",
            true,
            `range=${range.startDate}..${range.endDate} idempotent=1`,
          );
          return NextResponse.json({
            ok: true,
            idempotent: true,
            dateFrom: range.startDate,
            dateTo: range.endDate,
            metricsUpserted: metrics,
            proposalsPrepared: Number(current.proposal_rows),
            disclosure: current.search_term_disclosure_summary,
          });
        }
        return NextResponse.json({
          ok: false,
          error: "Google Ads performance sync already running",
        }, { status: 409 });
      }
      receipt = reclaimed as unknown as SyncReceipt;
    }
    syncRunId = receipt.id;
    attemptToken = receipt.attempt_token;
  } catch {
    await recordCronRun(
      "google-ads-performance",
      false,
      "running_receipt_failed=1",
    );
    return NextResponse.json(
      { ok: false, error: GENERIC_SYNC_ERROR },
      { status: 503 },
    );
  }

  try {
    // The client validates exact account identity, CAD, Regina time, and the
    // complete canonical campaign inventory before it starts report reads.
    // Awaiting this call completes every upstream read before snapshot writes.
    const performance = await fetchGoogleAdsDailyPerformance(range);
    assertCanonicalInventory(performance);

    const fetchedAt = new Date().toISOString();
    const metricRecords = mapPerformanceToMetricRecords(performance, {
      syncRunId,
      fetchedAt,
    }).map((record) => ({ ...record, attempt_token: attemptToken }));
    const proposals = buildReviewOnlySearchTermProposals(
      performance.searchTerms,
      range,
      fetchedAt,
    ).map((proposal) => ({
      ...reviewOnlyProposalRecord(proposal),
      sync_run_id: syncRunId,
      attempt_token: attemptToken,
    }));
    const disclosure = summarizeSearchTermDisclosure(performance);

    for (
      let offset = 0;
      offset < metricRecords.length;
      offset += METRIC_UPSERT_CHUNK_SIZE
    ) {
      const chunk = metricRecords.slice(offset, offset + METRIC_UPSERT_CHUNK_SIZE);
      const { error } = await supabase
        .from("google_ads_daily_metrics")
        .upsert(chunk, {
          onConflict:
            "sync_run_id,attempt_token,google_ads_customer_id,metric_date,entity_type,entity_key",
        });
      if (error) throw new Error("METRIC_UPSERT_FAILED");
    }

    for (
      let offset = 0;
      offset < proposals.length;
      offset += PROPOSAL_UPSERT_CHUNK_SIZE
    ) {
      const chunk = proposals.slice(offset, offset + PROPOSAL_UPSERT_CHUNK_SIZE);
      const { error } = await supabase
        .from("google_ads_optimization_proposals")
        .upsert(chunk, {
          onConflict:
            "sync_run_id,attempt_token,google_ads_customer_id,proposal_key",
        });
      if (error) throw new Error("PROPOSAL_UPSERT_FAILED");
    }

    const completedAt = new Date().toISOString();
    const { data: completed, error: completionError } = await supabase
      .from("google_ads_metric_sync_runs")
      .update({
        status: "succeeded",
        campaign_rows: performance.campaigns.length,
        ad_group_rows: performance.adGroups.length,
        keyword_rows: performance.keywords.length,
        search_term_rows: performance.searchTerms.length,
        proposal_rows: proposals.length,
        verified_currency_code: performance.inventory.currencyCode,
        verified_time_zone: performance.inventory.timeZone,
        canonical_campaign_inventory: performance.inventory.campaigns,
        conversion_goal_attestation: {
          conversionTracking: performance.inventory.conversionTracking,
          conversionActions: performance.inventory.conversionActions,
          customerConversionGoals: performance.inventory.customerConversionGoals,
        },
        search_term_disclosure_summary: disclosure,
        error_detail: null,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq("id", syncRunId)
      .eq("status", "running")
      .eq("attempt_token", attemptToken)
      .select("id")
      .maybeSingle();
    if (completionError || !completed) {
      throw new Error("SUCCESS_RECEIPT_UPDATE_FAILED");
    }

    const detail =
      `range=${range.startDate}..${range.endDate} ` +
      `metrics=${metricRecords.length} proposals=${proposals.length}`;
    // A healthy heartbeat is evidence only after durable success is recorded.
    await recordCronRun("google-ads-performance", true, detail);

    return NextResponse.json({
      ok: true,
      idempotent: false,
      dateFrom: range.startDate,
      dateTo: range.endDate,
      metricsUpserted: metricRecords.length,
      proposalsPrepared: proposals.length,
      disclosure,
    });
  } catch (error) {
    const safeError = sanitizedReceiptError(error);
    const completedAt = new Date().toISOString();
    const { data: failed, error: failureReceiptError } = await supabase
      .from("google_ads_metric_sync_runs")
      .update({
        status: "failed",
        verified_currency_code: null,
        verified_time_zone: null,
        canonical_campaign_inventory: null,
        conversion_goal_attestation: null,
        search_term_disclosure_summary: null,
        error_detail: safeError.slice(0, 500),
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq("id", syncRunId)
      .eq("status", "running")
      .eq("attempt_token", attemptToken)
      .select("id")
      .maybeSingle();

    const durableFailure = !failureReceiptError && Boolean(failed);
    await recordCronRun(
      "google-ads-performance",
      false,
      `failed=1 durable_receipt=${durableFailure ? 1 : 0}`,
    );
    console.error("[google-ads-performance]", safeError);
    return NextResponse.json(
      { ok: false, error: GENERIC_SYNC_ERROR },
      { status: 503 },
    );
  }
}
