const CUSTOMER_ID = "1072816342";
const LOGIN_CUSTOMER_ID = "1125402990";
const CAMPAIGN_NAMES = [
  "GOOG_Search_TC_CoreProducts_2026",
  "GOOG_Search_TC_CompetitorConquest_2026",
  "GOOG_Search_TC_BrandDefense_2026",
];
const NEAR_ME_TERMS = new Set([
  "die cut stickers near me",
  "custom die cut stickers near me",
  "custom stickers near me",
  "custom labels near me",
  "die cut labels near me",
  "custom die cut labels near me",
]);
const HISTORICAL_BROWSER_PURCHASE_ACTION_ID = "7689029977";
const OFFLINE_UPLOADER_CLEARANCE = "REAL_TRANSACTION_RECONCILED";
import { evaluatePausedLiveState, liveVerificationStatus } from "./live-verification-contract.mjs";

const requiredApiEnv = [
  "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN",
];
for (const name of requiredApiEnv) if (!process.env[name]) throw new Error(`${name} is required for credential-gated read-only verification`);
const optionalId = (name) => process.env[name]?.trim() || null;
const purchaseActionId = optionalId("GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID");
const quoteWonActionId = optionalId("GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID");
const qualifiedCallActionId = optionalId("GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID");

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
const token = await tokenResponse.json();
if (!tokenResponse.ok || !token.access_token) throw new Error("Google Ads OAuth exchange failed");

const headers = {
  authorization: `Bearer ${token.access_token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": LOGIN_CUSTOMER_ID,
  "content-type": "application/json",
};
const search = async (query) => {
  const response = await fetch(`https://googleads.googleapis.com/v24/customers/${CUSTOMER_ID}/googleAds:search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Google Ads read failed: ${JSON.stringify(body)}`);
  return body.results ?? [];
};

