const GOOGLE_ADS_API_VERSION = "v24";
const GOOGLE_ADS_API_ORIGIN = "https://googleads.googleapis.com";
const GOOGLE_OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export const TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID = "1072816342";
export const TRUE_COLOR_GOOGLE_ADS_LOGIN_CUSTOMER_ID = "1125402990";
export const MAX_GOOGLE_ADS_REPORT_DAYS = 31;
export const MAX_GOOGLE_ADS_RESULT_PAGES = 100;

const MAX_GOOGLE_ADS_REQUEST_ATTEMPTS = 3;
const MAX_GOOGLE_ADS_RETRY_DELAY_MS = 2_000;
const TRUE_COLOR_GOOGLE_ADS_CURRENCY = "CAD";
const TRUE_COLOR_GOOGLE_ADS_TIME_ZONE = "America/Regina";

export const TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS = Object.freeze([
  Object.freeze({
    id: "24048123058",
    name: "GOOG_Search_TC_CoreProducts_2026",
    allowedStatuses: Object.freeze(["PAUSED", "ENABLED"]),
  }),
  Object.freeze({
    id: "24048123061",
    name: "GOOG_Search_TC_CompetitorConquest_2026",
    allowedStatuses: Object.freeze(["PAUSED", "ENABLED"]),
  }),
  Object.freeze({
    id: "24048123064",
    name: "GOOG_Search_TC_BrandDefense_2026",
    allowedStatuses: Object.freeze(["PAUSED"]),
  }),
] as const);

interface GoogleAdsPerformanceEnv {
  readonly [key: string]: string | undefined;
  GOOGLE_ADS_CLIENT_ID?: string;
  GOOGLE_ADS_CLIENT_SECRET?: string;
  GOOGLE_ADS_REFRESH_TOKEN?: string;
  GOOGLE_ADS_DEVELOPER_TOKEN?: string;
}

export interface GoogleAdsDateRange {
  startDate: string;
  endDate: string;
}

export interface GoogleAdsDailyMetrics {
  costMicros: string;
  clicks: string;
  impressions: string;
  conversions: number;
  conversionValue: number;
}

interface GoogleAdsDailyCampaignIdentity {
  date: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
}

export interface GoogleAdsDailyCampaignPerformance
  extends GoogleAdsDailyMetrics, GoogleAdsDailyCampaignIdentity {
  searchImpressionShare: number | null;
  searchRankLostImpressionShare: number | null;
  searchBudgetLostImpressionShare: number | null;
}

export interface GoogleAdsDailyAdGroupPerformance
  extends GoogleAdsDailyMetrics, GoogleAdsDailyCampaignIdentity {
  adGroupId: string;
  adGroupName: string;
  adGroupStatus: string;
}

export interface GoogleAdsDailyKeywordPerformance extends GoogleAdsDailyAdGroupPerformance {
  criterionId: string;
  keywordText: string;
  keywordMatchType: string;
  keywordStatus: string;
}

export interface GoogleAdsDailySearchTermPerformance extends GoogleAdsDailyAdGroupPerformance {
  searchTerm: string;
  searchTermStatus: string;
}

export interface GoogleAdsDailyPerformance {
  campaigns: GoogleAdsDailyCampaignPerformance[];
  adGroups: GoogleAdsDailyAdGroupPerformance[];
  keywords: GoogleAdsDailyKeywordPerformance[];
  searchTerms: GoogleAdsDailySearchTermPerformance[];
}

export interface GoogleAdsValidatedDailyPerformance extends GoogleAdsDailyPerformance {
  inventory: GoogleAdsAccountInventory;
}

export interface GoogleAdsCampaignInventory {
  id: string;
  name: string;
  status: string;
}

export interface GoogleAdsAccountInventory {
  customerId: string;
  currencyCode: "CAD";
  timeZone: "America/Regina";
  conversionTracking: GoogleAdsConversionTrackingAttestation;
  campaigns: GoogleAdsCampaignInventory[];
  conversionActions: GoogleAdsConversionGoalAttestation[];
  customerConversionGoals: GoogleAdsCustomerConversionGoalAttestation[];
}

export interface GoogleAdsConversionTrackingAttestation {
  googleAdsConversionCustomer: "customers/1072816342";
  conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF";
  conversionTrackingId: "18330693756";
  crossAccountConversionTrackingId: null;
}

export interface GoogleAdsConversionGoalAttestation {
  id: string;
  name: string;
  status: string;
  category: string;
  origin: string;
  ownerCustomer: string;
  primaryForGoal: boolean;
  includeInConversionsMetric: boolean;
}

