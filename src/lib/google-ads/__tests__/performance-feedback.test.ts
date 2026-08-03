import { describe, expect, it } from "vitest";

import {
  buildReviewOnlySearchTermProposals,
  completedReginaReportWindow,
  deterministicSha256,
  mapPerformanceToMetricRecords,
  summarizeSearchTermDisclosure,
  validateManualLookbackDays,
} from "../performance-feedback";
import type {
  GoogleAdsDailyPerformance,
  GoogleAdsDailySearchTermPerformance,
} from "../performance-client";

const campaign = {
  date: "2026-07-24",
  campaignId: "24048123058",
  campaignName: "GOOG_Search_TC_CoreProducts_2026",
  campaignStatus: "PAUSED",
  costMicros: "9007199254740993123",
  clicks: "9007199254740993001",
  impressions: "9007199254740993999",
  conversions: 1.5,
  conversionValue: 92.05,
  searchImpressionShare: 0.42,
  searchRankLostImpressionShare: 0.34,
  searchBudgetLostImpressionShare: 0.24,
};

const adGroup = {
  ...campaign,
  adGroupId: "197192347366",
  adGroupName: "Coroplast",
  adGroupStatus: "PAUSED",
};

function searchTerm(
  overrides: Partial<GoogleAdsDailySearchTermPerformance> = {},
): GoogleAdsDailySearchTermPerformance {
  return {
    ...adGroup,
    costMicros: "1250000",
    clicks: "3",
    impressions: "40",
    conversions: 0,
    conversionValue: 0,
    searchTerm: "coroplast signs saskatoon",
    searchTermStatus: "NONE",
    ...overrides,
  };
}

const performance: GoogleAdsDailyPerformance = {
  campaigns: [campaign],
  adGroups: [adGroup],
  keywords: [{
    ...adGroup,
    criterionId: "24802921",
    keywordText: "coroplast signs",
    keywordMatchType: "EXACT",
    keywordStatus: "ENABLED",
  }],
  searchTerms: [searchTerm()],
};