const names = CAMPAIGN_NAMES.map((name) => `'${name}'`).join(",");
const [
  accountRows,
  campaigns,
  allCampaigns,
  groups,
  keywords,
  ads,
  campaignCriteria,
  assets,
  assetLinks,
  conversions,
  customerConversionGoals,
  campaignConversionGoals,
  campaignGoalConfigs,
  customConversionGoals,
  spend,
] = await Promise.all([
  search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1"),
  search(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date_time, campaign.end_date_time, campaign.final_url_suffix, campaign.target_spend.cpc_bid_ceiling_micros, campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network, campaign.geo_target_type_setting.positive_geo_target_type, campaign.campaign_budget, campaign_budget.amount_micros FROM campaign WHERE campaign.name IN (${names}) ORDER BY campaign.name`),
  search("SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'"),
  search(`SELECT campaign.name, ad_group.name, ad_group.status FROM ad_group WHERE campaign.name IN (${names}) AND ad_group.status != 'REMOVED'`),
  search(`SELECT campaign.name, ad_group.name, ad_group_criterion.status, ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE campaign.name IN (${names}) AND ad_group_criterion.type = 'KEYWORD'`),
  search(`SELECT campaign.name, ad_group.name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.name IN (${names}) AND ad_group_ad.status != 'REMOVED'`),
  search(`SELECT campaign.name, campaign_criterion.type, campaign_criterion.negative, campaign_criterion.location.geo_target_constant, campaign_criterion.proximity.radius, campaign_criterion.proximity.radius_units, campaign_criterion.proximity.geo_point.latitude_in_micro_degrees, campaign_criterion.proximity.geo_point.longitude_in_micro_degrees, campaign_criterion.language.language_constant, campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.name IN (${names})`),
  search("SELECT asset.resource_name, asset.type, asset.policy_summary.approval_status, asset.policy_summary.review_status FROM asset WHERE asset.name LIKE 'TC PPC %'"),
  search("SELECT campaign.id, campaign_asset.asset, campaign_asset.status FROM campaign_asset WHERE campaign.id IN (24048123058,24048123061,24048123064) AND campaign_asset.status != 'REMOVED'"),
  search("SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category, conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric, conversion_action.phone_call_duration_seconds, conversion_action.value_settings.default_currency_code, conversion_action.value_settings.always_use_default_value FROM conversion_action WHERE conversion_action.status != 'REMOVED'"),
  search("SELECT customer_conversion_goal.resource_name, customer_conversion_goal.category, customer_conversion_goal.origin, customer_conversion_goal.biddable FROM customer_conversion_goal"),
  search(`SELECT campaign.name, campaign_conversion_goal.resource_name, campaign_conversion_goal.category, campaign_conversion_goal.origin, campaign_conversion_goal.biddable FROM campaign_conversion_goal WHERE campaign.name IN (${names})`),
  search(`SELECT campaign.name, conversion_goal_campaign_config.resource_name, conversion_goal_campaign_config.goal_config_level, conversion_goal_campaign_config.custom_conversion_goal FROM conversion_goal_campaign_config WHERE campaign.name IN (${names})`),
  search("SELECT custom_conversion_goal.id, custom_conversion_goal.resource_name, custom_conversion_goal.name, custom_conversion_goal.status, custom_conversion_goal.conversion_actions FROM custom_conversion_goal"),
  search("SELECT customer.id, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '2026-07-20' AND '2026-09-17'"),
]);

const endpointUrls = [
  "https://truecolorprinting.ca/products/coroplast-signs",
  "https://truecolorprinting.ca/products/stickers",
  "https://truecolorprinting.ca/products/vinyl-banners",
  "https://truecolorprinting.ca/products/business-cards",
  "https://truecolorprinting.ca/products/flyers",
  "https://truecolorprinting.ca/products/retractable-banners",
  "https://truecolorprinting.ca/why-true-color",
];
const endpointChecks = await Promise.all(endpointUrls.map(async (url) => {
  const response = await fetch(url, { redirect: "follow" });
  const robots = response.headers.get("x-robots-tag");
  const html = await response.text();
  const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
    || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  return { url, status: response.status, robots, noindex: robots?.toLowerCase().includes("noindex") === true || metaNoindex };
}));

const positiveKeywords = keywords.filter((row) => !row.adGroupCriterion.negative);
const nearMeKeywords = positiveKeywords
  .filter((row) => NEAR_ME_TERMS.has(row.adGroupCriterion.keyword.text.toLowerCase()))
  .map((row) => ({
    campaign: row.campaign.name,
    adGroup: row.adGroup.name,
    text: row.adGroupCriterion.keyword.text.toLowerCase(),
    matchType: row.adGroupCriterion.keyword.matchType,
    status: row.adGroupCriterion.status,
  }));
const negativeCount = keywords.length - positiveKeywords.length
  + campaignCriteria.filter((row) => row.campaignCriterion.type === "KEYWORD" && row.campaignCriterion.negative).length;
const competitorMatchTypes = [...new Set(positiveKeywords
  .filter((row) => row.campaign.name === "GOOG_Search_TC_CompetitorConquest_2026")
  .map((row) => row.adGroupCriterion.keyword.matchType))];
const campaignState = campaigns.map((row) => ({
  id: row.campaign.id,
  name: row.campaign.name,
  status: row.campaign.status,
  channel: row.campaign.advertisingChannelType,
  cpcCeilingCad: Number(row.campaign.targetSpend?.cpcBidCeilingMicros ?? 0) / 1_000_000,
  dailyBudgetCad: Number(row.campaignBudget?.amountMicros ?? 0) / 1_000_000,
  startDate: row.campaign.startDateTime?.slice(0, 10),
  endDate: row.campaign.endDateTime?.slice(0, 10),
  finalUrlSuffix: row.campaign.finalUrlSuffix,
  presence: row.campaign.geoTargetTypeSetting?.positiveGeoTargetType,
  networks: row.campaign.networkSettings,
}));
const account = accountRows[0]?.customer;
const allCampaignState = allCampaigns.map((row) => ({
  id: String(row.campaign.id),
  name: row.campaign.name,
  status: row.campaign.status,
}));
const conversionById = (id) => conversions.find((row) => String(row.conversionAction?.id) === id)?.conversionAction;
const normalizeConversion = (conversion, eventName) => conversion ? {
  ...(eventName ? { eventName } : {}),
  id: String(conversion.id),
  name: conversion.name,
  status: conversion.status,
  type: conversion.type,
  category: conversion.category,
  primaryForGoal: conversion.primaryForGoal,
  included: conversion.includeInConversionsMetric,
  minimumDurationSeconds: conversion.phoneCallDurationSeconds ?? null,
  currency: conversion.valueSettings?.defaultCurrencyCode,
  dynamicValue: conversion.valueSettings?.alwaysUseDefaultValue === false,
} : null;
const purchaseRevenueConversion = conversionById(purchaseActionId);
const quoteWonRevenueConversion = conversionById(quoteWonActionId);
const qualifiedCallConversion = conversionById(qualifiedCallActionId);
const historicalBrowserPurchaseConversion = conversionById(HISTORICAL_BROWSER_PURCHASE_ACTION_ID);
const normalizeGoal = (goal) => ({
  resourceName: goal.resourceName,
  category: goal.category,
  origin: goal.origin,
  biddable: goal.biddable === true,
});
const positiveGeoCriteria = campaignCriteria
  .filter((row) => ["LOCATION", "PROXIMITY"].includes(row.campaignCriterion.type)
    && row.campaignCriterion.negative !== true)
  .map((row) => ({
    campaign: row.campaign.name,
    type: row.campaignCriterion.type,
    radius: row.campaignCriterion.proximity?.radius ?? null,
    radiusUnits: row.campaignCriterion.proximity?.radiusUnits ?? null,
    latitudeInMicroDegrees: row.campaignCriterion.proximity?.geoPoint?.latitudeInMicroDegrees ?? null,
    longitudeInMicroDegrees: row.campaignCriterion.proximity?.geoPoint?.longitudeInMicroDegrees ?? null,
  }));
const offlineUploaderVerification = process.env.GOOGLE_ADS_OFFLINE_UPLOADER_VERIFICATION?.trim() ?? null;
const live = {
  account: {
    id: String(account?.id ?? ""),
    currencyCode: account?.currencyCode,
    timeZone: account?.timeZone,
  },
  spendScope: "EXACT_ACCOUNT_TOTAL",
  campaigns: campaignState,
  allCampaigns: allCampaignState,
  adGroups: groups.length,
  pausedAdGroups: groups.filter((row) => row.adGroup.status === "PAUSED").length,
  positiveKeywords: positiveKeywords.length,
  nearMeKeywords,
  negativeCriteria: negativeCount,
  competitorMatchTypes,
  responsiveSearchAds: ads.length,
  pausedResponsiveSearchAds: ads.filter((row) => row.adGroupAd.status === "PAUSED").length,
  rsaApprovalStatuses: [...new Set(ads.map((row) => row.adGroupAd.policySummary?.approvalStatus ?? "UNKNOWN"))],
  rsaReviewStatuses: [...new Set(ads.map((row) => row.adGroupAd.policySummary?.reviewStatus ?? "UNKNOWN"))],
  manualAssets: assets.length,
  assetApprovalStatuses: [...new Set(assets.map((row) => row.asset.policySummary?.approvalStatus ?? "UNKNOWN"))],
  campaignAssetLinks: assetLinks.length,
  locationTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "LOCATION"
    && row.campaignCriterion.negative !== true).length,
  proximityTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "PROXIMITY"
    && row.campaignCriterion.negative !== true).length,
  radius35KmTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "PROXIMITY"
    && row.campaignCriterion.negative !== true
    && Number(row.campaignCriterion.proximity?.radius) === 35
    && row.campaignCriterion.proximity?.radiusUnits === "KILOMETERS").length,
  positiveGeoCriteria,
  languageTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "LANGUAGE").length,
  englishLanguageTargets: campaignCriteria.filter((row) => row.campaignCriterion.language?.languageConstant === "languageConstants/1000").length,
  revenueConversions: {
    purchaseOnline: normalizeConversion(purchaseRevenueConversion, "purchase_online"),
    quoteWon: normalizeConversion(quoteWonRevenueConversion, "quote_won"),
  },
  qualifiedCallConversion: normalizeConversion(qualifiedCallConversion),
  historicalBrowserPurchaseConversion: normalizeConversion(historicalBrowserPurchaseConversion),
  conversionActionSelections: {
    purchaseOnline: { envVar: "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID", id: purchaseActionId },
    quoteWon: { envVar: "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID", id: quoteWonActionId },
    qualifiedCall: { envVar: "GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID", id: qualifiedCallActionId },
  },
  conversionActionInventory: conversions.map((row) => normalizeConversion(row.conversionAction)),
  customerConversionGoals: customerConversionGoals.map((row) => normalizeGoal(row.customerConversionGoal)),
  campaignConversionGoals: campaignConversionGoals.map((row) => ({
    campaign: row.campaign.name,
    ...normalizeGoal(row.campaignConversionGoal),
  })),
  campaignGoalConfigs: campaignGoalConfigs.map((row) => ({
    campaign: row.campaign.name,
    resourceName: row.conversionGoalCampaignConfig.resourceName,
    goalConfigLevel: row.conversionGoalCampaignConfig.goalConfigLevel,
    customConversionGoal: row.conversionGoalCampaignConfig.customConversionGoal ?? null,
  })),
  customConversionGoals: customConversionGoals.map((row) => row.customConversionGoal),
  offlineUploaderVerification: {
    verified: offlineUploaderVerification === OFFLINE_UPLOADER_CLEARANCE,
    method: offlineUploaderVerification === OFFLINE_UPLOADER_CLEARANCE
      ? OFFLINE_UPLOADER_CLEARANCE
      : null,
  },
  spendCadPilot: spend.reduce((sum, row) => sum + Number(row.metrics?.costMicros ?? 0), 0) / 1_000_000,
  endpointChecks,
};
const { failures: safetyFailures, launchBlockers } = evaluatePausedLiveState(live);

const result = {
  status: liveVerificationStatus({ failures: safetyFailures, launchBlockers }),
  verifiedAt: new Date().toISOString(),
  customerId: CUSTOMER_ID,
  safetyFailures,
  launchBlockers,
  live,
};
console.log(JSON.stringify(result, null, 2));
if (safetyFailures.length) process.exitCode = 1;