export interface GoogleAdsCustomerConversionGoalAttestation {
  category: string;
  origin: string;
  biddable: boolean;
}

interface GoogleAdsRow {
  segments?: { date?: string };
  customer?: {
    id?: string;
    currencyCode?: string;
    timeZone?: string;
    conversionTrackingSetting?: {
      googleAdsConversionCustomer?: string;
      conversionTrackingStatus?: string;
      conversionTrackingId?: string;
      crossAccountConversionTrackingId?: string;
    };
  };
  campaign?: { id?: string; name?: string; status?: string };
  adGroup?: { id?: string; name?: string; status?: string };
  adGroupCriterion?: {
    criterionId?: string;
    status?: string;
    keyword?: { text?: string; matchType?: string };
  };
  conversionAction?: {
    id?: string;
    name?: string;
    status?: string;
    category?: string;
    origin?: string;
    ownerCustomer?: string;
    primaryForGoal?: boolean;
    includeInConversionsMetric?: boolean;
  };
  customerConversionGoal?: {
    category?: string;
    origin?: string;
    biddable?: boolean;
  };
  searchTermView?: { searchTerm?: string; status?: string };
  metrics?: {
    costMicros?: string;
    clicks?: string;
    impressions?: string;
    conversions?: number | string;
    conversionsValue?: number | string;
    searchImpressionShare?: number | string;
    searchRankLostImpressionShare?: number | string;
    searchBudgetLostImpressionShare?: number | string;
  };
}

interface GoogleAdsSearchResponse {
  results?: GoogleAdsRow[];
  nextPageToken?: string;
}

type ReportName =
  | "account inventory"
  | "campaign inventory"
  | "conversion action inventory"
  | "customer conversion goal inventory"
  | "campaign"
  | "ad group"
  | "keyword"
  | "search term";
type Sleep = (milliseconds: number) => Promise<void>;

const SEARCH_ENDPOINT =
  `${GOOGLE_ADS_API_ORIGIN}/${GOOGLE_ADS_API_VERSION}/customers/` +
  `${TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID}/googleAds:search`;

function requireEnv(env: GoogleAdsPerformanceEnv, name: keyof GoogleAdsPerformanceEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseDateOnly(value: string, field: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error(`${field} must be a valid calendar date`);
  }
  return timestamp;
}

export function validateGoogleAdsDateRange(range: GoogleAdsDateRange): GoogleAdsDateRange {
  const startDate = range.startDate?.trim();
  const endDate = range.endDate?.trim();
  const start = parseDateOnly(startDate, "startDate");
  const end = parseDateOnly(endDate, "endDate");
  if (start > end) throw new Error("startDate must not be after endDate");

  const inclusiveDays = Math.floor((end - start) / 86_400_000) + 1;
  if (inclusiveDays > MAX_GOOGLE_ADS_REPORT_DAYS) {
    throw new Error(`Google Ads report range must not exceed ${MAX_GOOGLE_ADS_REPORT_DAYS} days`);
  }
  return { startDate, endDate };
}

function performanceFields(prefix: string): string {
  return [
    "segments.date",
    "campaign.id",
    "campaign.name",
    "campaign.status",
    ...(prefix !== "campaign"
      ? ["ad_group.id", "ad_group.name", "ad_group.status"]
      : []),
    "metrics.cost_micros",
    "metrics.clicks",
    "metrics.impressions",
    "metrics.conversions",
    "metrics.conversions_value",
    ...(prefix === "campaign"
      ? [
          "metrics.search_impression_share",
          "metrics.search_rank_lost_impression_share",
          "metrics.search_budget_lost_impression_share",
        ]
      : []),
  ].join(", ");
}

export function buildGoogleAdsPerformanceQueries(range: GoogleAdsDateRange) {
  const { startDate, endDate } = validateGoogleAdsDateRange(range);
  const dateFilter = `segments.date BETWEEN '${startDate}' AND '${endDate}'`;
  const campaignFilter =
    `campaign.id IN (${TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.map(({ id }) => id).join(", ")})`;

  return {
    campaigns:
      `SELECT ${performanceFields("campaign")} FROM campaign ` +
      `WHERE ${dateFilter} AND ${campaignFilter} ORDER BY segments.date, campaign.id`,
    adGroups:
      `SELECT ${performanceFields("ad_group")} FROM ad_group ` +
      `WHERE ${dateFilter} AND ${campaignFilter} ` +
      "ORDER BY segments.date, campaign.id, ad_group.id",
    keywords:
      `SELECT ${performanceFields("keyword")}, ` +
      "ad_group_criterion.criterion_id, ad_group_criterion.status, " +
      "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type " +
      "FROM keyword_view " +
      `WHERE ${dateFilter} AND ${campaignFilter} AND ad_group_criterion.type = KEYWORD ` +
      "ORDER BY segments.date, campaign.id, ad_group.id, ad_group_criterion.criterion_id",
    searchTerms:
      `SELECT ${performanceFields("search_term")}, ` +
      "search_term_view.search_term, search_term_view.status " +
      "FROM search_term_view " +
      `WHERE ${dateFilter} AND ${campaignFilter} ` +
      "ORDER BY segments.date, campaign.id, ad_group.id, search_term_view.search_term",
  } as const;
}

