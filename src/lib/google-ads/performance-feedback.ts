import { createHash } from "node:crypto";

import { paidSearchConfig } from "../../../docs/paid-search/campaign-config.mjs";
import {
  MAX_GOOGLE_ADS_REPORT_DAYS,
  TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
  type GoogleAdsDailyPerformance,
  type GoogleAdsDailySearchTermPerformance,
  type GoogleAdsDateRange,
} from "./performance-client";

const REGINA_TIME_ZONE = "America/Regina";
const DEFAULT_LOOKBACK_DAYS = 30;

type MetricEntityType = "campaign" | "ad_group" | "keyword" | "search_term";

export type SearchTermProposalType =
  | "NEGATIVE_KEYWORD_REVIEW"
  | "PROMOTE_EXACT_REVIEW"
  | "SEARCH_TERM_REVIEW";

export interface GoogleAdsDailyMetricRecord {
  sync_run_id: string;
  google_ads_customer_id: string;
  metric_date: string;
  entity_type: MetricEntityType;
  entity_key: string;
  campaign_id: string;
  campaign_name: string;
  ad_group_id: string | null;
  ad_group_name: string | null;
  keyword_criterion_id: string | null;
  keyword_text: string | null;
  keyword_match_type: string | null;
  search_term: string | null;
  currency_code: "CAD";
  impressions: string;
  clicks: string;
  cost_micros: string;
  bidding_conversions: number;
  bidding_conversion_value_cad: number;
  paid_orders: 0;
  pretax_revenue_cad: 0;
  observed_page_views: 0;
  observed_cart_events: 0;
  observed_submitted_quotes: 0;
  fetched_at: string;
  updated_at: string;
}

export interface GoogleAdsOptimizationProposalRecord {
  google_ads_customer_id: string;
  proposal_key: string;
  evidence_date_from: string;
  evidence_date_to: string;
  entity_type: "search_term";
  entity_key: string;
  recommendation_type: "add_negative_keyword" | "add_keyword" | "no_change";
  rationale: string;
  proposed_change: {
    review_only: true;
    proposal_type: SearchTermProposalType;
    disclosed_search_term: string;
    evidence: {
      clicks: string;
      cost_micros: string;
      conversions: number;
      conversion_value_cad: number;
      targeting_status: string;
    };
  };
  status: "proposed";
  requires_human_review: true;
  auto_apply: false;
  updated_at: string;
}

export interface SearchTermDisclosureSummary {
  account_clicks: string;
  disclosed_search_term_clicks: string;
  undisclosed_search_terms: "UNKNOWN";
}

interface MetricIdentity {
  entityType: MetricEntityType;
  campaignId: string;
  adGroupId?: string;
  criterionId?: string;
  searchTerm?: string;
}

const canonicalNegativeEntries = paidSearchConfig.accountNegatives as ReadonlyArray<{
  text?: unknown;
}>;
const canonicalNegativeTerms: string[] = Array.from(new Set(
  canonicalNegativeEntries
    .map((entry) => entry.text)
    .filter((text): text is string => typeof text === "string" && text !== ""),
));

function normalizedSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-CA")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function dateOnlyToUtc(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function shiftDate(value: string, days: number): string {
  const date = dateOnlyToUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function reginaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REGINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function requireIntegerMetric(value: string, field: string): string {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${field} must be a non-negative integer string`);
  }
  return value;
}

function requireFiniteMetric(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number`);
  }
  return value;
}

function sourceIdentity(identity: MetricIdentity): string[] {
  return [
    "google-ads-feedback-v1",
    TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
    identity.entityType,
    identity.campaignId,
    identity.adGroupId ?? "",
    identity.criterionId ?? "",
    identity.searchTerm ? normalizedSearchText(identity.searchTerm) : "",
  ];
}

function baseMetricRecord(
  syncRunId: string,
  fetchedAt: string,
  identity: MetricIdentity,
  row: {
    date: string;
    campaignId: string;
    campaignName: string;
    adGroupId?: string;
    adGroupName?: string;
    costMicros: string;
    clicks: string;
    impressions: string;
    conversions: number;
    conversionValue: number;
  },
): GoogleAdsDailyMetricRecord {
  return {
    sync_run_id: syncRunId,
    google_ads_customer_id: TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
    metric_date: row.date,
    entity_type: identity.entityType,
    entity_key: deterministicSha256(sourceIdentity(identity)),
    campaign_id: row.campaignId,
    campaign_name: row.campaignName,
    ad_group_id: row.adGroupId ?? null,
    ad_group_name: row.adGroupName ?? null,
    keyword_criterion_id: null,
    keyword_text: null,
    keyword_match_type: null,
    search_term: null,
    currency_code: "CAD",
    impressions: requireIntegerMetric(row.impressions, "impressions"),
    clicks: requireIntegerMetric(row.clicks, "clicks"),
    cost_micros: requireIntegerMetric(row.costMicros, "cost_micros"),
    bidding_conversions: requireFiniteMetric(row.conversions, "conversions"),
    bidding_conversion_value_cad: requireFiniteMetric(
      row.conversionValue,
      "conversion_value",
    ),
    paid_orders: 0,
    pretax_revenue_cad: 0,
    observed_page_views: 0,
    observed_cart_events: 0,
    observed_submitted_quotes: 0,
    fetched_at: fetchedAt,
    updated_at: fetchedAt,
  };
}

