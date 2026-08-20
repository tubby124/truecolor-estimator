import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const canonicalCampaigns = [
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
  ];
  return {
    buildProposals: vi.fn(),
    canonicalCampaigns,
    completedWindow: vi.fn(),
    createServiceClient: vi.fn(),
    events: [] as string[],
    fetchPerformance: vi.fn(),
    mapMetrics: vi.fn(),
    recordCronRun: vi.fn(),
    summarizeDisclosure: vi.fn(),
    validateDays: vi.fn(),
  };
});

vi.mock("@/lib/google-ads/performance-client", () => ({
  fetchGoogleAdsDailyPerformance: mocks.fetchPerformance,
  TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS: mocks.canonicalCampaigns,
  TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID: "1072816342",
}));

vi.mock("@/lib/google-ads/performance-feedback", () => ({
  buildReviewOnlySearchTermProposals: mocks.buildProposals,
  completedReginaReportWindow: mocks.completedWindow,
  mapPerformanceToMetricRecords: mocks.mapMetrics,
  summarizeSearchTermDisclosure: mocks.summarizeDisclosure,
  validateManualLookbackDays: mocks.validateDays,
}));

vi.mock("@/lib/cron/heartbeat", () => ({
  recordCronRun: mocks.recordCronRun,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: mocks.createServiceClient,
}));

import { POST } from "../route";

const range = { startDate: "2026-07-01", endDate: "2026-07-24" };
const syncRunId = "11111111-1111-4111-8111-111111111111";
const oldAttemptToken = "22222222-2222-4222-8222-222222222222";
const disclosure = {
  account_clicks: "4",
  disclosed_search_term_clicks: "4",
  undisclosed_search_terms: "UNKNOWN",
};
const conversionTracking = {
  googleAdsConversionCustomer: "customers/1072816342",
  conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
  conversionTrackingId: "18330693756",
  crossAccountConversionTrackingId: null,
};
const conversionActions = [
  {
    id: "7694360837",
    name: "purchase_online",
    status: "ENABLED",
    category: "PURCHASE",
    origin: "WEBSITE",
    ownerCustomer: "customers/1072816342",
    primaryForGoal: true,
    includeInConversionsMetric: true,
  },
  {
    id: "7694360840",
    name: "quote_won",
    status: "ENABLED",
    category: "PURCHASE",
    origin: "WEBSITE",
    ownerCustomer: "customers/1072816342",
    primaryForGoal: true,
    includeInConversionsMetric: true,
  },
  {
    id: "7694360843",
    name: "qualified_call_60s",
    status: "ENABLED",
    category: "PHONE_CALL_LEAD",
    origin: "CALL_FROM_ADS",
    ownerCustomer: "customers/1072816342",
    primaryForGoal: false,
    includeInConversionsMetric: false,
  },
  {
    id: "7688596965",
    name: "About Us",
    status: "ENABLED",
    category: "PAGE_VIEW",
    origin: "WEBSITE",
    ownerCustomer: "customers/1072816342",
    primaryForGoal: true,
    includeInConversionsMetric: false,
  },
];
const customerConversionGoals = [
  { category: "PURCHASE", origin: "WEBSITE", biddable: true },
  { category: "PAGE_VIEW", origin: "WEBSITE", biddable: false },
  { category: "PHONE_CALL_LEAD", origin: "CALL_FROM_ADS", biddable: false },
];
const performance = {
  inventory: {
    customerId: "1072816342",
    currencyCode: "CAD",
    timeZone: "America/Regina",
    campaigns: mocks.canonicalCampaigns.map(({ id, name }) => ({
      id,
      name,
      status: "PAUSED",
    })),
    conversionTracking,
    conversionActions,
    customerConversionGoals,
  },
  campaigns: [{ clicks: "4" }],
  adGroups: [{ clicks: "4" }],
  keywords: [{ clicks: "4" }],
  searchTerms: [{ clicks: "4" }],
};

type ReceiptStatus = "running" | "succeeded" | "partial" | "failed";

interface Receipt {
  id: string;
  attempt_token: string;
  status: ReceiptStatus;
  campaign_rows: number;
  ad_group_rows: number;
  keyword_rows: number;
  search_term_rows: number;
  proposal_rows: number;
  search_term_disclosure_summary: unknown;
  [key: string]: unknown;
}

interface ReceiptMutation {
  row: Record<string, unknown>;
  filters: Array<[string, unknown]>;
}

interface DbHarness {
  from: ReturnType<typeof vi.fn>;
  metricUpserts: Array<{ rows: Array<Record<string, unknown>>; options: unknown }>;
  proposalUpserts: Array<{ rows: Array<Record<string, unknown>>; options: unknown }>;
  receiptInserts: Array<Record<string, unknown>>;
  receiptUpdates: ReceiptMutation[];
  failMetricChunk: number | null;
  failProposalChunk: number | null;
  failReceiptStatus: ReceiptStatus | null;
}