function buildGoogleAdsInventoryQueries() {
  const campaignIds = TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.map(({ id }) => id).join(", ");
  return {
    account:
      "SELECT customer.id, customer.currency_code, customer.time_zone, " +
      "customer.conversion_tracking_setting.google_ads_conversion_customer, " +
      "customer.conversion_tracking_setting.conversion_tracking_status, " +
      "customer.conversion_tracking_setting.conversion_tracking_id, " +
      "customer.conversion_tracking_setting.cross_account_conversion_tracking_id " +
      "FROM customer LIMIT 1",
    campaigns:
      "SELECT campaign.id, campaign.name, campaign.status FROM campaign " +
      `WHERE campaign.id IN (${campaignIds}) ORDER BY campaign.id`,
    conversionActions:
      "SELECT conversion_action.id, conversion_action.name, conversion_action.status, " +
      "conversion_action.type, conversion_action.category, conversion_action.origin, " +
      "conversion_action.owner_customer, " +
      "conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric, " +
      "conversion_action.phone_call_duration_seconds, " +
      "conversion_action.value_settings.default_currency_code, " +
      "conversion_action.value_settings.always_use_default_value " +
      "FROM conversion_action WHERE conversion_action.status != 'REMOVED'",
    customerConversionGoals:
      "SELECT customer_conversion_goal.resource_name, " +
      "customer_conversion_goal.category, customer_conversion_goal.origin, " +
      "customer_conversion_goal.biddable FROM customer_conversion_goal",
  } as const;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Google Ads response is missing ${field}`);
  }
  return value;
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Google Ads response is missing ${field}`);
  }
  return value;
}

function defaultFalseBoolean(value: unknown, field: string): boolean {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`Google Ads response has invalid ${field}`);
  }
  return value === true;
}

function integerMetric(value: unknown, field: string): string {
  const normalized = value === undefined ? "0" : String(value);
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`Google Ads response has invalid ${field}`);
  }
  return normalized;
}

function decimalMetric(value: unknown, field: string): number {
  const normalized = value === undefined ? 0 : Number(value);
  if (!Number.isFinite(normalized)) {
    throw new Error(`Google Ads response has invalid ${field}`);
  }
  return normalized;
}

function nullableShareMetric(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 1) {
    throw new Error(`Google Ads response has invalid ${field}`);
  }
  return normalized;
}

function mapMetrics(row: GoogleAdsRow): GoogleAdsDailyMetrics {
  return {
    costMicros: integerMetric(row.metrics?.costMicros, "metrics.cost_micros"),
    clicks: integerMetric(row.metrics?.clicks, "metrics.clicks"),
    impressions: integerMetric(row.metrics?.impressions, "metrics.impressions"),
    conversions: decimalMetric(row.metrics?.conversions, "metrics.conversions"),
    conversionValue: decimalMetric(row.metrics?.conversionsValue, "metrics.conversions_value"),
  };
}

function mapCampaignIdentity(row: GoogleAdsRow): GoogleAdsDailyCampaignIdentity {
  const mapped: GoogleAdsDailyCampaignIdentity = {
    date: requiredString(row.segments?.date, "segments.date"),
    campaignId: requiredString(row.campaign?.id, "campaign.id"),
    campaignName: requiredString(row.campaign?.name, "campaign.name"),
    campaignStatus: requiredString(row.campaign?.status, "campaign.status"),
  };
  const expected = TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.find(({ id }) => id === mapped.campaignId);
  if (!expected || mapped.campaignName !== expected.name) {
    throw new Error("Google Ads metric row does not match a canonical campaign");
  }
  if (!(expected.allowedStatuses as readonly string[]).includes(mapped.campaignStatus)) {
    throw new Error(`Google Ads canonical campaign ${expected.id} has an invalid metric state`);
  }
  return mapped;
}