function containsCanonicalProhibitedIntent(searchTerm: string): string | null {
  const normalizedTerm = normalizedSearchText(searchTerm);
  return canonicalNegativeTerms.find((candidate) => {
    const normalizedCandidate = normalizedSearchText(candidate);
    return normalizedCandidate !== ""
      && (` ${normalizedTerm} `).includes(` ${normalizedCandidate} `);
  }) ?? null;
}

function proposalTypeFor(
  row: GoogleAdsDailySearchTermPerformance,
): { type: SearchTermProposalType; prohibitedIntent: string | null } | null {
  const clicks = BigInt(requireIntegerMetric(row.clicks, "clicks"));
  const costMicros = BigInt(requireIntegerMetric(row.costMicros, "cost_micros"));
  const conversions = requireFiniteMetric(row.conversions, "conversions");
  const prohibitedIntent = containsCanonicalProhibitedIntent(row.searchTerm);

  if (["EXCLUDED", "ADDED_EXCLUDED"].includes(row.searchTermStatus)) return null;
  if (prohibitedIntent) {
    return { type: "NEGATIVE_KEYWORD_REVIEW", prohibitedIntent };
  }
  if (row.searchTermStatus === "NONE" && conversions > 0) {
    return { type: "PROMOTE_EXACT_REVIEW", prohibitedIntent: null };
  }
  if (clicks > BigInt(0) || costMicros > BigInt(0)) {
    return { type: "SEARCH_TERM_REVIEW", prohibitedIntent: null };
  }
  return null;
}

export function deterministicSha256(parts: readonly string[]): string {
  const framed = parts.map((part) => `${Buffer.byteLength(part, "utf8")}:${part}`).join("|");
  return createHash("sha256").update(framed, "utf8").digest("hex");
}

export function validateManualLookbackDays(days: number): number {
  if (!Number.isInteger(days) || days < 1 || days > MAX_GOOGLE_ADS_REPORT_DAYS) {
    throw new Error(
      `lookbackDays must be an integer from 1 to ${MAX_GOOGLE_ADS_REPORT_DAYS}`,
    );
  }
  return days;
}

export function completedReginaReportWindow(
  now: Date = new Date(),
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
): GoogleAdsDateRange {
  const days = validateManualLookbackDays(lookbackDays);
  if (!Number.isFinite(now.getTime())) throw new Error("now must be a valid date");

  const endDate = shiftDate(reginaDate(now), -1);
  return {
    startDate: shiftDate(endDate, -(days - 1)),
    endDate,
  };
}

export function mapPerformanceToMetricRecords(
  performance: GoogleAdsDailyPerformance,
  {
    syncRunId,
    fetchedAt = new Date().toISOString(),
  }: {
    syncRunId: string;
    fetchedAt?: string;
  },
): GoogleAdsDailyMetricRecord[] {
  if (!syncRunId.trim()) throw new Error("syncRunId is required");
  if (!Number.isFinite(Date.parse(fetchedAt))) throw new Error("fetchedAt must be RFC 3339");

  return [
    ...performance.campaigns.map((row) => baseMetricRecord(
      syncRunId,
      fetchedAt,
      { entityType: "campaign", campaignId: row.campaignId },
      row,
    )),
    ...performance.adGroups.map((row) => baseMetricRecord(
      syncRunId,
      fetchedAt,
      {
        entityType: "ad_group",
        campaignId: row.campaignId,
        adGroupId: row.adGroupId,
      },
      row,
    )),
    ...performance.keywords.map((row) => ({
      ...baseMetricRecord(
        syncRunId,
        fetchedAt,
        {
          entityType: "keyword",
          campaignId: row.campaignId,
          adGroupId: row.adGroupId,
          criterionId: row.criterionId,
        },
        row,
      ),
      keyword_criterion_id: row.criterionId,
      keyword_text: row.keywordText,
      keyword_match_type: row.keywordMatchType,
    })),
    ...performance.searchTerms.map((row) => ({
      ...baseMetricRecord(
        syncRunId,
        fetchedAt,
        {
          entityType: "search_term",
          campaignId: row.campaignId,
          adGroupId: row.adGroupId,
          searchTerm: row.searchTerm,
        },
        row,
      ),
      search_term: row.searchTerm,
    })),
  ];
}

