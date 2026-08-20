import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleAdsPerformanceQueries,
  fetchGoogleAdsDailyPerformance,
  MAX_GOOGLE_ADS_REPORT_DAYS,
  MAX_GOOGLE_ADS_RESULT_PAGES,
  TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS,
  TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID,
  TRUE_COLOR_GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  validateGoogleAdsDateRange,
} from "../performance-client";

const env = {
  GOOGLE_ADS_CLIENT_ID: "oauth-client",
  GOOGLE_ADS_CLIENT_SECRET: "oauth-secret",
  GOOGLE_ADS_REFRESH_TOKEN: "oauth-refresh",
  GOOGLE_ADS_DEVELOPER_TOKEN: "developer-token",
};

const campaign = {
  id: "24048123058",
  name: "GOOG_Search_TC_CoreProducts_2026",
  status: "PAUSED",
};
const adGroup = { id: "197192347366", name: "Coroplast", status: "ENABLED" };
const metrics = {
  costMicros: "1250000",
  clicks: "3",
  impressions: "40",
  conversions: 1.5,
  conversionsValue: 92.05,
  searchImpressionShare: 0.42,
  searchRankLostImpressionShare: 0.34,
  searchBudgetLostImpressionShare: 0.24,
};

const accountInventory = {
  customer: {
    id: "1072816342",
    currencyCode: "CAD",
    timeZone: "America/Regina",
    conversionTrackingSetting: {
      googleAdsConversionCustomer: "customers/1072816342",
      conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
      conversionTrackingId: "18330693756",
    },
  },
};
const campaignInventory = TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.map(({ id, name }) => ({
  campaign: { id, name, status: "PAUSED" },
}));
const conversionInventory = [
  {
    conversionAction: {
      id: "7694360837",
      name: "purchase_online",
      status: "ENABLED",
      category: "PURCHASE",
      origin: "WEBSITE",
      ownerCustomer: "customers/1072816342",
      primaryForGoal: true,
      includeInConversionsMetric: true,
    },
  },
  {
    conversionAction: {
      id: "7694360840",
      name: "quote_won",
      status: "ENABLED",
      category: "PURCHASE",
      origin: "WEBSITE",
      ownerCustomer: "customers/1072816342",
      primaryForGoal: true,
      includeInConversionsMetric: true,
    },
  },
  {
    conversionAction: {
      id: "7694360843",
      name: "qualified_call_60s",
      status: "ENABLED",
      category: "PHONE_CALL_LEAD",
      origin: "CALL_FROM_ADS",
      ownerCustomer: "customers/1072816342",
      primaryForGoal: false,
      includeInConversionsMetric: false,
    },
  },
  {
    conversionAction: {
      id: "7688596965",
      name: "About Us",
      status: "ENABLED",
      category: "PAGE_VIEW",
      origin: "WEBSITE",
      ownerCustomer: "customers/1072816342",
      primaryForGoal: false,
      includeInConversionsMetric: false,
    },
  },
];
const customerConversionGoals = [
  {
    customerConversionGoal: {
      category: "PURCHASE",
      origin: "WEBSITE",
      biddable: true,
    },
  },
  {
    customerConversionGoal: {
      category: "PAGE_VIEW",
      origin: "WEBSITE",
    },
  },
  {
    customerConversionGoal: {
      category: "PHONE_CALL_LEAD",
      origin: "CALL_FROM_ADS",
    },
  },
];