function mapCampaign(row: GoogleAdsRow): GoogleAdsDailyCampaignPerformance {
  return {
    ...mapCampaignIdentity(row),
    ...mapMetrics(row),
    searchImpressionShare: nullableShareMetric(
      row.metrics?.searchImpressionShare,
      "metrics.search_impression_share",
    ),
    searchRankLostImpressionShare: nullableShareMetric(
      row.metrics?.searchRankLostImpressionShare,
      "metrics.search_rank_lost_impression_share",
    ),
    searchBudgetLostImpressionShare: nullableShareMetric(
      row.metrics?.searchBudgetLostImpressionShare,
      "metrics.search_budget_lost_impression_share",
    ),
  };
}

function mapAdGroup(row: GoogleAdsRow): GoogleAdsDailyAdGroupPerformance {
  return {
    ...mapCampaignIdentity(row),
    ...mapMetrics(row),
    adGroupId: requiredString(row.adGroup?.id, "ad_group.id"),
    adGroupName: requiredString(row.adGroup?.name, "ad_group.name"),
    adGroupStatus: requiredString(row.adGroup?.status, "ad_group.status"),
  };
}

function mapKeyword(row: GoogleAdsRow): GoogleAdsDailyKeywordPerformance {
  return {
    ...mapAdGroup(row),
    criterionId: requiredString(row.adGroupCriterion?.criterionId, "ad_group_criterion.criterion_id"),
    keywordText: requiredString(row.adGroupCriterion?.keyword?.text, "ad_group_criterion.keyword.text"),
    keywordMatchType: requiredString(
      row.adGroupCriterion?.keyword?.matchType,
      "ad_group_criterion.keyword.match_type",
    ),
    keywordStatus: requiredString(row.adGroupCriterion?.status, "ad_group_criterion.status"),
  };
}

function mapSearchTerm(row: GoogleAdsRow): GoogleAdsDailySearchTermPerformance {
  return {
    ...mapAdGroup(row),
    searchTerm: requiredString(row.searchTermView?.searchTerm, "search_term_view.search_term"),
    searchTermStatus: requiredString(row.searchTermView?.status, "search_term_view.status"),
  };
}

function validateAccountInventory(
  accountRows: GoogleAdsRow[],
  campaignRows: GoogleAdsRow[],
  conversionActionRows: GoogleAdsRow[],
  customerConversionGoalRows: GoogleAdsRow[],
): GoogleAdsAccountInventory {
  if (accountRows.length !== 1) {
    throw new Error("Google Ads account inventory must return exactly one customer");
  }

  const customerId = requiredString(accountRows[0].customer?.id, "customer.id");
  const currencyCode = requiredString(
    accountRows[0].customer?.currencyCode,
    "customer.currency_code",
  );
  const timeZone = requiredString(accountRows[0].customer?.timeZone, "customer.time_zone");
  const googleAdsConversionCustomer = requiredString(
    accountRows[0].customer?.conversionTrackingSetting?.googleAdsConversionCustomer,
    "customer.conversion_tracking_setting.google_ads_conversion_customer",
  );
  const conversionTrackingStatus = requiredString(
    accountRows[0].customer?.conversionTrackingSetting?.conversionTrackingStatus,
    "customer.conversion_tracking_setting.conversion_tracking_status",
  );
  const conversionTrackingId = requiredString(
    accountRows[0].customer?.conversionTrackingSetting?.conversionTrackingId,
    "customer.conversion_tracking_setting.conversion_tracking_id",
  );
  const crossAccountConversionTrackingId =
    accountRows[0].customer?.conversionTrackingSetting?.crossAccountConversionTrackingId;
  if (customerId !== TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID) {
    throw new Error("Google Ads account inventory customer does not match True Color");
  }
  if (currencyCode !== TRUE_COLOR_GOOGLE_ADS_CURRENCY) {
    throw new Error("Google Ads account inventory currency must be CAD");
  }
  if (timeZone !== TRUE_COLOR_GOOGLE_ADS_TIME_ZONE) {
    throw new Error("Google Ads account inventory time zone must be America/Regina");
  }
  if (googleAdsConversionCustomer !== `customers/${TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID}`) {
    throw new Error("Google Ads conversion tracking must be owned by the True Color customer");
  }
  if (conversionTrackingStatus !== "CONVERSION_TRACKING_MANAGED_BY_SELF") {
    throw new Error("Google Ads conversion tracking must be managed by the True Color customer");
  }
  if (conversionTrackingId !== "18330693756") {
    throw new Error("Google Ads conversion tracking ID does not match True Color");
  }
  if (crossAccountConversionTrackingId !== undefined) {
    throw new Error("Google Ads cross-account conversion tracking must remain unset");
  }

  if (campaignRows.length !== TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.length) {
    throw new Error("Google Ads campaign inventory is missing a canonical campaign");
  }
  const rowsById = new Map<string, GoogleAdsCampaignInventory>();
  for (const row of campaignRows) {
    const campaign = {
      id: requiredString(row.campaign?.id, "campaign.id"),
      name: requiredString(row.campaign?.name, "campaign.name"),
      status: requiredString(row.campaign?.status, "campaign.status"),
    };
    if (rowsById.has(campaign.id)) {
      throw new Error("Google Ads campaign inventory contains a duplicate campaign");
    }
    rowsById.set(campaign.id, campaign);
  }

  const campaigns = TRUE_COLOR_GOOGLE_ADS_CAMPAIGNS.map((expected) => {
    const actual = rowsById.get(expected.id);
    if (!actual || actual.name !== expected.name) {
      throw new Error(`Google Ads canonical campaign ${expected.id} does not match inventory`);
    }
    if (!(expected.allowedStatuses as readonly string[]).includes(actual.status)) {
      throw new Error(`Google Ads canonical campaign ${expected.id} has an invalid state`);
    }
    return actual;
  });
  const customerConversionGoals = validateCustomerConversionGoals(customerConversionGoalRows);
  const conversionActions = validateConversionGoalInventory(
    conversionActionRows,
    customerConversionGoals,
  );

  return {
    customerId,
    currencyCode: "CAD",
    timeZone: "America/Regina",
    conversionTracking: {
      googleAdsConversionCustomer: "customers/1072816342",
      conversionTrackingStatus: "CONVERSION_TRACKING_MANAGED_BY_SELF",
      conversionTrackingId: "18330693756",
      crossAccountConversionTrackingId: null,
    },
    campaigns,
    conversionActions,
    customerConversionGoals,
  };
}