function receipt(
  status: ReceiptStatus,
  attemptToken = oldAttemptToken,
): Receipt {
  return {
    id: syncRunId,
    attempt_token: attemptToken,
    status,
    campaign_rows: status === "succeeded" ? 1 : 0,
    ad_group_rows: status === "succeeded" ? 1 : 0,
    keyword_rows: status === "succeeded" ? 1 : 0,
    search_term_rows: status === "succeeded" ? 1 : 0,
    proposal_rows: status === "succeeded" ? 1 : 0,
    search_term_disclosure_summary: status === "succeeded" ? disclosure : null,
  };
}

function readBuilder(result: () => { data: unknown; error: unknown }) {
  const filters: Array<[string, unknown]> = [];
  const builder = {
    eq(column: string, value: unknown) {
      filters.push([column, value]);
      return builder;
    },
    maybeSingle: async () => result(),
  };
  return builder;
}

function mutationBuilder(
  filters: Array<[string, unknown]>,
  result: () => { data: unknown; error: unknown },
) {
  const builder = {
    eq(column: string, value: unknown) {
      filters.push([column, value]);
      return builder;
    },
    select() {
      return { maybeSingle: async () => result() };
    },
  };
  return builder;
}

function createDbHarness({
  initialReceipt = null,
  insertRaceReceipt = null,
}: {
  initialReceipt?: Receipt | null;
  insertRaceReceipt?: Receipt | null;
} = {}): DbHarness {
  let currentReceipt = initialReceipt;
  const harness = {
    metricUpserts: [],
    proposalUpserts: [],
    receiptInserts: [],
    receiptUpdates: [],
    failMetricChunk: null,
    failProposalChunk: null,
    failReceiptStatus: null,
  } as unknown as DbHarness;

  harness.from = vi.fn((table: string) => {
    if (table === "google_ads_metric_sync_runs") {
      return {
        select: () => readBuilder(() => {
          mocks.events.push("receipt:read");
          return { data: currentReceipt, error: null };
        }),
        insert: (row: Record<string, unknown>) => {
          mocks.events.push("receipt:insert-running");
          harness.receiptInserts.push(row);
          return {
            select: () => ({
              maybeSingle: async () => {
                if (insertRaceReceipt) {
                  currentReceipt = insertRaceReceipt;
                  return { data: null, error: { code: "23505" } };
                }
                currentReceipt = {
                  ...receipt("running", String(row.attempt_token)),
                  ...row,
                };
                return { data: currentReceipt, error: null };
              },
            }),
          };
        },
        update: (row: Record<string, unknown>) => {
          const filters: Array<[string, unknown]> = [];
          const status = String(row.status) as ReceiptStatus;
          const operation = { row, filters };
          harness.receiptUpdates.push(operation);
          mocks.events.push(`receipt:update-${status}`);
          return mutationBuilder(filters, () => {
            if (harness.failReceiptStatus === status) {
              return { data: null, error: { message: "private database detail" } };
            }
            const matches = currentReceipt !== null && filters.every(
              ([column, value]) => currentReceipt?.[column] === value,
            );
            if (!matches) return { data: null, error: null };
            currentReceipt = { ...currentReceipt, ...row } as Receipt;
            return { data: currentReceipt, error: null };
          });
        },
      };
    }

    if (table === "google_ads_daily_metrics") {
      return {
        upsert: async (
          rows: Array<Record<string, unknown>>,
          options: unknown,
        ) => {
          const chunkIndex = harness.metricUpserts.length;
          mocks.events.push(`metrics:${rows.length}`);
          harness.metricUpserts.push({ rows, options });
          return harness.failMetricChunk === chunkIndex
            ? { error: { message: "secret database metric failure" } }
            : { error: null };
        },
      };
    }

    if (table === "google_ads_optimization_proposals") {
      return {
        upsert: async (
          rows: Array<Record<string, unknown>>,
          options: unknown,
        ) => {
          const chunkIndex = harness.proposalUpserts.length;
          mocks.events.push(`proposals:${rows.length}`);
          harness.proposalUpserts.push({ rows, options });
          return harness.failProposalChunk === chunkIndex
            ? { error: { message: "secret database proposal failure" } }
            : { error: null };
        },
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });
  return harness;
}

function request({
  secret = "cron-test-secret",
  days,
}: {
  secret?: string;
  days?: string;
} = {}) {
  const url = new URL(
    "https://truecolorprinting.ca/api/cron/google-ads-performance",
  );
  if (days !== undefined) url.searchParams.set("days", days);
  return new NextRequest(url, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
}

describe("Google Ads performance sync cron", () => {
  let db: DbHarness;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    mocks.events.length = 0;
    db = createDbHarness();
    mocks.createServiceClient.mockImplementation(() => db);
    mocks.completedWindow.mockReturnValue(range);
    mocks.validateDays.mockImplementation((days: number) => {
      if (!Number.isInteger(days) || days < 1 || days > 31) {
        throw new Error("lookbackDays must be an integer from 1 to 31");
      }
      return days;
    });
    mocks.fetchPerformance.mockImplementation(async () => {
      mocks.events.push("upstream:complete");
      return performance;
    });
    mocks.mapMetrics.mockReturnValue(
      Array.from({ length: 501 }, (_, index) => ({
        sync_run_id: syncRunId,
        google_ads_customer_id: "1072816342",
        entity_key: `metric-${index}`,
      })),
    );
    mocks.buildProposals.mockReturnValue([{
      google_ads_customer_id: "1072816342",
      proposal_key: "proposal-1",
      evidence_date_from: "2026-07-01",
      evidence_date_to: "2026-07-24",
      entity_type: "search_term",
      entity_key: "search-term-entity",
      rationale: "Review prohibited intent.",
      proposed_change: {
        review_only: true,
        proposal_type: "NEGATIVE_KEYWORD_REVIEW",
        disclosed_search_term: "free sign template",
        evidence: {
          clicks: "4",
          cost_micros: "1200000",
          conversions: 0,
          conversion_value_cad: 0,
          targeting_status: "NONE",
        },
      },
      updated_at: "2026-07-25T12:00:00.000Z",
    }]);
    mocks.summarizeDisclosure.mockReturnValue(disclosure);
    mocks.recordCronRun.mockImplementation(
      async (_name: string, ok: boolean) => {
        mocks.events.push(`heartbeat:${ok}`);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects bad authorization and invalid ranges before database work", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(request())).status).toBe(503);

    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    expect((await POST(request({ secret: "wrong-secret" }))).status).toBe(401);
    const invalid = await POST(request({ days: "7days" }));
    expect(invalid.status).toBe(400);
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
    expect(mocks.fetchPerformance).not.toHaveBeenCalled();
  });

  it("stages chunked rows under one attempt and publishes only by guarded success", async () => {
    const response = await POST(request({ days: "31" }));
    const insertedAttemptToken = String(db.receiptInserts[0].attempt_token);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      idempotent: false,
      dateFrom: range.startDate,
      dateTo: range.endDate,
      metricsUpserted: 501,
      proposalsPrepared: 1,
      disclosure,
    });
    expect(db.receiptInserts[0]).toMatchObject({
      google_ads_customer_id: "1072816342",
      idempotency_key:
        "google-ads-performance-v1:1072816342:2026-07-01:2026-07-24",
      status: "running",
      conversion_goal_attestation: null,
    });
    expect(insertedAttemptToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(db.metricUpserts.map(({ rows }) => rows.length)).toEqual([500, 1]);
    expect(db.metricUpserts[0].options).toEqual({
      onConflict:
        "sync_run_id,attempt_token,google_ads_customer_id,metric_date,entity_type,entity_key",
    });
    expect(db.metricUpserts[0].rows[0]).toMatchObject({
      sync_run_id: syncRunId,
      attempt_token: insertedAttemptToken,
      google_ads_customer_id: "1072816342",
    });
    expect(db.proposalUpserts[0].options).toEqual({
      onConflict:
        "sync_run_id,attempt_token,google_ads_customer_id,proposal_key",
    });
    expect(db.proposalUpserts[0].rows[0]).toMatchObject({
      sync_run_id: syncRunId,
      attempt_token: insertedAttemptToken,
      status: "pending_review",
      execution_state: "review_only",
      requires_human_review: true,
      auto_apply: false,
    });
    expect(db.receiptUpdates[0]).toMatchObject({
      row: {
        status: "succeeded",
        proposal_rows: 1,
        verified_currency_code: "CAD",
        verified_time_zone: "America/Regina",
        canonical_campaign_inventory: performance.inventory.campaigns,
        conversion_goal_attestation: {
          conversionTracking,
          conversionActions,
          customerConversionGoals,
        },
        search_term_disclosure_summary: disclosure,
      },
      filters: [
        ["id", syncRunId],
        ["status", "running"],
        ["attempt_token", insertedAttemptToken],
      ],
    });
    expect(mocks.events).toEqual([
      "receipt:read",
      "receipt:insert-running",
      "upstream:complete",
      "metrics:500",
      "metrics:1",
      "proposals:1",
      "receipt:update-succeeded",
      "heartbeat:true",
    ]);
  });

  it("deduplicates an identical succeeded range without upstream or staged writes", async () => {
    db = createDbHarness({ initialReceipt: receipt("succeeded") });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      idempotent: true,
      dateFrom: range.startDate,
      dateTo: range.endDate,
      metricsUpserted: 4,
      proposalsPrepared: 1,
      disclosure,
    });
    expect(db.receiptInserts).toHaveLength(0);
    expect(db.receiptUpdates).toHaveLength(0);
    expect(db.metricUpserts).toHaveLength(0);
    expect(mocks.fetchPerformance).not.toHaveBeenCalled();
    expect(mocks.recordCronRun).toHaveBeenCalledWith(
      "google-ads-performance",
      true,
      "range=2026-07-01..2026-07-24 idempotent=1",
    );
  });

  it("returns busy for an existing run and for a concurrent insert winner", async () => {
    db = createDbHarness({ initialReceipt: receipt("running") });
    const running = await POST(request());
    expect(running.status).toBe(409);
    expect(mocks.fetchPerformance).not.toHaveBeenCalled();

    vi.clearAllMocks();
    db = createDbHarness({ insertRaceReceipt: receipt("running") });
    const raced = await POST(request());
    expect(raced.status).toBe(409);
    expect(db.receiptInserts).toHaveLength(1);
    expect(mocks.fetchPerformance).not.toHaveBeenCalled();
  });

  it("reclaims a failed receipt with a new attempt generation", async () => {
    db = createDbHarness({ initialReceipt: receipt("failed") });

    const response = await POST(request());
    const reclaim = db.receiptUpdates[0];
    const reclaimedAttemptToken = String(reclaim.row.attempt_token);

    expect(response.status).toBe(200);
    expect(reclaimedAttemptToken).not.toBe(oldAttemptToken);
    expect(reclaim).toMatchObject({
      row: {
        status: "running",
        campaign_rows: 0,
        proposal_rows: 0,
        conversion_goal_attestation: null,
      },
      filters: [
        ["id", syncRunId],
        ["status", "failed"],
        ["attempt_token", oldAttemptToken],
      ],
    });
    expect(db.metricUpserts[0].rows[0]).toMatchObject({
      sync_run_id: syncRunId,
      attempt_token: reclaimedAttemptToken,
    });
    expect(db.proposalUpserts[0].rows[0]).toMatchObject({
      sync_run_id: syncRunId,
      attempt_token: reclaimedAttemptToken,
    });
    expect(db.receiptUpdates[1].filters).toEqual([
      ["id", syncRunId],
      ["status", "running"],
      ["attempt_token", reclaimedAttemptToken],
    ]);
  });

  it("rejects conversion ownership or goal drift before staging rows", async () => {
    mocks.fetchPerformance.mockResolvedValue({
      ...performance,
      inventory: {
        ...performance.inventory,
        conversionActions: performance.inventory.conversionActions.map((action) =>
          action.id === "7694360843"
            ? { ...action, ownerCustomer: "customers/1125402990" }
            : action
        ),
      },
    });

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(db.metricUpserts).toHaveLength(0);
    expect(db.proposalUpserts).toHaveLength(0);
    expect(db.receiptUpdates[0].row).toMatchObject({
      status: "failed",
      error_detail: "Google Ads account inventory validation failed",
      conversion_goal_attestation: null,
    });
  });

  it("leaves a failed attempt staged but unpublishable and scopes failure by token", async () => {
    db.failMetricChunk = 1;

    const response = await POST(request());
    const insertedAttemptToken = String(db.receiptInserts[0].attempt_token);
    const failure = db.receiptUpdates[0];

    expect(response.status).toBe(503);
    expect(db.metricUpserts.map(({ rows }) => rows.length)).toEqual([500, 1]);
    expect(db.proposalUpserts).toHaveLength(0);
    expect(failure).toMatchObject({
      row: {
        status: "failed",
        error_detail: "Google Ads metric snapshot persistence failed",
        conversion_goal_attestation: null,
      },
      filters: [
        ["id", syncRunId],
        ["status", "running"],
        ["attempt_token", insertedAttemptToken],
      ],
    });
    expect(mocks.recordCronRun).toHaveBeenLastCalledWith(
      "google-ads-performance",
      false,
      "failed=1 durable_receipt=1",
    );
  });

  it("does not delete staged data or expose a Google Ads mutation surface", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/cron/google-ads-performance/route.ts",
      ),
      "utf8",
    );

    expect(source).not.toContain(".delete(");
    expect(source).not.toMatch(
      /runHardStopMonitor|createGoogleAdsApi|mutateCampaigns|googleAds:mutate/,
    );
    expect(source).toContain("export async function POST");
    expect(source).not.toContain("export async function GET");
    expect(source).toContain("constantTimeSecretEqual");
    expect(source).not.toContain("createHash");
    expect(source).not.toContain("timingSafeEqual");
  });
});
