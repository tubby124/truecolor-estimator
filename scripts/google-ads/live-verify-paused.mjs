const CUSTOMER_ID = "1072816342";
const LOGIN_CUSTOMER_ID = "1125402990";
const CAMPAIGN_NAMES = [
  "GOOG_Search_TC_CoreProducts_2026",
  "GOOG_Search_TC_CompetitorConquest_2026",
  "GOOG_Search_TC_BrandDefense_2026",
];
import { evaluatePausedLiveState } from "./live-verification-contract.mjs";

const requiredEnv = ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"];
for (const name of requiredEnv) if (!process.env[name]) throw new Error(`${name} is required for credential-gated read-only verification`);

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
const [campaigns, groups, keywords, ads, campaignCriteria, assets, assetLinks, conversions, spend] = await Promise.all([
  search(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date_time, campaign.end_date_time, campaign.final_url_suffix, campaign.target_spend.cpc_bid_ceiling_micros, campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network, campaign.geo_target_type_setting.positive_geo_target_type, campaign.campaign_budget, campaign_budget.amount_micros FROM campaign WHERE campaign.name IN (${names}) ORDER BY campaign.name`),
  search(`SELECT campaign.name, ad_group.name, ad_group.status FROM ad_group WHERE campaign.name IN (${names}) AND ad_group.status != 'REMOVED'`),
  search(`SELECT campaign.name, ad_group.name, ad_group_criterion.status, ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE campaign.name IN (${names}) AND ad_group_criterion.type = 'KEYWORD'`),
  search(`SELECT campaign.name, ad_group.name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.name IN (${names}) AND ad_group_ad.status != 'REMOVED'`),
  search(`SELECT campaign.name, campaign_criterion.type, campaign_criterion.negative, campaign_criterion.location.geo_target_constant, campaign_criterion.language.language_constant, campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.name IN (${names})`),
  search("SELECT asset.resource_name, asset.type, asset.policy_summary.approval_status, asset.policy_summary.review_status FROM asset WHERE asset.name LIKE 'TC PPC %'"),
  search("SELECT campaign.id, campaign_asset.asset, campaign_asset.status FROM campaign_asset WHERE campaign.id IN (24048123058,24048123061,24048123064) AND campaign_asset.status != 'REMOVED'"),
  search("SELECT conversion_action.id, conversion_action.status, conversion_action.category, conversion_action.primary_for_goal, conversion_action.include_in_conversions_metric, conversion_action.value_settings.default_currency_code, conversion_action.value_settings.always_use_default_value, conversion_action.tag_snippets FROM conversion_action WHERE conversion_action.name = 'Purchase - Website (True Color)'"),
  search(`SELECT campaign.name, metrics.cost_micros FROM campaign WHERE campaign.name IN (${names}) AND segments.date BETWEEN '2026-07-17' AND '2026-08-18'`),
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
const conversion = conversions[0]?.conversionAction;
const live = {
  campaigns: campaignState,
  adGroups: groups.length,
  pausedAdGroups: groups.filter((row) => row.adGroup.status === "PAUSED").length,
  positiveKeywords: positiveKeywords.length,
  negativeCriteria: negativeCount,
  competitorMatchTypes,
  responsiveSearchAds: ads.length,
  pausedResponsiveSearchAds: ads.filter((row) => row.adGroupAd.status === "PAUSED").length,
  rsaApprovalStatuses: [...new Set(ads.map((row) => row.adGroupAd.policySummary?.approvalStatus ?? "UNKNOWN"))],
  rsaReviewStatuses: [...new Set(ads.map((row) => row.adGroupAd.policySummary?.reviewStatus ?? "UNKNOWN"))],
  manualAssets: assets.length,
  assetApprovalStatuses: [...new Set(assets.map((row) => row.asset.policySummary?.approvalStatus ?? "UNKNOWN"))],
  campaignAssetLinks: assetLinks.length,
  locationTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "LOCATION").length,
  saskatoonLocationTargets: campaignCriteria.filter((row) => row.campaignCriterion.location?.geoTargetConstant === "geoTargetConstants/1002791").length,
  languageTargets: campaignCriteria.filter((row) => row.campaignCriterion.type === "LANGUAGE").length,
  englishLanguageTargets: campaignCriteria.filter((row) => row.campaignCriterion.language?.languageConstant === "languageConstants/1000").length,
  purchaseConversion: conversion ? {
    id: conversion.id,
    status: conversion.status,
    category: conversion.category,
    primaryForGoal: conversion.primaryForGoal,
    included: conversion.includeInConversionsMetric,
    currency: conversion.valueSettings?.defaultCurrencyCode,
    dynamicValue: conversion.valueSettings?.alwaysUseDefaultValue === false,
    destination: conversion.tagSnippets?.[0]?.eventSnippet?.match(/AW-\d+\/[A-Za-z0-9_-]+/)?.[0] ?? null,
  } : null,
  spendCadPilot: spend.reduce((sum, row) => sum + Number(row.metrics?.costMicros ?? 0), 0) / 1_000_000,
  endpointChecks,
};
const { failures: safetyFailures, launchBlockers } = evaluatePausedLiveState(live);

const result = {
  status: safetyFailures.length ? "UNSAFE" : "VALIDATED_PAUSED",
  verifiedAt: new Date().toISOString(),
  customerId: CUSTOMER_ID,
  safetyFailures,
  launchBlockers,
  live,
};
console.log(JSON.stringify(result, null, 2));
if (safetyFailures.length) process.exitCode = 1;