const EXPECTED_CONVERSION_ACTIONS = Object.freeze([
  Object.freeze({
    id: "7694360837",
    name: "purchase_online",
    category: "PURCHASE",
    origin: "WEBSITE",
    primaryForGoal: true,
    includeInConversionsMetric: true,
  }),
  Object.freeze({
    id: "7694360840",
    name: "quote_won",
    category: "PURCHASE",
    origin: "WEBSITE",
    primaryForGoal: true,
    includeInConversionsMetric: true,
  }),
  Object.freeze({
    id: "7694360843",
    name: "qualified_call_60s",
    category: "PHONE_CALL_LEAD",
    origin: "CALL_FROM_ADS",
    primaryForGoal: false,
    includeInConversionsMetric: false,
  }),
] as const);

/**
 * The legacy codeless "About Us" PAGE_VIEW action. It counted 101 page loads as conversions in
 * 30 days and is REMOVED as of the 2026-08-16 conversion-graph pass
 * (scripts/google-ads/apply-conversion-actions.mjs, op iii).
 *
 * The inventory query filters `status != 'REMOVED'`, so after the removal this action is simply
 * ABSENT. Its absence is now the target state, not drift — but the shape stays pinned so that an
 * account where it is still ENABLED (a rollback, a restore, a second account) is still checked
 * against exactly what it used to be, rather than silently passing.
 */
const EXPECTED_LEGACY_PAGE_VIEW_ACTION = Object.freeze({
  id: "7688596965",
  name: "About Us",
  status: "ENABLED",
  category: "PAGE_VIEW",
  origin: "WEBSITE",
  primaryForGoal: true,
  includeInConversionsMetric: false,
} as const);

/**
 * Secondary actions that exist for MEASUREMENT only and must never influence bidding. Keyed by
 * NAME because their IDs are assigned by Google at creation time and land in
 * docs/paid-search/campaign-config.mjs afterwards; pinning an ID here before it exists would
 * mean pinning a placeholder, and a placeholder pin is not a check.
 *
 * The generic guards below already reject any unknown action that is included or primary, so
 * these three would pass without being listed. They are listed anyway: an explicit expectation
 * distinguishes "known and deliberately secondary" from "unknown and happens to be harmless",
 * and the next person reading a conversion report needs that distinction.
 */
const EXPECTED_SECONDARY_ACTION_NAMES = Object.freeze([
  // 2026-08-16 created by apply-conversion-actions.mjs (op v). WEBSITE_CALL, 60s duration gate.
  "qualified_call_website_60s",
  // 2026-08-16 created by apply-conversion-actions.mjs (op v). WEBPAGE tel: tap intent — a tap
  // is not a conversation, which is why it is measured separately from the 60s action.
  "click_to_call_intent",
  // 2026-08-16 GA4 import un-hidden (op iv). ADS-CONVERSION-GAP-MEMO.md forbids a GA4 import
  // from ever being primary: GA4 and Google Ads attribution disagree, so a primary import
  // double-counts against the UPLOAD_CLICKS revenue actions this account actually bids on.
  "generate_lead",
] as const);