function response(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

async function fetchWithConversionInventory(rows: unknown[]) {
  const fetchImpl = vi.fn()
    .mockResolvedValueOnce(response({ access_token: "access" }))
    .mockResolvedValueOnce(response({ results: [accountInventory] }))
    .mockResolvedValueOnce(response({ results: campaignInventory }))
    .mockResolvedValueOnce(response({ results: rows }))
    .mockResolvedValueOnce(response({ results: customerConversionGoals }))
    .mockResolvedValueOnce(response({ results: [] }))
    .mockResolvedValueOnce(response({ results: [] }))
    .mockResolvedValueOnce(response({ results: [] }))
    .mockResolvedValueOnce(response({ results: [] }));
  const result = await fetchGoogleAdsDailyPerformance(
    { startDate: "2026-07-20", endDate: "2026-07-20" },
    { fetchImpl, env },
  );
  return { fetchImpl, result };
}

describe("read-only Google Ads performance client", () => {
  it("uses the exact True Color account and v24 search endpoint, then maps all report levels", async () => {
    expect(TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID).toBe("1072816342");
    expect(TRUE_COLOR_GOOGLE_ADS_LOGIN_CUSTOMER_ID).toBe("1125402990");

    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "short-lived-access" }))
      .mockResolvedValueOnce(response({ results: [accountInventory] }))
      .mockResolvedValueOnce(response({ results: campaignInventory }))
      .mockResolvedValueOnce(response({ results: conversionInventory }))
      .mockResolvedValueOnce(response({ results: customerConversionGoals }))
      .mockResolvedValueOnce(response({
        results: [{ segments: { date: "2026-07-24" }, campaign, metrics }],
      }))
      .mockResolvedValueOnce(response({
        results: [{ segments: { date: "2026-07-24" }, campaign, adGroup, metrics }],
      }))
      .mockResolvedValueOnce(response({
        results: [{
          segments: { date: "2026-07-24" },
          campaign,
          adGroup,
          adGroupCriterion: {
            criterionId: "24802921",
            status: "ENABLED",
            keyword: { text: "coroplast signs", matchType: "EXACT" },
          },
          metrics,
        }],
      }))
      .mockResolvedValueOnce(response({
        results: [{
          segments: { date: "2026-07-24" },
          campaign,
          adGroup,
          searchTermView: { searchTerm: "coroplast signs saskatoon", status: "NONE" },
          metrics,
        }],
      }));

    const result = await fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-24", endDate: "2026-07-24" },
      { fetchImpl, env },
    );

    expect(fetchImpl.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
    expect(String(fetchImpl.mock.calls[0][1].body)).toContain("refresh_token=oauth-refresh");
    for (const [url, init] of fetchImpl.mock.calls.slice(1)) {
      expect(url).toBe(
        "https://googleads.googleapis.com/v24/customers/1072816342/googleAds:search",
      );
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        authorization: "Bearer short-lived-access",
        "developer-token": "developer-token",
        "login-customer-id": "1125402990",
      });
      expect(JSON.parse(init.body).query).toMatch(/^SELECT /);
    }
    const conversionInventoryQuery = JSON.parse(fetchImpl.mock.calls[3][1].body).query;
    const accountInventoryQuery = JSON.parse(fetchImpl.mock.calls[1][1].body).query;
    expect(accountInventoryQuery).toContain(
      "customer.conversion_tracking_setting.google_ads_conversion_customer",
    );
    expect(accountInventoryQuery).toContain(
      "customer.conversion_tracking_setting.conversion_tracking_status",
    );
    expect(accountInventoryQuery).toContain(
      "customer.conversion_tracking_setting.conversion_tracking_id",
    );
    expect(accountInventoryQuery).toContain(
      "customer.conversion_tracking_setting.cross_account_conversion_tracking_id",
    );
    expect(conversionInventoryQuery).toContain("conversion_action.primary_for_goal");
    expect(conversionInventoryQuery).toContain("conversion_action.owner_customer");
    expect(conversionInventoryQuery).toContain(
      "conversion_action.include_in_conversions_metric",
    );
    expect(conversionInventoryQuery).toContain(
      "WHERE conversion_action.status != 'REMOVED'",
    );
    const customerGoalQuery = JSON.parse(fetchImpl.mock.calls[4][1].body).query;
    expect(customerGoalQuery).toContain("customer_conversion_goal.category");
    expect(customerGoalQuery).toContain("customer_conversion_goal.origin");
    expect(customerGoalQuery).toContain("customer_conversion_goal.biddable");

    expect(result.campaigns[0]).toEqual({
      date: "2026-07-24",
      campaignId: campaign.id,
      campaignName: campaign.name,
      campaignStatus: "PAUSED",
      costMicros: "1250000",
      clicks: "3",
      impressions: "40",
      conversions: 1.5,
      conversionValue: 92.05,
      searchImpressionShare: 0.42,
      searchRankLostImpressionShare: 0.34,
      searchBudgetLostImpressionShare: 0.24,
    });
    expect(result.inventory).toEqual({
      customerId: "1072816342",
      currencyCode: "CAD",
      timeZone: "America/Regina",
      conversionTracking: {
        googleAdsConversionCustomer: "customers/1072816342",
        conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
        conversionTrackingId: "18330693756",
        crossAccountConversionTrackingId: null,
      },
      campaigns: campaignInventory.map(({ campaign: inventoryCampaign }) => inventoryCampaign),
      conversionActions: conversionInventory.map(({ conversionAction }) => conversionAction),
      customerConversionGoals: [
        { category: "PURCHASE", origin: "WEBSITE", biddable: true },
        { category: "PAGE_VIEW", origin: "WEBSITE", biddable: false },
        { category: "PHONE_CALL_LEAD", origin: "CALL_FROM_ADS", biddable: false },
      ],
    });
    expect(result.inventory.conversionActions).toContainEqual({
      id: "7688596965",
      name: "About Us",
      status: "ENABLED",
      category: "PAGE_VIEW",
      origin: "WEBSITE",
      ownerCustomer: "customers/1072816342",
      primaryForGoal: false,
      includeInConversionsMetric: false,
    });
    expect(result.adGroups[0]).toMatchObject({
      adGroupId: adGroup.id,
      adGroupName: "Coroplast",
      adGroupStatus: "ENABLED",
    });
    expect(result.keywords[0]).toMatchObject({
      criterionId: "24802921",
      keywordText: "coroplast signs",
      keywordMatchType: "EXACT",
      keywordStatus: "ENABLED",
    });
    expect(result.searchTerms[0]).toMatchObject({
      searchTerm: "coroplast signs saskatoon",
      searchTermStatus: "NONE",
    });
  });

  it("follows every nextPageToken without putting it in the GAQL", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response({ results: [accountInventory] }))
      .mockResolvedValueOnce(response({ results: campaignInventory }))
      .mockResolvedValueOnce(response({ results: conversionInventory }))
      .mockResolvedValueOnce(response({ results: customerConversionGoals }))
      .mockResolvedValueOnce(response({
        results: [{ segments: { date: "2026-07-20" }, campaign, metrics }],
        nextPageToken: "campaign-page-2",
      }))
      .mockResolvedValueOnce(response({
        results: [{ segments: { date: "2026-07-21" }, campaign, metrics }],
      }))
      .mockResolvedValueOnce(response({ results: [] }))
      .mockResolvedValueOnce(response({ results: [] }))
      .mockResolvedValueOnce(response({ results: [] }));

    const result = await fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-21" },
      { fetchImpl, env },
    );

    expect(result.campaigns.map((row) => row.date)).toEqual(["2026-07-20", "2026-07-21"]);
    const firstCampaignBody = JSON.parse(fetchImpl.mock.calls[5][1].body);
    const secondCampaignBody = JSON.parse(fetchImpl.mock.calls[6][1].body);
    expect(firstCampaignBody).not.toHaveProperty("pageToken");
    expect(secondCampaignBody.pageToken).toBe("campaign-page-2");
    expect(secondCampaignBody.query).toBe(firstCampaignBody.query);
  });

  it("rejects repeated pagination tokens", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response({ results: [accountInventory] }))
      .mockResolvedValueOnce(response({ results: campaignInventory }))
      .mockResolvedValueOnce(response({ results: conversionInventory }))
      .mockResolvedValueOnce(response({ results: customerConversionGoals }))
      .mockResolvedValueOnce(response({ results: [], nextPageToken: "repeat" }))
      .mockResolvedValueOnce(response({ results: [], nextPageToken: "repeat" }));

    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-20" },
      { fetchImpl, env },
    )).rejects.toThrow("repeated page token");
  });

  it("bounds and validates date-only report windows before any network call", async () => {
    expect(MAX_GOOGLE_ADS_REPORT_DAYS).toBe(31);
    expect(validateGoogleAdsDateRange({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    })).toEqual({ startDate: "2026-07-01", endDate: "2026-07-31" });

    expect(() => validateGoogleAdsDateRange({
      startDate: "2026-02-30",
      endDate: "2026-03-01",
    })).toThrow("valid calendar date");
    expect(() => validateGoogleAdsDateRange({
      startDate: "2026/07/01",
      endDate: "2026-07-02",
    })).toThrow("YYYY-MM-DD");
    expect(() => validateGoogleAdsDateRange({
      startDate: "2026-07-02",
      endDate: "2026-07-01",
    })).toThrow("must not be after");
    expect(() => validateGoogleAdsDateRange({
      startDate: "2026-07-01",
      endDate: "2026-08-01",
    })).toThrow("must not exceed 31 days");

    const fetchImpl = vi.fn();
    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-01", endDate: "2026-08-01" },
      { fetchImpl, env },
    )).rejects.toThrow("must not exceed 31 days");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("contains only read-only GAQL and never requests raw click identifiers", () => {
    const querySet = buildGoogleAdsPerformanceQueries({
      startDate: "2026-07-01",
      endDate: "2026-07-02",
    });
    const queries = Object.values(querySet);

    for (const query of queries) {
      expect(query).toMatch(/^SELECT /);
      expect(query).not.toMatch(/\b(?:mutate|create|update|remove)\b/i);
      expect(query).not.toMatch(/\b(?:gclid|gbraid|wbraid|click_view)\b/i);
    }
    expect(queries.join(" ")).toContain("metrics.cost_micros");
    expect(queries.join(" ")).toContain("metrics.conversions_value");
    expect(querySet.campaigns).toContain("metrics.search_impression_share");
    expect(querySet.campaigns).toContain("metrics.search_rank_lost_impression_share");
    expect(querySet.campaigns).toContain("metrics.search_budget_lost_impression_share");
    for (const query of [querySet.adGroups, querySet.keywords, querySet.searchTerms]) {
      expect(query).not.toContain("metrics.search_impression_share");
      expect(query).not.toContain("metrics.search_rank_lost_impression_share");
      expect(query).not.toContain("metrics.search_budget_lost_impression_share");
    }
    for (const query of queries) {
      expect(query).toContain("campaign.id IN (24048123058, 24048123061, 24048123064)");
    }
    expect(TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS).toEqual([
      {
        id: "24048123058",
        name: "GOOG_Search_TC_CoreProducts_2026",
        allowedStatuses: ["PAUSED", "ENABLED"],
      },
      {
        id: "24048123061",
        name: "GOOG_Search_TC_CompetitorConquest_2026",
        allowedStatuses: ["PAUSED", "ENABLED"],
      },
      {
        id: "24048123064",
        name: "GOOG_Search_TC_BrandDefense_2026",
        allowedStatuses: ["PAUSED"],
      },
    ]);
  });

  it("fails closed without credentials and keeps API response bodies out of errors", async () => {
    const noCredentialsFetch = vi.fn();
    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-20" },
      { fetchImpl: noCredentialsFetch, env: {} },
    )).rejects.toThrow("GOOGLE_ADS_DEVELOPER_TOKEN is required");
    expect(noCredentialsFetch).not.toHaveBeenCalled();

    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response({
        error: { message: "do-not-expose-secret-or-click-id" },
      }, 403));
    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-20" },
      { fetchImpl, env },
    )).rejects.not.toThrow("do-not-expose-secret-or-click-id");
  });

  it("validates customer identity, CAD, Regina time, and canonical campaign inventory first", async () => {
    const expectInventoryFailure = async (
      accountRows: unknown[],
      campaignRows: unknown[],
      message: string,
    ) => {
      const fetchImpl = vi.fn()
        .mockResolvedValueOnce(response({ access_token: "access" }))
        .mockResolvedValueOnce(response({ results: accountRows }))
        .mockResolvedValueOnce(response({ results: campaignRows }))
        .mockResolvedValueOnce(response({ results: conversionInventory }))
        .mockResolvedValueOnce(response({ results: customerConversionGoals }));
      await expect(fetchGoogleAdsDailyPerformance(
        { startDate: "2026-07-20", endDate: "2026-07-20" },
        { fetchImpl, env },
      )).rejects.toThrow(message);
      expect(fetchImpl).toHaveBeenCalledTimes(5);
    };

    await expectInventoryFailure(
      [{ customer: { ...accountInventory.customer, id: "9999999999" } }],
      campaignInventory,
      "customer does not match True Color",
    );
    await expectInventoryFailure(
      [{ customer: { ...accountInventory.customer, currencyCode: "USD" } }],
      campaignInventory,
      "currency must be CAD",
    );
    await expectInventoryFailure(
      [{ customer: { ...accountInventory.customer, timeZone: "America/Edmonton" } }],
      campaignInventory,
      "time zone must be America/Regina",
    );
    await expectInventoryFailure(
      [{
        customer: {
          ...accountInventory.customer,
          conversionTrackingSetting: {
            ...accountInventory.customer.conversionTrackingSetting,
            googleAdsConversionCustomer: "customers/1125402990",
          },
        },
      }],
      campaignInventory,
      "conversion tracking must be owned by the True Color customer",
    );
    await expectInventoryFailure(
      [{
        customer: {
          ...accountInventory.customer,
          conversionTrackingSetting: {
            ...accountInventory.customer.conversionTrackingSetting,
            conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_THIS_MANAGER",
          },
        },
      }],
      campaignInventory,
      "conversion tracking must be managed by the True Color customer",
    );
    await expectInventoryFailure(
      [{
        customer: {
          ...accountInventory.customer,
          conversionTrackingSetting: {
            ...accountInventory.customer.conversionTrackingSetting,
            conversionTrackingId: "99999999999",
          },
        },
      }],
      campaignInventory,
      "conversion tracking ID does not match True Color",
    );
    await expectInventoryFailure(
      [{
        customer: {
          ...accountInventory.customer,
          conversionTrackingSetting: {
            ...accountInventory.customer.conversionTrackingSetting,
            crossAccountConversionTrackingId: "1125402990",
          },
        },
      }],
      campaignInventory,
      "cross-account conversion tracking must remain unset",
    );
    await expectInventoryFailure(
      [accountInventory],
      campaignInventory.map((row, index) => index === 0
        ? { campaign: { ...row.campaign, name: "Wrong_Core" } }
        : row),
      "24048123058 does not match inventory",
    );
    await expectInventoryFailure(
      [accountInventory],
      campaignInventory.map((row, index) => index === 2
        ? { campaign: { ...row.campaign, status: "ENABLED" } }
        : row),
      "24048123064 has an invalid state",
    );
  });

  it("retries only a bounded number of times for 429/5xx responses", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response(
        { error: { message: "do-not-leak-throttle-body" } },
        429,
        { "retry-after": "99" },
      ))
      .mockResolvedValueOnce(response(
        { error: { message: "do-not-leak-server-body" } },
        503,
      ))
      .mockResolvedValueOnce(response({ results: [accountInventory] }))
      .mockResolvedValueOnce(response({ results: campaignInventory }))
      .mockResolvedValueOnce(response({ results: conversionInventory }))
      .mockResolvedValueOnce(response({ results: customerConversionGoals }))
      .mockResolvedValueOnce(response({ results: [] }))
      .mockResolvedValueOnce(response({ results: [] }))
      .mockResolvedValueOnce(response({ results: [] }))
      .mockResolvedValueOnce(response({ results: [] }));

    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-20" },
      { fetchImpl, env, sleep },
    )).resolves.toMatchObject({ campaigns: [], searchTerms: [] });
    expect(sleep.mock.calls).toEqual([[2_000], [200]]);

    const exhaustedFetch = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response({ error: { message: "private-1" } }, 500))
      .mockResolvedValueOnce(response({ error: { message: "private-2" } }, 502))
      .mockResolvedValueOnce(response({ error: { message: "private-3" } }, 503));
    let failure: unknown;
    try {
      await fetchGoogleAdsDailyPerformance(
        { startDate: "2026-07-20", endDate: "2026-07-20" },
        { fetchImpl: exhaustedFetch, env, sleep },
      );
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(
      "Google Ads account inventory report failed with HTTP 503",
    );
    expect((failure as Error).message).not.toContain("private");
    expect(exhaustedFetch).toHaveBeenCalledTimes(4);
  });


  it("accepts live-shaped or absent legacy About Us only while it stays secondary/excluded", async () => {
    await expect(fetchWithConversionInventory(conversionInventory)).resolves.toMatchObject({
      result: { campaigns: [] },
    });

    await expect(fetchWithConversionInventory(
      conversionInventory.filter(({ conversionAction }) => conversionAction.id !== "7688596965"),
    )).resolves.toMatchObject({ result: { searchTerms: [] } });

    await expect(fetchWithConversionInventory(
      conversionInventory.map((row) => row.conversionAction.id === "7688596965"
        ? {
            conversionAction: {
              ...row.conversionAction,
              primaryForGoal: true,
            },
          }
        : row),
    )).rejects.toThrow("legacy About Us conversion action has drifted");

    await expect(fetchWithConversionInventory(
      conversionInventory.map((row) => row.conversionAction.id === "7688596965"
        ? {
            conversionAction: {
              ...row.conversionAction,
              includeInConversionsMetric: true,
            },
          }
        : row),
    )).rejects.toThrow("legacy About Us conversion action has drifted");
  });

  it("fails before metric reads when conversion bidding goals drift", async () => {
    const expectConversionFailure = async (
      rows: unknown[],
      message: string,
      goals: unknown[] = customerConversionGoals,
    ) => {
      const fetchImpl = vi.fn()
        .mockResolvedValueOnce(response({ access_token: "access" }))
        .mockResolvedValueOnce(response({ results: [accountInventory] }))
        .mockResolvedValueOnce(response({ results: campaignInventory }))
        .mockResolvedValueOnce(response({ results: rows }))
        .mockResolvedValueOnce(response({ results: goals }));
      await expect(fetchGoogleAdsDailyPerformance(
        { startDate: "2026-07-20", endDate: "2026-07-20" },
        { fetchImpl, env },
      )).rejects.toThrow(message);
      expect(fetchImpl).toHaveBeenCalledTimes(5);
    };

    await expectConversionFailure(
      conversionInventory.filter(({ conversionAction }) => conversionAction.id !== "7694360840"),
      "7694360840 does not match inventory",
    );
    await expectConversionFailure(
      conversionInventory.map((row) => row.conversionAction.id === "7694360837"
        ? {
            conversionAction: {
              ...row.conversionAction,
              includeInConversionsMetric: false,
            },
          }
        : row),
      "7694360837 has unsafe bidding flags",
    );
    await expectConversionFailure(
      conversionInventory.map((row) => row.conversionAction.id === "7694360840"
        ? {
            conversionAction: {
              ...row.conversionAction,
              primaryForGoal: false,
            },
          }
        : row),
      "7694360840 has unsafe bidding flags",
    );
    await expectConversionFailure(
      conversionInventory.map((row) => row.conversionAction.id === "7694360843"
        ? {
            conversionAction: {
              ...row.conversionAction,
              primaryForGoal: true,
            },
          }
        : row),
      "7694360843 has unsafe bidding flags",
    );
    await expectConversionFailure(
      [
        ...conversionInventory,
        {
          conversionAction: {
            id: "7000000000",
            name: "unexpected_page_view",
            status: "ENABLED",
            category: "PAGE_VIEW",
            origin: "WEBSITE",
            ownerCustomer: "customers/1072816342",
            primaryForGoal: false,
            includeInConversionsMetric: true,
          },
        },
      ],
      "unexpected conversion action 7000000000 is included",
    );
    await expectConversionFailure(
      [
        ...conversionInventory,
        {
          conversionAction: {
            id: "7000000001",
            name: "legacy_purchase_primary",
            status: "ENABLED",
            category: "PURCHASE",
            origin: "WEBSITE",
            ownerCustomer: "customers/1072816342",
            primaryForGoal: true,
            includeInConversionsMetric: false,
          },
        },
      ],
      "unexpected primary conversion action 7000000001 lacks a non-biddable goal",
    );
    for (const ownedId of ["7694360837", "7694360840", "7694360843", "7688596965"]) {
      await expectConversionFailure(
        conversionInventory.map((row) => row.conversionAction.id === ownedId
          ? {
              conversionAction: {
                ...row.conversionAction,
                ownerCustomer: "customers/1125402990",
              },
            }
          : row),
        ownedId === "7688596965"
          ? "legacy About Us conversion action has drifted"
          : `${ownedId} has an unexpected owner`,
      );
    }
    await expectConversionFailure(
      conversionInventory,
      "customer conversion goal PURCHASE/WEBSITE has drifted",
      customerConversionGoals.map((row) =>
        row.customerConversionGoal.category === "PURCHASE"
          ? { customerConversionGoal: { ...row.customerConversionGoal, biddable: false } }
          : row),
    );
    await expectConversionFailure(
      conversionInventory,
      "customer conversion goal PAGE_VIEW/WEBSITE has drifted",
      customerConversionGoals.map((row) =>
        row.customerConversionGoal.category === "PAGE_VIEW"
          ? { customerConversionGoal: { ...row.customerConversionGoal, biddable: true } }
          : row),
    );
    await expectConversionFailure(
      conversionInventory,
      "customer conversion goal PHONE_CALL_LEAD/CALL_FROM_ADS has drifted",
      customerConversionGoals.map((row) =>
        row.customerConversionGoal.category === "PHONE_CALL_LEAD"
          ? { customerConversionGoal: { ...row.customerConversionGoal, biddable: true } }
          : row),
    );
  });

  it("stops after 100 result pages even when Google keeps returning new tokens", async () => {
    expect(MAX_GOOGLE_ADS_RESULT_PAGES).toBe(100);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ access_token: "access" }))
      .mockResolvedValueOnce(response({ results: [accountInventory] }))
      .mockResolvedValueOnce(response({ results: campaignInventory }))
      .mockResolvedValueOnce(response({ results: conversionInventory }))
      .mockResolvedValueOnce(response({ results: customerConversionGoals }));
    for (let page = 1; page <= MAX_GOOGLE_ADS_RESULT_PAGES; page += 1) {
      fetchImpl.mockResolvedValueOnce(response({
        results: [],
        nextPageToken: `campaign-page-${page + 1}`,
      }));
    }

    await expect(fetchGoogleAdsDailyPerformance(
      { startDate: "2026-07-20", endDate: "2026-07-20" },
      { fetchImpl, env },
    )).rejects.toThrow("campaign report exceeded 100 pages");
    expect(fetchImpl).toHaveBeenCalledTimes(105);
  });
});