export function buildReviewOnlySearchTermProposals(
  rows: readonly GoogleAdsDailySearchTermPerformance[],
  range: GoogleAdsDateRange,
  updatedAt: string = new Date().toISOString(),
): GoogleAdsOptimizationProposalRecord[] {
  const groupedRows = new Map<string, {
    row: GoogleAdsDailySearchTermPerformance;
    clicks: bigint;
    costMicros: bigint;
    impressions: bigint;
    conversions: number;
    conversionValue: number;
  }>();

  for (const row of [...rows].sort((a, b) =>
    a.date.localeCompare(b.date)
    || a.campaignId.localeCompare(b.campaignId)
    || a.adGroupId.localeCompare(b.adGroupId)
    || normalizedSearchText(a.searchTerm).localeCompare(normalizedSearchText(b.searchTerm))
    || a.searchTerm.localeCompare(b.searchTerm)
  )) {
    const groupKey = deterministicSha256([
      row.campaignId,
      row.adGroupId,
      normalizedSearchText(row.searchTerm),
    ]);
    const existing = groupedRows.get(groupKey);
    groupedRows.set(groupKey, {
      row,
      clicks: (existing?.clicks ?? BigInt(0))
        + BigInt(requireIntegerMetric(row.clicks, "clicks")),
      costMicros: (existing?.costMicros ?? BigInt(0))
        + BigInt(requireIntegerMetric(row.costMicros, "cost_micros")),
      impressions: (existing?.impressions ?? BigInt(0))
        + BigInt(requireIntegerMetric(row.impressions, "impressions")),
      conversions: (existing?.conversions ?? 0)
        + requireFiniteMetric(row.conversions, "conversions"),
      conversionValue: (existing?.conversionValue ?? 0)
        + requireFiniteMetric(row.conversionValue, "conversion_value"),
    });
  }

  const latestByKey = new Map<string, GoogleAdsOptimizationProposalRecord>();

  for (const grouped of groupedRows.values()) {
    const row: GoogleAdsDailySearchTermPerformance = {
      ...grouped.row,
      clicks: grouped.clicks.toString(),
      costMicros: grouped.costMicros.toString(),
      impressions: grouped.impressions.toString(),
      conversions: grouped.conversions,
      conversionValue: grouped.conversionValue,
    };
    const classification = proposalTypeFor(row);
    if (!classification) continue;

    const normalizedTerm = normalizedSearchText(row.searchTerm);
    const entityKey = deterministicSha256(sourceIdentity({
      entityType: "search_term",
      campaignId: row.campaignId,
      adGroupId: row.adGroupId,
      searchTerm: normalizedTerm,
    }));
    const proposalKey = deterministicSha256([
      "google-ads-proposal-v1",
      TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
      row.campaignId,
      row.adGroupId,
      normalizedTerm,
    ]);
    const rationale = classification.type === "NEGATIVE_KEYWORD_REVIEW"
      ? `Disclosed search term contains canonical prohibited intent: ${classification.prohibitedIntent}. Human review required.`
      : classification.type === "PROMOTE_EXACT_REVIEW"
        ? "Disclosed untargeted search term has a reported bidding conversion. Human exact-keyword review required."
        : "Disclosed search term has clicks or spend. Human relevance review required.";

    const proposal: GoogleAdsOptimizationProposalRecord = {
      google_ads_customer_id: TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
      proposal_key: proposalKey,
      evidence_date_from: range.startDate,
      evidence_date_to: range.endDate,
      entity_type: "search_term",
      entity_key: entityKey,
      recommendation_type: classification.type === "NEGATIVE_KEYWORD_REVIEW"
        ? "add_negative_keyword"
        : classification.type === "PROMOTE_EXACT_REVIEW"
          ? "add_keyword"
          : "no_change",
      rationale,
      proposed_change: {
        review_only: true,
        proposal_type: classification.type,
        disclosed_search_term: row.searchTerm,
        evidence: {
          clicks: requireIntegerMetric(row.clicks, "clicks"),
          cost_micros: requireIntegerMetric(row.costMicros, "cost_micros"),
          conversions: requireFiniteMetric(row.conversions, "conversions"),
          conversion_value_cad: requireFiniteMetric(
            row.conversionValue,
            "conversion_value",
          ),
          targeting_status: row.searchTermStatus,
        },
      },
      status: "proposed",
      requires_human_review: true,
      auto_apply: false,
      updated_at: updatedAt,
    };

    latestByKey.set(proposalKey, proposal);
  }

  return Array.from(latestByKey.values()).sort((a, b) =>
    a.proposal_key.localeCompare(b.proposal_key)
  );
}

export function summarizeSearchTermDisclosure(
  performance: Pick<GoogleAdsDailyPerformance, "campaigns" | "searchTerms">,
): SearchTermDisclosureSummary {
  const sum = (values: readonly string[]): string =>
    values.reduce((total, value) =>
      total + BigInt(requireIntegerMetric(value, "clicks")), BigInt(0)
    ).toString();

  return {
    account_clicks: sum(performance.campaigns.map((row) => row.clicks)),
    disclosed_search_term_clicks: sum(performance.searchTerms.map((row) => row.clicks)),
    undisclosed_search_terms: "UNKNOWN",
  };
}