/**
 * PAGE_VIEW~WEBSITE is OPTIONAL as of 2026-08-16. Google materialises a customer conversion goal
 * per category~origin in use; removing the only PAGE_VIEW action can take the goal with it.
 * Requiring it would turn a completed cleanup into a hard failure. It stays listed so that if it
 * IS present it must still be non-biddable.
 */
const OPTIONAL_CUSTOMER_CONVERSION_GOAL_KEYS = Object.freeze(["PAGE_VIEW~WEBSITE"] as const);

const EXPECTED_CUSTOMER_CONVERSION_GOALS = Object.freeze([
  Object.freeze({ category: "PURCHASE", origin: "WEBSITE", biddable: true }),
  Object.freeze({ category: "PAGE_VIEW", origin: "WEBSITE", biddable: false }),
  Object.freeze({ category: "PHONE_CALL_LEAD", origin: "CALL_FROM_ADS", biddable: false }),
] as const);

function conversionGoalKey(category: string, origin: string): string {
  return `${category}~${origin}`;
}

function validateCustomerConversionGoals(
  rows: GoogleAdsRow[],
): GoogleAdsCustomerConversionGoalAttestation[] {
  const goals = rows.map((row) => ({
    category: requiredString(
      row.customerConversionGoal?.category,
      "customer_conversion_goal.category",
    ),
    origin: requiredString(
      row.customerConversionGoal?.origin,
      "customer_conversion_goal.origin",
    ),
    biddable: defaultFalseBoolean(
      row.customerConversionGoal?.biddable,
      "customer_conversion_goal.biddable",
    ),
  }));
  const byKey = new Map<string, GoogleAdsCustomerConversionGoalAttestation>();
  for (const goal of goals) {
    const key = conversionGoalKey(goal.category, goal.origin);
    if (byKey.has(key)) {
      throw new Error("Google Ads customer conversion goal inventory contains a duplicate goal");
    }
    byKey.set(key, goal);
  }

  for (const expected of EXPECTED_CUSTOMER_CONVERSION_GOALS) {
    const key = conversionGoalKey(expected.category, expected.origin);
    const actual = byKey.get(key);
    if (!actual) {
      if ((OPTIONAL_CUSTOMER_CONVERSION_GOAL_KEYS as readonly string[]).includes(key)) continue;
      throw new Error(
        `Google Ads customer conversion goal ${expected.category}/${expected.origin} has drifted`,
      );
    }
    if (actual.biddable !== expected.biddable) {
      throw new Error(
        `Google Ads customer conversion goal ${expected.category}/${expected.origin} has drifted`,
      );
    }
  }
  const unexpectedBiddable = goals.find(
    (goal) => goal.biddable
      && conversionGoalKey(goal.category, goal.origin) !== "PURCHASE~WEBSITE",
  );
  if (unexpectedBiddable) {
    throw new Error(
      `Google Ads unexpected customer conversion goal ` +
      `${unexpectedBiddable.category}/${unexpectedBiddable.origin} is biddable`,
    );
  }
  return goals;
}