describe("Google Ads performance feedback helpers", () => {
  it("builds completed trailing windows in America/Regina and validates manual days", () => {
    expect(completedReginaReportWindow(
      new Date("2026-07-25T05:59:59.000Z"),
    )).toEqual({
      startDate: "2026-06-24",
      endDate: "2026-07-23",
    });
    expect(completedReginaReportWindow(
      new Date("2026-07-25T06:00:00.000Z"),
      1,
    )).toEqual({
      startDate: "2026-07-24",
      endDate: "2026-07-24",
    });

    expect(validateManualLookbackDays(1)).toBe(1);
    expect(validateManualLookbackDays(31)).toBe(31);
    for (const invalid of [0, 32, 1.5, Number.NaN]) {
      expect(() => validateManualLookbackDays(invalid)).toThrow(
        "lookbackDays must be an integer from 1 to 31",
      );
    }
  });

  it("frames deterministic SHA-256 keys without ambiguous concatenation", () => {
    expect(deterministicSha256(["ab", "c"])).toBe(
      "8931b734ed6491fd55114f1f22ca7a9e3986a08e10ad6a8ff6bfaa9e6164ac77",
    );
    expect(deterministicSha256(["ab", "c"])).not.toBe(
      deterministicSha256(["a", "bc"]),
    );
    expect(deterministicSha256(["same"])).toMatch(/^[a-f0-9]{64}$/);
  });

  it("maps every client grain to DB records without Number-converting int64 strings", () => {
    const records = mapPerformanceToMetricRecords(performance, {
      syncRunId: "11111111-1111-4111-8111-111111111111",
      fetchedAt: "2026-07-25T12:00:00.000Z",
    });

    expect(records).toHaveLength(4);
    expect(records[0]).toMatchObject({
      entity_type: "campaign",
      google_ads_customer_id: "1072816342",
      clicks: "9007199254740993001",
      impressions: "9007199254740993999",
      cost_micros: "9007199254740993123",
      bidding_conversions: 1.5,
      bidding_conversion_value_cad: 92.05,
      search_impression_share: 0.42,
      search_rank_lost_impression_share: 0.34,
      search_budget_lost_impression_share: 0.24,
      currency_code: "CAD",
    });
    expect(new Set(records.map((record) => record.entity_key)).size).toBe(4);
    expect(records[2]).toMatchObject({
      entity_type: "keyword",
      keyword_criterion_id: "24802921",
      keyword_text: "coroplast signs",
      keyword_match_type: "EXACT",
    });
    expect(records[3]).toMatchObject({
      entity_type: "search_term",
      search_term: "coroplast signs saskatoon",
      search_impression_share: null,
      search_rank_lost_impression_share: null,
      search_budget_lost_impression_share: null,
    });
    for (const record of records) {
      expect(record.entity_key).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("creates deterministic review-only proposals with prohibited intent taking precedence", () => {
    const range = { startDate: "2026-07-01", endDate: "2026-07-24" };
    const rows = [
      searchTerm({
        searchTerm: "free coroplast sign template",
        conversions: 2,
      }),
      searchTerm({
        searchTerm: "custom coroplast parking signs",
        conversions: 1,
      }),
      searchTerm({
        searchTerm: "parking sign printing",
        conversions: 0,
      }),
      searchTerm({
        searchTerm: "already excluded",
        searchTermStatus: "EXCLUDED",
      }),
      searchTerm({
        searchTerm: "no activity",
        clicks: "0",
        costMicros: "0",
      }),
    ];

    const proposals = buildReviewOnlySearchTermProposals(
      rows,
      range,
      "2026-07-25T12:00:00.000Z",
    );
    const byTerm = new Map(
      proposals.map((proposal) => [
        proposal.proposed_change.disclosed_search_term,
        proposal,
      ]),
    );

    expect(proposals).toHaveLength(3);
    expect(byTerm.get("free coroplast sign template")).toMatchObject({
      recommendation_type: "add_negative_keyword",
      status: "proposed",
      requires_human_review: true,
      auto_apply: false,
      proposed_change: {
        review_only: true,
        proposal_type: "NEGATIVE_KEYWORD_REVIEW",
      },
    });
    expect(byTerm.get("custom coroplast parking signs")?.proposed_change.proposal_type)
      .toBe("PROMOTE_EXACT_REVIEW");
    expect(byTerm.get("parking sign printing")?.proposed_change.proposal_type)
      .toBe("SEARCH_TERM_REVIEW");
    expect(JSON.stringify(proposals)).not.toMatch(
      /(?:mutate|operations|resourceName|updateMask|validateOnly)/,
    );
  });

  it("keeps proposal keys stable across dates and deduplicates repeated disclosed terms", () => {
    const range = { startDate: "2026-07-01", endDate: "2026-07-24" };
    const first = buildReviewOnlySearchTermProposals([
      searchTerm({ date: "2026-07-20", searchTerm: "  Coroplast   SIGNS Saskatoon " }),
    ], range, "2026-07-25T12:00:00.000Z");
    const second = buildReviewOnlySearchTermProposals([
      searchTerm({
        date: "2026-07-24",
        searchTerm: "coroplast signs saskatoon",
        conversions: 1,
      }),
    ], range, "2026-07-25T13:00:00.000Z");
    const repeated = buildReviewOnlySearchTermProposals([
      searchTerm({ date: "2026-07-20", searchTerm: "coroplast signs saskatoon" }),
      searchTerm({ date: "2026-07-24", searchTerm: "coroplast signs saskatoon" }),
    ], range, "2026-07-25T13:00:00.000Z");

    expect(first[0].proposal_key).toBe(second[0].proposal_key);
    expect(first[0].proposed_change.proposal_type).toBe("SEARCH_TERM_REVIEW");
    expect(second[0].proposed_change.proposal_type).toBe("PROMOTE_EXACT_REVIEW");
    expect(repeated).toHaveLength(1);
    expect(repeated[0].proposed_change.evidence.clicks).toBe("6");
  });

  it("reports disclosed clicks while leaving privacy-suppressed terms unknown", () => {
    const disclosure = summarizeSearchTermDisclosure({
      campaigns: [{ ...campaign, clicks: "9007199254740993001" }],
      searchTerms: [searchTerm({ clicks: "3" })],
    });

    expect(disclosure).toEqual({
      account_clicks: "9007199254740993001",
      disclosed_search_term_clicks: "3",
      undisclosed_search_terms: "UNKNOWN",
    });
    expect(buildReviewOnlySearchTermProposals(
      [],
      { startDate: "2026-07-01", endDate: "2026-07-24" },
    )).toEqual([]);
  });
});