function validateConversionGoalInventory(
  rows: GoogleAdsRow[],
  customerGoals: GoogleAdsCustomerConversionGoalAttestation[],
): GoogleAdsConversionGoalAttestation[] {
  const actions = rows.map((row) => ({
    id: requiredString(row.conversionAction?.id, "conversion_action.id"),
    name: requiredString(row.conversionAction?.name, "conversion_action.name"),
    status: requiredString(row.conversionAction?.status, "conversion_action.status"),
    category: requiredString(row.conversionAction?.category, "conversion_action.category"),
    origin: requiredString(row.conversionAction?.origin, "conversion_action.origin"),
    ownerCustomer: requiredString(
      row.conversionAction?.ownerCustomer,
      "conversion_action.owner_customer",
    ),
    primaryForGoal: requiredBoolean(
      row.conversionAction?.primaryForGoal,
      "conversion_action.primary_for_goal",
    ),
    includeInConversionsMetric: requiredBoolean(
      row.conversionAction?.includeInConversionsMetric,
      "conversion_action.include_in_conversions_metric",
    ),
  }));
  const byId = new Map<string, GoogleAdsConversionGoalAttestation>();
  for (const action of actions) {
    if (byId.has(action.id)) {
      throw new Error("Google Ads conversion action inventory contains a duplicate ID");
    }
    byId.set(action.id, action);
  }

  const expectedNames = new Set<string>(EXPECTED_CONVERSION_ACTIONS.map(({ name }) => name));
  for (const expected of EXPECTED_CONVERSION_ACTIONS) {
    const actual = byId.get(expected.id);
    if (
      !actual
      || actual.name !== expected.name
      || actual.category !== expected.category
      || actual.origin !== expected.origin
    ) {
      throw new Error(`Google Ads conversion action ${expected.id} does not match inventory`);
    }
    if (actual.status !== "ENABLED") {
      throw new Error(`Google Ads conversion action ${expected.id} must be enabled`);
    }
    if (actual.ownerCustomer !== `customers/${TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID}`) {
      throw new Error(`Google Ads conversion action ${expected.id} has an unexpected owner`);
    }
    if (
      actual.primaryForGoal !== expected.primaryForGoal
      || actual.includeInConversionsMetric !== expected.includeInConversionsMetric
    ) {
      throw new Error(`Google Ads conversion action ${expected.id} has unsafe bidding flags`);
    }
  }

  // Absent === REMOVED here: the inventory query filters `status != 'REMOVED'`. That is the
  // 2026-08-16 target state, so absence is accepted. If the action IS still present it must
  // match its historical shape exactly — a partially-edited About Us action is still drift.
  const legacyPageView = byId.get(EXPECTED_LEGACY_PAGE_VIEW_ACTION.id);
  if (
    legacyPageView
    && (Object.entries(EXPECTED_LEGACY_PAGE_VIEW_ACTION).some(
      ([key, value]) =>
        legacyPageView[key as keyof GoogleAdsConversionGoalAttestation] !== value,
    )
      || legacyPageView.ownerCustomer !== `customers/${TRUE_COLOR_GOOGLE_ADS_CUSTOMER_ID}`)
  ) {
    throw new Error("Google Ads legacy About Us conversion action has drifted");
  }

  // Measurement-only actions: present or not, they may never be primary or included.
  for (const name of EXPECTED_SECONDARY_ACTION_NAMES) {
    const secondary = actions.filter((action) => action.name === name);
    if (secondary.length > 1) {
      throw new Error(`Google Ads secondary conversion action ${name} is duplicated`);
    }
    const action = secondary[0];
    if (!action) continue;
    if (action.primaryForGoal || action.includeInConversionsMetric) {
      throw new Error(
        `Google Ads secondary conversion action ${name} must stay secondary and excluded from bidding`,
      );
    }
  }

  const customerGoalsByKey = new Map(
    customerGoals.map((goal) => [conversionGoalKey(goal.category, goal.origin), goal]),
  );
  for (const action of actions) {
    const expected = EXPECTED_CONVERSION_ACTIONS.find(({ id }) => id === action.id);
    if (!expected && expectedNames.has(action.name)) {
      throw new Error(`Google Ads conversion action name ${action.name} is duplicated`);
    }
    if (!expected && action.includeInConversionsMetric) {
      throw new Error(`Google Ads unexpected conversion action ${action.id} is included`);
    }
    if (!expected && action.primaryForGoal) {
      const customerGoal = customerGoalsByKey.get(
        conversionGoalKey(action.category, action.origin),
      );
      if (!customerGoal || customerGoal.biddable) {
        throw new Error(
          `Google Ads unexpected primary conversion action ${action.id} lacks a non-biddable goal`,
        );
      }
    }
  }
  return actions;
}

function transientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after")?.trim();
  if (retryAfter && /^\d+$/.test(retryAfter)) {
    return Math.min(Number(retryAfter) * 1_000, MAX_GOOGLE_ADS_RETRY_DELAY_MS);
  }
  return Math.min(100 * (2 ** (attempt - 1)), MAX_GOOGLE_ADS_RETRY_DELAY_MS);
}

async function fetchWithRetry(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  sleep: Sleep,
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_GOOGLE_ADS_REQUEST_ATTEMPTS; attempt += 1) {
    const response = await fetchImpl(input, init);
    if (!transientStatus(response.status) || attempt === MAX_GOOGLE_ADS_REQUEST_ATTEMPTS) {
      return response;
    }
    const delay = retryDelay(response, attempt);
    await response.arrayBuffer().catch(() => undefined);
    await sleep(delay);
  }
  throw new Error("Google Ads request exhausted retry attempts");
}

async function exchangeAccessToken(
  fetchImpl: typeof fetch,
  env: GoogleAdsPerformanceEnv,
  sleep: Sleep,
): Promise<string> {
  const response = await fetchWithRetry(fetchImpl, GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv(env, "GOOGLE_ADS_CLIENT_ID"),
      client_secret: requireEnv(env, "GOOGLE_ADS_CLIENT_SECRET"),
      refresh_token: requireEnv(env, "GOOGLE_ADS_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  }, sleep);
  const body = await response.json().catch(() => ({})) as { access_token?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google Ads OAuth exchange failed with HTTP ${response.status}`);
  }
  return body.access_token;
}

async function fetchReport(
  fetchImpl: typeof fetch,
  headers: Record<string, string>,
  query: string,
  report: ReportName,
  sleep: Sleep,
): Promise<GoogleAdsRow[]> {
  const results: GoogleAdsRow[] = [];
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;

  for (let page = 1; page <= MAX_GOOGLE_ADS_RESULT_PAGES; page += 1) {
    const response = await fetchWithRetry(fetchImpl, SEARCH_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
      signal: AbortSignal.timeout(20_000),
    }, sleep);
    const body = await response.json().catch(() => ({})) as GoogleAdsSearchResponse;
    if (!response.ok) {
      throw new Error(`Google Ads ${report} report failed with HTTP ${response.status}`);
    }
    if (body.results !== undefined && !Array.isArray(body.results)) {
      throw new Error(`Google Ads ${report} report returned invalid results`);
    }
    results.push(...(body.results ?? []));

    const nextPageToken = body.nextPageToken?.trim();
    if (!nextPageToken) return results;
    if (page === MAX_GOOGLE_ADS_RESULT_PAGES) {
      throw new Error(`Google Ads ${report} report exceeded ${MAX_GOOGLE_ADS_RESULT_PAGES} pages`);
    }
    if (seenPageTokens.has(nextPageToken)) {
      throw new Error(`Google Ads ${report} report returned a repeated page token`);
    }
    seenPageTokens.add(nextPageToken);
    pageToken = nextPageToken;
  }
  throw new Error(`Google Ads ${report} report exceeded ${MAX_GOOGLE_ADS_RESULT_PAGES} pages`);
}

export async function fetchGoogleAdsDailyPerformance(
  range: GoogleAdsDateRange,
  options: {
    fetchImpl?: typeof fetch;
    env?: GoogleAdsPerformanceEnv;
    sleep?: Sleep;
  } = {},
): Promise<GoogleAdsValidatedDailyPerformance> {
  const queries = buildGoogleAdsPerformanceQueries(range);
  const fetchImpl = options.fetchImpl ?? fetch;
  const env = options.env ?? process.env;
  const sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  }));

  const developerToken = requireEnv(env, "GOOGLE_ADS_DEVELOPER_TOKEN");
  const accessToken = await exchangeAccessToken(fetchImpl, env, sleep);
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "login-customer-id": TRUE_COLOR_GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    "content-type": "application/json",
  };

  const inventoryQueries = buildGoogleAdsInventoryQueries();
  const accountInventoryRows = await fetchReport(
    fetchImpl,
    headers,
    inventoryQueries.account,
    "account inventory",
    sleep,
  );
  const campaignInventoryRows = await fetchReport(
    fetchImpl,
    headers,
    inventoryQueries.campaigns,
    "campaign inventory",
    sleep,
  );
  const conversionActionRows = await fetchReport(
    fetchImpl,
    headers,
    inventoryQueries.conversionActions,
    "conversion action inventory",
    sleep,
  );
  const customerConversionGoalRows = await fetchReport(
    fetchImpl,
    headers,
    inventoryQueries.customerConversionGoals,
    "customer conversion goal inventory",
    sleep,
  );
  const inventory = validateAccountInventory(
    accountInventoryRows,
    campaignInventoryRows,
    conversionActionRows,
    customerConversionGoalRows,
  );

  const campaignRows = await fetchReport(fetchImpl, headers, queries.campaigns, "campaign", sleep);
  const adGroupRows = await fetchReport(fetchImpl, headers, queries.adGroups, "ad group", sleep);
  const keywordRows = await fetchReport(fetchImpl, headers, queries.keywords, "keyword", sleep);
  const searchTermRows = await fetchReport(
    fetchImpl,
    headers,
    queries.searchTerms,
    "search term",
    sleep,
  );

  return {
    inventory,
    campaigns: campaignRows.map(mapCampaign),
    adGroups: adGroupRows.map(mapAdGroup),
    keywords: keywordRows.map(mapKeyword),
    searchTerms: searchTermRows.map(mapSearchTerm),
  };
}
