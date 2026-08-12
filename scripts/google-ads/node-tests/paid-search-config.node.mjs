import assert from "node:assert/strict";
import test from "node:test";

import { paidSearchConfig } from "../../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "../config-validator.mjs";
import { buildArtifacts } from "../export-google-ads.mjs";
import { HARD_STOP_PROFILES } from "../hard-stop-contract.mjs";
import { evaluateLaunchCandidate } from "../validate-launch-candidate.mjs";
import {
  classifyAppliedIncentive,
  COMPETITOR_DESTINATION_BINDING,
  controlledTestLaunchBlockers,
  exactAccountSpendCad,
  evaluateLaunchedLiveState,
  evaluatePausedLiveState,
  LAUNCHED_EXPECTED_CAMPAIGNS,
  liveVerificationStatus,
  OFFLINE_UPLOADER_LAUNCH_BLOCKER,
  PAUSED_EXPECTED_CAMPAIGNS,
  withoutLoginCustomerHeader,
} from "../live-verification-contract.mjs";
import { COMPETITOR_RSA_REVIEW } from "../request-competitor-rsa-review.mjs";
import {
  buildCoreContractIndex,
  buildSwapOperations,
  classifyLiveCoreAds,
  findRetiredPriceInContract,
  fingerprintCopy,
  fingerprintDestinations,
  planDestinationSwap,
  planReplacementCreates,
} from "../stale-ad-replacement-contract.mjs";

const clone = () => structuredClone(paidSearchConfig);
const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if (char === "\n" && !quoted) { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  const [headers, ...values] = rows.filter((item) => item.some(Boolean));
  return { headers, rows: values.map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ""]))) };
};

test("canonical paid-search artifacts validate locally without claiming a fresh live check", () => {
  const result = validateConfig(clone());
  assert.equal(result.localStatus, "VALIDATED");
  assert.equal(result.liveStatus, "LIVE_UNVERIFIED");
  assert.equal(result.campaignsCreated, null);
  assert.equal(result.launched, null);
  assert.equal(result.spendCad, null);
  assert.deepEqual(result.errors, []);
});

test("launch candidate transitions require evidence and can reach fresh-live preflight", () => {
  const blocked = evaluateLaunchCandidate(clone());
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.activationPermitted, false);

  const malformed = clone();
  const gate = malformed.externalGates.find((item) => item.status === "BLOCKED");
  gate.status = "VERIFIED";
  gate.evidence = "short";
  assert.equal(validateConfig(malformed).localStatus, "INVALID");

  const cleared = clone();
  for (const item of cleared.externalGates) {
    if (item.status === "BLOCKED") {
      item.status = "VERIFIED";
      item.evidence = `Verified clearance for ${item.code}`;
    }
  }
  const ready = evaluateLaunchCandidate(cleared);
  assert.equal(ready.status, "READY_FOR_FRESH_LIVE_PREFLIGHT");
  assert.equal(ready.activationPermitted, false);
  assert.equal(ready.blockers.length, 0);
  // 2026-08-09 Competitor retirement left Core alone; the 2026-08-12 Vehicle Decals
  // expansion adds one page-backed Core group. Held inventory remains unchanged.
  // (12 retired Competitor groups + the 1 held Brand group). Retired groups must land in `held`
  // rather than vanish — an unrecognised tier silently dropping an ad group out of BOTH lists
  // is exactly the class of blind spot this contract keeps paying for.
  assert.equal(ready.candidates.length, 14);
  assert.equal(ready.held.length, 13);
  assert.deepEqual([...new Set(ready.held.map((group) => group.tier))].sort(), ["HOLD_AUCTION_INSIGHTS", "RETIRED_THIN_VOLUME"]);
  assert.equal(ready.held.filter((group) => group.tier === "RETIRED_THIN_VOLUME").length, 12);
});

// Fixture-only conversion IDs exercise the contract; they are not True Color account IDs.
const makePausedLiveState = () => ({
    account: { id: "1072816342", currencyCode: "CAD", timeZone: "America/Regina" },
    spendScope: "EXACT_ACCOUNT_TOTAL",
    campaigns: paidSearchConfig.campaigns.map((campaign) => ({
      id: paidSearchConfig.liveGoogleAds.campaignIds[campaign.name],
      name: campaign.name,
      status: "PAUSED",
      channel: "SEARCH",
      // Approved paused staging uses launch budgets while campaigns remain off.
      dailyBudgetCad: PAUSED_EXPECTED_CAMPAIGNS[campaign.name].budget,
      cpcCeilingCad: PAUSED_EXPECTED_CAMPAIGNS[campaign.name].ceiling,
      startDate: "2026-07-20",
      endDate: "2026-09-17",
      presence: "PRESENCE",
      networks: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
      finalUrlSuffix: paidSearchConfig.tracking.finalUrlSuffix,
    })),
    allCampaigns: paidSearchConfig.campaigns.map((campaign) => ({
      id: paidSearchConfig.liveGoogleAds.campaignIds[campaign.name],
      name: campaign.name,
      status: "PAUSED",
    })),
    adGroups: 27, pausedAdGroups: 1, enabledAdGroups: 26, positiveKeywords: 188, negativeCriteria: 391,
    nearMeKeywords: [
      "die cut stickers near me",
      "custom die cut stickers near me",
      "custom stickers near me",
      "custom labels near me",
      "die cut labels near me",
      "custom die cut labels near me",
    ].flatMap((text) => ["EXACT", "PHRASE"].map((matchType) => ({
      campaign: "GOOG_Search_TC_CoreProducts_2026",
      adGroup: "Stickers and Labels",
      text,
      matchType,
      status: "ENABLED",
    }))),
    // Destination repoints dropped legacy A from Generic Sign Shop (46 -> 45) and Generic Print
    // Price (45 -> 44); those ads point at retired destinations and are paused by their swaps.
    // The page-backed Vehicle Decals expansion then adds one fresh variant-B ad (44 -> 45).
    competitorMatchTypes: ["EXACT"], responsiveSearchAds: 45, pausedResponsiveSearchAds: 2, enabledResponsiveSearchAds: 43,
    competitorRsaDestinations: COMPETITOR_RSA_REVIEW.ads.map((ad) => ({
      campaignId: COMPETITOR_RSA_REVIEW.campaign.id,
      campaignResourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
      campaignName: COMPETITOR_RSA_REVIEW.campaign.name,
      adGroupId: ad.adGroupId,
      adGroupResourceName: ad.adGroupResourceName,
      adGroupName: ad.adGroupName,
      adGroupAdResourceName: ad.adGroupAdResourceName,
      status: "ENABLED",
      adId: ad.adId,
      adResourceName: ad.adResourceName,
      finalUrls: [COMPETITOR_DESTINATION_BINDING.finalUrl],
    })),
    accountWideAdAssociations: COMPETITOR_RSA_REVIEW.ads.map((ad) => ({
      campaignId: COMPETITOR_RSA_REVIEW.campaign.id,
      campaignResourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
      campaignName: COMPETITOR_RSA_REVIEW.campaign.name,
      adGroupId: ad.adGroupId,
      adGroupResourceName: ad.adGroupResourceName,
      adGroupName: ad.adGroupName,
      adGroupAdResourceName: ad.adGroupAdResourceName,
      status: "ENABLED",
      adId: ad.adId,
      adResourceName: ad.adResourceName,
      finalUrls: [COMPETITOR_DESTINATION_BINDING.finalUrl],
    })),
    // campaignAssetLinks = 39 contract callout/sitelink links + 14 owner-added image links (2026-08-10).
    rsaApprovalStatuses: ["APPROVED"], manualAssets: 13, assetApprovalStatuses: ["APPROVED"], campaignAssetLinks: 53,
    locationTargets: 0, proximityTargets: 3, radius35KmTargets: 3, languageTargets: 3, englishLanguageTargets: 3,
    positiveGeoCriteria: paidSearchConfig.campaigns.map((campaign) => ({
      campaign: campaign.name,
      type: "PROXIMITY",
      radius: 35,
      radiusUnits: "KILOMETERS",
      latitudeInMicroDegrees: 52_129_728,
      longitudeInMicroDegrees: -106_659_637,
    })),
    revenueConversions: {
      purchaseOnline: { eventName: "purchase_online", id: "9000000001", status: "ENABLED", type: "UPLOAD_CLICKS", category: "PURCHASE", primaryForGoal: true, included: true, currency: "CAD", dynamicValue: true },
      quoteWon: { eventName: "quote_won", id: "9000000002", status: "ENABLED", type: "UPLOAD_CLICKS", category: "PURCHASE", primaryForGoal: true, included: true, currency: "CAD", dynamicValue: true },
    },
    qualifiedCallConversion: { id: "9000000003", status: "ENABLED", type: "AD_CALL", category: "PHONE_CALL_LEAD", primaryForGoal: false, included: false, minimumDurationSeconds: 60 },
    historicalBrowserPurchaseConversion: { id: "7689029977", name: "Purchase - Website (True Color)", status: "ENABLED", type: "WEBPAGE", category: "PURCHASE", primaryForGoal: false, included: false },
    conversionActionSelections: {
      purchaseOnline: { envVar: "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID", id: "9000000001" },
      quoteWon: { envVar: "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID", id: "9000000002" },
      qualifiedCall: { envVar: "GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID", id: "9000000003" },
    },
    conversionActionInventory: [
      { id: "9000000001", name: "purchase_online", included: true },
      { id: "9000000002", name: "quote_won", included: true },
      { id: "9000000003", name: "qualified_call_60s", included: false },
      { id: "7689029977", name: "Purchase - Website (True Color)", included: false },
      { id: "7688596965", name: "About Us", included: false },
    ],
    customerConversionGoals: [
      { category: "PURCHASE", origin: "WEBSITE", biddable: true },
      { category: "PHONE_CALL_LEAD", origin: "CALL_FROM_ADS", biddable: false },
    ],
    campaignConversionGoals: paidSearchConfig.campaigns.flatMap((campaign) => [
      { campaign: campaign.name, category: "PURCHASE", origin: "WEBSITE", biddable: true },
      { campaign: campaign.name, category: "PHONE_CALL_LEAD", origin: "CALL_FROM_ADS", biddable: false },
    ]),
    campaignGoalConfigs: paidSearchConfig.campaigns.map((campaign) => ({
      campaign: campaign.name,
      goalConfigLevel: "CUSTOMER",
      customConversionGoal: null,
    })),
    customConversionGoals: [],
    callMeasurement: {
      accountSettings: {
        callReportingEnabled: true,
        callConversionReportingEnabled: true,
      },
      asset: {
        id: "394889103183",
        resourceName: "customers/1072816342/assets/394889103183",
        type: "CALL",
        countryCode: "CA",
        phoneNumber: "(306) 954-8688",
        callConversionAction: "customers/1072816342/conversionActions/9000000003",
        callConversionReportingState: "USE_RESOURCE_LEVEL_CALL_CONVERSION_ACTION",
        approvalStatus: "APPROVED",
        reviewStatus: "REVIEWED",
      },
      customerLinks: [{
        asset: "customers/1072816342/assets/394889103183",
        fieldType: "CALL",
        status: "ENABLED",
      }],
      campaignLinks: [],
      adGroupLinks: [],
    },
    promotion: {
      verified: true,
      method: "UI_CONFIRMED_ACTIVE",
      apiAvailable: false,
      apiError: "allowlist unavailable",
      appliedIncentives: [],
    },
    offlineUploaderVerification: { verified: true, method: "REAL_TRANSACTION_RECONCILED" },
    spendCadPilot: 0,
    endpointChecks: [{
      requestedUrl: COMPETITOR_DESTINATION_BINDING.finalUrl,
      finalUrl: COMPETITOR_DESTINATION_BINDING.finalUrl,
      status: 200,
      contentType: "text/html; charset=utf-8",
      markerFound: true,
      noindex: true,
    }],
});

const makeLaunchedLiveState = () => {
  const live = makePausedLiveState();
  live.campaigns = live.campaigns.map((campaign) => ({
    ...campaign,
    status: LAUNCHED_EXPECTED_CAMPAIGNS[campaign.name].status,
    dailyBudgetCad: LAUNCHED_EXPECTED_CAMPAIGNS[campaign.name].budget,
    cpcCeilingCad: LAUNCHED_EXPECTED_CAMPAIGNS[campaign.name].ceiling,
  }));
  live.allCampaigns = live.allCampaigns.map((campaign) => ({
    ...campaign,
    status: LAUNCHED_EXPECTED_CAMPAIGNS[campaign.name]?.status ?? campaign.status,
  }));
  // Stage 1 holds Brand paused; since 2026-08-09 it also holds all 12 retired Competitor groups
  // and their 21 RSAs paused. Enabled is Core alone: 14 groups after Vehicle Decals,
  // with 22 serving RSAs after the two destination swaps and the new vehicle ad.
  live.pausedAdGroups = 13;
  live.enabledAdGroups = 14;
  // 2026-08-09 copy replacement: 12 superseded Core RSAs are PAUSED rather than removed.
  // 2026-08-10 Generic Sign Shop destination repoint adds 2 more superseded ads (the group's old
  // variant B AND its legacy variant A, both pinned to /sign-company-saskatoon) and creates one
  // replacement, so the account carried 45 + 14 = 59 ads, 37 paused, and 22 enabled.
  // 2026-08-12 Generic Print Price repeats that pattern: +1 replacement, +2 superseded paused,
  // and -1 enabled. Vehicle Decals then adds one contract ad. End state is
  // 45 + 16 = 61 total, 39 paused, and 22 enabled.
  live.responsiveSearchAds = 61;
  live.pausedResponsiveSearchAds = 39;
  live.enabledResponsiveSearchAds = 22;
  live.nearMeKeywords = live.nearMeKeywords.map((keyword) => ({ ...keyword, status: "ENABLED" }));
  // Competitor ads are retired, so their destinations must read back PAUSED, not ENABLED.
  live.competitorRsaDestinations = live.competitorRsaDestinations.map((ad) => ({ ...ad, status: "PAUSED" }));
  live.accountWideAdAssociations = live.accountWideAdAssociations.map((ad) => ({ ...ad, status: "PAUSED" }));
  live.spendCadPilot = 12.5;
  return live;
};

test("live verification contract rejects launch-critical drift and missing noindex", () => {
  const live = makePausedLiveState();
  assert.deepEqual(evaluatePausedLiveState(live), { failures: [], launchBlockers: [] });
  const restEncoded = structuredClone(live);
  restEncoded.qualifiedCallConversion.minimumDurationSeconds = "60";
  assert.deepEqual(evaluatePausedLiveState(restEncoded), { failures: [], launchBlockers: [] });
  const drifts = [
    (value) => { value.campaigns[0].id = "wrong"; },
    (value) => { value.account.id = "2200538686"; },
    (value) => { value.spendScope = "PLANNED_CAMPAIGNS_ONLY"; },
    (value) => { value.campaigns[0].dailyBudgetCad = 9; },
    (value) => { value.campaigns[0].startDate = "2026-07-21"; },
    (value) => { value.campaigns[0].networks.targetGoogleSearch = false; },
    (value) => { value.campaigns[0].finalUrlSuffix = value.campaigns[0].finalUrlSuffix.replace("utm_term={keyword}&", ""); },
    (value) => { value.radius35KmTargets = 2; },
    (value) => { value.positiveGeoCriteria[0].latitudeInMicroDegrees += 1; },
    (value) => { value.positiveGeoCriteria[0].type = "LOCATION"; },
    (value) => { value.englishLanguageTargets = 2; },
    (value) => { value.nearMeKeywords[0].status = "PAUSED"; },
    (value) => { value.nearMeKeywords.pop(); },
    (value) => { value.revenueConversions.purchaseOnline.dynamicValue = false; },
    (value) => { value.revenueConversions.quoteWon.status = "REMOVED"; },
    (value) => { value.revenueConversions.quoteWon.type = "WEBPAGE"; },
    (value) => { value.revenueConversions.quoteWon.id = value.revenueConversions.purchaseOnline.id; },
    (value) => { value.qualifiedCallConversion.minimumDurationSeconds = 0; },
    (value) => { value.qualifiedCallConversion.included = true; },
    (value) => { value.callMeasurement.accountSettings.callReportingEnabled = false; },
    (value) => { value.callMeasurement.asset.callConversionAction = "customers/1072816342/conversionActions/179"; },
    (value) => { value.callMeasurement.asset.callConversionReportingState = "USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION"; },
    (value) => { value.callMeasurement.customerLinks[0].status = "PAUSED"; },
    (value) => { value.conversionActionInventory.find((action) => action.id === "9000000003").included = true; },
    (value) => { value.historicalBrowserPurchaseConversion.included = true; },
    (value) => { value.customerConversionGoals.find((goal) => goal.category === "PHONE_CALL_LEAD").biddable = true; },
    (value) => { value.customerConversionGoals.push({ category: "PAGE_VIEW", origin: "WEBSITE", biddable: true }); },
    (value) => { value.campaignConversionGoals.find((goal) => goal.category === "PHONE_CALL_LEAD").biddable = true; },
    (value) => { value.campaignConversionGoals.push({ campaign: "GOOG_Search_TC_CoreProducts_2026", category: "PAGE_VIEW", origin: "WEBSITE", biddable: true }); },
    (value) => { value.campaignGoalConfigs[0].goalConfigLevel = "CAMPAIGN"; },
    (value) => { value.customConversionGoals.push({ id: "unexpected" }); },
    (value) => { value.allCampaigns.push({ id: "99999999999", name: "Unexpected", status: "ENABLED" }); },
    (value) => { value.spendCadPilot = 1; },
    (value) => { value.competitorRsaDestinations[0].finalUrls = [COMPETITOR_RSA_REVIEW.oldFinalUrl]; },
    (value) => { value.competitorRsaDestinations[0].finalUrls = ["https://example.com/"]; },
    (value) => { value.competitorRsaDestinations.pop(); },
    (value) => {
      value.competitorRsaDestinations[1].adId = value.competitorRsaDestinations[0].adId;
    },
    (value) => {
      const target = value.accountWideAdAssociations[0];
      value.accountWideAdAssociations.push({
        ...structuredClone(target),
        campaignId: "99999999999",
        campaignResourceName: "customers/1072816342/campaigns/99999999999",
        campaignName: "Historical Paused",
        adGroupId: "99999999998",
        adGroupResourceName: "customers/1072816342/adGroups/99999999998",
        adGroupName: "Historical",
        adGroupAdResourceName:
          `customers/1072816342/adGroupAds/99999999998~${target.adId}`,
      });
    },
  ];
  for (const mutate of drifts) {
    const value = structuredClone(live);
    mutate(value);
    assert.ok(evaluatePausedLiveState(value).failures.length > 0);
  }
  const historicalPaused = structuredClone(live);
  historicalPaused.allCampaigns.push({ id: "99999999999", name: "Historical Paused", status: "PAUSED" });
  assert.deepEqual(evaluatePausedLiveState(historicalPaused), { failures: [], launchBlockers: [] });
  const indexed = structuredClone(live);
  indexed.endpointChecks[0].noindex = false;
  assert.deepEqual(evaluatePausedLiveState(indexed).launchBlockers, ["competitor landing is missing noindex"]);
  const brokenTrackedDestination = structuredClone(live);
  brokenTrackedDestination.endpointChecks[0].status = 503;
  assert.deepEqual(evaluatePausedLiveState(brokenTrackedDestination).launchBlockers, [
    "competitor landing is HTTP 503",
  ]);
  const redirectedTrackedDestination = structuredClone(live);
  redirectedTrackedDestination.endpointChecks[0].finalUrl =
    "https://truecolorprinting.ca/why-true-color";
  assert.deepEqual(evaluatePausedLiveState(redirectedTrackedDestination).launchBlockers, [
    "competitor landing redirected or resolved outside the exact tracked URL",
  ]);
  const nonHtmlTrackedDestination = structuredClone(live);
  nonHtmlTrackedDestination.endpointChecks[0].contentType = "application/json";
  assert.deepEqual(evaluatePausedLiveState(nonHtmlTrackedDestination).launchBlockers, [
    "competitor landing did not return HTML",
  ]);
  const missingMarkerTrackedDestination = structuredClone(live);
  missingMarkerTrackedDestination.endpointChecks[0].markerFound = false;
  assert.deepEqual(evaluatePausedLiveState(missingMarkerTrackedDestination).launchBlockers, [
    "competitor landing is missing the paid-page marker",
  ]);

  const uploaderUnverified = structuredClone(live);
  uploaderUnverified.offlineUploaderVerification = { verified: false, method: null };
  assert.deepEqual(evaluatePausedLiveState(uploaderUnverified).launchBlockers, [
    OFFLINE_UPLOADER_LAUNCH_BLOCKER,
  ]);
  assert.equal(liveVerificationStatus(evaluatePausedLiveState(uploaderUnverified)), "BLOCKED");
  assert.deepEqual(
    controlledTestLaunchBlockers(evaluatePausedLiveState(uploaderUnverified).launchBlockers),
    [],
  );

  const promotionUnverified = structuredClone(live);
  promotionUnverified.promotion = {
    verified: false,
    method: null,
    apiAvailable: false,
    apiError: "not allowlisted",
    appliedIncentives: [],
  };
  assert.deepEqual(evaluatePausedLiveState(promotionUnverified).launchBlockers, [
    "Google Ads promotion eligibility requires fresh UI or applied-incentive API confirmation",
  ]);
  assert.equal(liveVerificationStatus(evaluatePausedLiveState(promotionUnverified)), "BLOCKED");

  const apiPromotionVerified = structuredClone(live);
  apiPromotionVerified.promotion.method = "API_APPLIED_INCENTIVE_REDEEMED";
  assert.deepEqual(evaluatePausedLiveState(apiPromotionVerified), { failures: [], launchBlockers: [] });

  const callAssetUnderReview = structuredClone(live);
  callAssetUnderReview.callMeasurement.asset.approvalStatus = undefined;
  callAssetUnderReview.callMeasurement.asset.reviewStatus = "REVIEW_IN_PROGRESS";
  assert.deepEqual(evaluatePausedLiveState(callAssetUnderReview), {
    failures: [],
    launchBlockers: ["qualified call asset is awaiting Google policy approval"],
  });

  const disapprovedRsa = structuredClone(live);
  disapprovedRsa.rsaApprovalStatuses = ["APPROVED", "DISAPPROVED"];
  assert.deepEqual(evaluatePausedLiveState(disapprovedRsa).launchBlockers, [
    "one or more RSAs are not policy-approved",
  ]);
  assert.deepEqual(
    controlledTestLaunchBlockers(evaluatePausedLiveState(disapprovedRsa).launchBlockers),
    ["one or more RSAs are not policy-approved"],
  );
  assert.equal(liveVerificationStatus(evaluatePausedLiveState(disapprovedRsa)), "BLOCKED");

  const discoveryOnly = structuredClone(live);
  discoveryOnly.conversionActionSelections.purchaseOnline.id = null;
  discoveryOnly.conversionActionSelections.quoteWon.id = null;
  discoveryOnly.conversionActionSelections.qualifiedCall.id = null;
  discoveryOnly.revenueConversions.purchaseOnline = null;
  discoveryOnly.revenueConversions.quoteWon = null;
  discoveryOnly.qualifiedCallConversion = null;
  const discoveryResult = evaluatePausedLiveState(discoveryOnly);
  assert.deepEqual(discoveryResult.failures, []);
  assert.deepEqual(discoveryResult.launchBlockers, [
    "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID is missing; inspect the read-only conversionActionInventory and configure the owned-account action ID",
    "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID is missing; inspect the read-only conversionActionInventory and configure the owned-account action ID",
    "GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID is missing; inspect the read-only conversionActionInventory and configure the owned-account action ID",
  ]);
  assert.equal(liveVerificationStatus(discoveryResult), "BLOCKED");
  assert.equal(liveVerificationStatus({ failures: ["wrong account"], launchBlockers: discoveryResult.launchBlockers }), "UNSAFE");
  assert.equal(liveVerificationStatus({ failures: [], launchBlockers: [] }), "VALIDATED_PAUSED");
});

test("launched live verification enforces the exact Stage 1 state", () => {
  assert.deepEqual(LAUNCHED_EXPECTED_CAMPAIGNS, {
    GOOG_Search_TC_CoreProducts_2026: { id: "24048123058", budget: 21, ceiling: 5, status: "ENABLED" },
    // Competitor retired 2026-08-09 — PAUSED is now its approved Stage 1 status.
    GOOG_Search_TC_CompetitorConquest_2026: { id: "24048123061", budget: 4, ceiling: 2.5, status: "PAUSED" },
    GOOG_Search_TC_BrandDefense_2026: { id: "24048123064", budget: 3, ceiling: 1.5, status: "PAUSED" },
  });

  const launched = makeLaunchedLiveState();
  const launchedResult = evaluateLaunchedLiveState(launched);
  assert.deepEqual(launchedResult, { failures: [], launchBlockers: [] });
  assert.equal(liveVerificationStatus({ ...launchedResult, mode: "launched" }), "VALIDATED_LAUNCHED");

  const coreName = "GOOG_Search_TC_CoreProducts_2026";
  const brandName = "GOOG_Search_TC_BrandDefense_2026";

  const stillPaused = makeLaunchedLiveState();
  stillPaused.campaigns.find((c) => c.name === coreName).status = "PAUSED";
  stillPaused.allCampaigns.find((c) => c.name === coreName).status = "PAUSED";
  assert.ok(evaluateLaunchedLiveState(stillPaused).failures.length > 0);

  // Brand must stay held; an enabled Brand is drift, not a launch.
  const brandLive = makeLaunchedLiveState();
  brandLive.campaigns.find((c) => c.name === brandName).status = "ENABLED";
  brandLive.allCampaigns.find((c) => c.name === brandName).status = "ENABLED";
  assert.ok(evaluateLaunchedLiveState(brandLive).failures.length > 0);

  // Enabling the held Brand ad group or RSA is also drift.
  const brandGroupLive = makeLaunchedLiveState();
  brandGroupLive.pausedAdGroups = 0;
  brandGroupLive.enabledAdGroups = 25;
  assert.ok(evaluateLaunchedLiveState(brandGroupLive).failures.length > 0);

  const brandRsaLive = makeLaunchedLiveState();
  brandRsaLive.pausedResponsiveSearchAds = 0;
  brandRsaLive.enabledResponsiveSearchAds = 45;
  assert.ok(evaluateLaunchedLiveState(brandRsaLive).failures.length > 0);

  const wrongBudget = makeLaunchedLiveState();
  wrongBudget.campaigns[0].dailyBudgetCad = 13;
  assert.ok(evaluateLaunchedLiveState(wrongBudget).failures.length > 0);

  const unexpectedFourth = makeLaunchedLiveState();
  unexpectedFourth.allCampaigns.push({ id: "99999999999", name: "Historical Paused", status: "PAUSED" });
  assert.ok(evaluateLaunchedLiveState(unexpectedFourth).failures.length > 0);

  assert.deepEqual(evaluatePausedLiveState(makePausedLiveState()), { failures: [], launchBlockers: [] });
  assert.throws(() => liveVerificationStatus({ failures: [], launchBlockers: [], mode: "unknown" }));
});

test("applied incentive API evidence is exact, fresh, redacted, and direct-customer scoped", () => {
  const now = new Date("2026-07-24T05:00:00.000Z");
  const valid = {
    resourceName: "customers/1072816342/appliedIncentives/secret-coupon-code",
    incentiveState: "REDEEMED",
    fulfillmentExpirationDateTime: "2026-09-16 04:56:52.408",
    currencyCode: "CAD",
    rewardAmountMicros: "600000000",
    requiredMinSpendMicros: "600000000",
    currentSpendTowardsFulfillmentMicros: "0",
  };
  const evidence = classifyAppliedIncentive([valid], { customerId: "1072816342", now });
  assert.equal(evidence.verified, true);
  assert.equal(evidence.method, "API_APPLIED_INCENTIVE_REDEEMED");
  assert.equal(evidence.appliedIncentives.length, 1);
  assert.equal("resourceName" in evidence.appliedIncentives[0], false);
  assert.equal(JSON.stringify(evidence).includes("secret-coupon-code"), false);

  const invalidMutations = [
    (item) => { item.resourceName = "customers/999/appliedIncentives/code"; },
    (item) => { item.incentiveState = "EXPIRED"; },
    (item) => { item.fulfillmentExpirationDateTime = "2026-07-24 04:59:59"; },
    (item) => { item.fulfillmentExpirationDateTime = "not-a-date"; },
    (item) => { item.currencyCode = "USD"; },
    (item) => { item.rewardAmountMicros = "599999999"; },
    (item) => { item.requiredMinSpendMicros = "650000000"; },
  ];
  for (const mutate of invalidMutations) {
    const item = structuredClone(valid);
    mutate(item);
    const rejected = classifyAppliedIncentive([item], { customerId: "1072816342", now });
    assert.equal(rejected.verified, false);
    assert.equal(rejected.method, null);
  }
  assert.throws(() => classifyAppliedIncentive(null, { customerId: "1072816342", now }));
  assert.throws(() => classifyAppliedIncentive([], { customerId: "wrong", now }));
  assert.throws(() => classifyAppliedIncentive([], {
    customerId: "1072816342",
    now: new Date("invalid"),
  }));

  const managerHeaders = {
    authorization: "Bearer redacted",
    "developer-token": "redacted",
    "login-customer-id": "1125402990",
    "content-type": "application/json",
  };
  assert.deepEqual(withoutLoginCustomerHeader(managerHeaders), {
    authorization: "Bearer redacted",
    "developer-token": "redacted",
    "content-type": "application/json",
  });
  assert.equal(managerHeaders["login-customer-id"], "1125402990");
});

test("live account spend evidence requires exactly one exact-customer canonical row", () => {
  const valid = [{
    customer: { id: "1072816342" },
    metrics: { costMicros: "0" },
  }];
  assert.equal(exactAccountSpendCad(valid, { customerId: "1072816342" }), 0);
  assert.equal(exactAccountSpendCad([{
    customer: { id: "1072816342" },
    metrics: { costMicros: "1250000" },
  }], { customerId: "1072816342" }), 1.25);
  for (const rows of [
    [],
    [...valid, ...valid],
    [{ customer: { id: "999" }, metrics: { costMicros: "0" } }],
    [{ customer: { id: "1072816342" }, metrics: {} }],
    [{ customer: { id: "1072816342" }, metrics: { costMicros: null } }],
    [{ customer: { id: "1072816342" }, metrics: { costMicros: "-1" } }],
    [{ customer: { id: "1072816342" }, metrics: { costMicros: "NaN" } }],
    [{
      customer: { id: "1072816342" },
      metrics: { costMicros: (BigInt(Number.MAX_SAFE_INTEGER) + 1n).toString() },
    }],
  ]) {
    assert.throws(() => exactAccountSpendCad(rows, { customerId: "1072816342" }));
  }
  assert.throws(() => exactAccountSpendCad(valid, { customerId: "wrong" }));
});

test("locks the confirmed True Color child account and verified account-side gates", () => {
  assert.equal(paidSearchConfig.accountCustomerId, "1072816342");
  const accountGate = paidSearchConfig.externalGates.find((gate) => gate.code === "TRUE_COLOR_CUSTOMER_ID");
  assert.equal(accountGate?.status, "VERIFIED");
  assert.equal(accountGate?.evidence, "True Color Display Print child account 107-281-6342 under manager 112-540-2990");
  assert.deepEqual(
    paidSearchConfig.externalGates.filter((gate) => gate.status === "VERIFIED").map((gate) => gate.code),
    [
      "TRUE_COLOR_CUSTOMER_ID",
      "BILLING_ACTIVE",
      "AUTO_TAGGING_ENABLED",
      "PURCHASE_UPLOAD_CLICKS_ACTION",
      "QUOTE_WON_UPLOAD_CLICKS_ACTION",
      "CONVERSION_GOAL_GRAPH",
      "OFFLINE_UPLOADER_MIGRATION",
      "QUALIFIED_CALL_ACTION",
      "PROMOTION_ELIGIBILITY",
      "COMPETITOR_LANDING_DEPLOYED",
      "RSA_POLICY_APPROVAL",
      "AUCTION_INSIGHTS_SIGNOFF",
      "ENHANCED_CONSENT_DECISION",
      "CURRENT_KEYWORD_PLANNER_FORECAST",
      "CPC_CEILING_LAUNCH_APPROVAL",
      "BUDGET_APPROVAL",
      "DATES_AND_HARD_STOP",
      "MOBILE_QA",
      "PRESENCE_ONLY_AND_EDITOR_PREVIEW",
    ],
  );
  assert.deepEqual(
    paidSearchConfig.externalGates.filter((gate) => gate.status === "BLOCKED").map((gate) => gate.code),
    [
      "PURCHASE_UPLOAD_CLICKS_OBSERVED",
      "QUOTE_WON_UPLOAD_CLICKS_OBSERVED",
      "LAUNCH_CONTROL_SIGNOFF",
    ],
  );

  for (const mutate of [
    (c) => { c.accountCustomerId = null; },
    (c) => { c.accountCustomerId = "2200538686"; },
    (c) => { c.externalGates.find((gate) => gate.code === "TRUE_COLOR_CUSTOMER_ID").status = "BLOCKED"; },
    (c) => { c.externalGates.find((gate) => gate.code === "CURRENT_KEYWORD_PLANNER_FORECAST").evidence = "wrong"; },
    (c) => { c.liveGoogleAds.campaignIds.GOOG_Search_TC_CoreProducts_2026 = "wrong"; },
    (c) => { c.liveGoogleAds.status = "ENABLED"; },
    (c) => { c.liveGoogleAds.historicalBrowserPurchaseConversion.primaryForGoal = true; },
    (c) => { c.liveGoogleAds.conversionGoalGraph.customerGoals.phoneCallLeadCallFromAds.biddable = true; },
    (c) => { c.liveGoogleAds.conversionGoalGraph.biddingActionIds.push("7689029977"); },
    (c) => { c.liveGoogleAds.geoTarget.center.latitude = 0; },
    (c) => { c.conversionMeasurement.requiredUploadClickActions.purchaseOnline.actionId = "7689029977"; },
  ]) {
    const config = clone();
    mutate(config);
    const result = validateConfig(config);
    assert.equal(result.localStatus, "INVALID");
    assert.equal(result.liveStatus, "LIVE_UNVERIFIED");
    assert.equal(result.campaignsCreated, null);
    assert.equal(result.spendCad, null);
  }
});

test("rejects off-target statuses and unsafe network, match, geo, budget, and date settings", () => {
  const mutations = [
    (c) => { c.campaigns[0].status = "PAUSED"; },
    (c) => { c.campaigns[0].status = "REMOVED"; },
    (c) => { c.campaigns[2].status = "ENABLED"; },
    (c) => { c.campaigns[2].adGroups[0].status = "ENABLED"; },
    (c) => { c.campaigns[2].maximumPilotCad = 138; },
    (c) => { c.campaigns[0].networks.display = true; },
    (c) => { c.campaigns[0].geoTarget.presenceOnly = false; },
    (c) => { c.campaigns[0].geoTarget.radiusKm = 50; },
    (c) => { c.campaigns[0].geoTarget.center.longitude = 0; },
    (c) => { c.campaigns[0].adGroups[0].keywords[0].matchType = "BROAD"; },
    (c) => { c.campaigns[0].adGroups[0].keywords = []; },
    (c) => { c.campaigns[0].dailyBudgetCad = 15; c.campaigns[0].maximumPilotCad = 15 * 46; },
    (c) => { c.campaigns[1].dailyBudgetCad = 3; c.campaigns[1].maximumPilotCad = 3 * 46; },
    (c) => { c.campaigns[0].maximumPilotCad = 645; },
    (c) => { c.campaigns[0].maximumPilotCad = 600; c.campaigns[0].dailyBudgetCad = 600 / 46; },
    (c) => { c.maximumPilotCad = 1300; },
    (c) => { c.pilot.startDate = "2026-08-04"; },
    (c) => { c.pilot.endDate = "2026-09-18"; },
    (c) => { c.pilot.inclusiveDays = 60; },
    (c) => { c.spendControls.protectivePauseCad = 1250; },
    (c) => { c.spendControls.absoluteCapCad = 1300; },
    (c) => { c.campaigns.push({ ...structuredClone(c.campaigns[0]), kind: "EXTRA", name: "Unexpected", status: "ENABLED" }); },
  ];

  for (const mutate of mutations) {
    const config = clone();
    mutate(config);
    assert.notEqual(validateConfig(config).localStatus, "VALIDATED");
  }
});

test("rejects URL, RSA, ValueTrack, bidding, and gate violations", () => {
  const mutations = [
    (c) => { c.campaigns[0].adGroups[0].finalUrl = "https://example.com/products/coroplast-signs"; },
    (c) => { c.campaigns[0].adGroups[0].finalUrl = "https://truecolorprinting.ca/products/stickers"; },
    (c) => { c.campaigns[1].adGroups[0].finalUrl = "https://truecolorprinting.ca/why-true-color"; },
    (c) => { c.campaigns[1].adGroups[0].rsa.headlines[0] = "Qwik Signs Alternative"; },
    (c) => { c.campaigns[1].adGroups[0].rsa.path1 = "qwik-signs"; },
    (c) => { c.campaigns[0].adGroups[0].rsa.headlines = ["Too few headlines"]; },
    (c) => { c.campaigns[0].adGroups[0].rsa.descriptions[0] = "x".repeat(91); },
    (c) => { c.tracking.finalUrlSuffix = c.tracking.finalUrlSuffix.replace("keyword={keyword}&", ""); },
    (c) => { c.bidding.cpcCeilingCadByCampaignKind.CORE = 7; },
    (c) => { c.bidding.cpcCeilingCadByCampaignKind.BRAND = 2.5; },
    (c) => { c.campaigns[0].adGroups[0].launchTier = "TIER_2_EXPANSION"; },
    (c) => { c.campaigns[0].adGroups.find((g) => g.key === "rush-same-day").launchTier = "TIER_2_EXPANSION"; },
    (c) => { c.campaigns[2].adGroups[0].launchTier = "TIER_1_PRODUCT"; },
    (c) => { c.adAssets.callouts = []; },
    (c) => { c.adAssets.sitelinks[0].finalUrl = "https://truecolorprinting.ca/about"; },
    (c) => { c.adAssets.callouts[0] = "Better Than Qwik Signs"; },
    (c) => { c.externalGates = c.externalGates.filter((g) => g.code !== "TRUE_COLOR_CUSTOMER_ID"); },
    (c) => { c.campaigns[2].gates = []; },
  ];

  for (const mutate of mutations) {
    const config = clone();
    mutate(config);
    assert.notEqual(validateConfig(config).localStatus, "VALIDATED");
  }
});

test("canonical routing and campaign caps are complete", () => {
  const core = paidSearchConfig.campaigns.find((c) => c.kind === "CORE");
  const competitors = paidSearchConfig.campaigns.find((c) => c.kind === "COMPETITOR");
  const brand = paidSearchConfig.campaigns.find((c) => c.kind === "BRAND");

  assert.equal(paidSearchConfig.pilot.startDate, "2026-08-03");
  assert.equal(paidSearchConfig.pilot.endDate, "2026-09-17");
  assert.equal(paidSearchConfig.pilot.inclusiveDays, 46);
  assert.equal(core.dailyBudgetCad, 21);
  assert.equal(core.maximumPilotCad, 966);
  assert.equal(competitors.dailyBudgetCad, 4);
  // 2026-08-09 RETIRED: keeps its staged daily budget (Brand precedent) but plans CA$0 spend.
  assert.equal(competitors.status, "PAUSED");
  assert.equal(competitors.maximumPilotCad, 0);
  assert.equal(brand.dailyBudgetCad, 3);
  assert.equal(brand.maximumPilotCad, 0);
  assert.equal(paidSearchConfig.targetQualifyingSpendCad, 600);
  assert.equal(paidSearchConfig.maximumPilotCad, 600);
  const plannedMaximumCad = paidSearchConfig.campaigns.reduce((sum, campaign) => sum + campaign.maximumPilotCad, 0);
  // 2026-08-09: 1150 -> 966 (Competitor's 184 retired to 0). Core alone must still be able to
  // reach the CA$600 qualifying target, which the assertions below enforce.
  assert.equal(plannedMaximumCad, 966);
  // Budget capacity intentionally EXCEEDS the CA$600 runtime ceiling: daily budgets are
  // permission to capture cheap clicks on good days, and the 15-minute hard-stop monitor is
  // the binding constraint on total spend. Capacity must still be able to reach the target.
  assert.ok(plannedMaximumCad > paidSearchConfig.maximumPilotCad);
  assert.ok(plannedMaximumCad >= paidSearchConfig.targetQualifyingSpendCad);
  // Blast-radius bound if the monitor ever stops: enabled daily budget caps the burn rate.
  const enabledDailyBudget = paidSearchConfig.campaigns
    .filter((campaign) => campaign.status === "ENABLED")
    .reduce((sum, campaign) => sum + campaign.dailyBudgetCad, 0);
  // 2026-08-07: 22 -> 25 (Core 18 -> 21). 2026-08-09: 25 -> 21, because retiring Competitor
  // removed its CA$4 from the ENABLED subset. This is a snapshot of the current value; the line
  // below is the actual blast-radius bound. The retirement bought CA$4 of headroom under it, so
  // Core can now be raised to CA$25 on evidence without touching MAX_UNMONITORED_DAILY_BURN_CAD.
  assert.equal(enabledDailyBudget, 21);
  assert.ok(enabledDailyBudget <= 25);
  for (const campaign of paidSearchConfig.campaigns) {
    // COMPETITOR joined BRAND on the paused side when it was retired 2026-08-09.
    const expectedStatus = campaign.kind === "BRAND" || campaign.kind === "COMPETITOR" ? "PAUSED" : "ENABLED";
    assert.equal(campaign.status, expectedStatus);
    assert.ok(campaign.adGroups.every((group) => group.status === expectedStatus));
    // A paused campaign keeps its staged daily budget but contributes CA$0 to approved pilot spend.
    assert.equal(
      campaign.maximumPilotCad,
      expectedStatus === "PAUSED" ? 0 : campaign.dailyBudgetCad * paidSearchConfig.pilot.inclusiveDays,
    );
  }
  // 2026-08-07: 25 -> 28. Contract TOTAL across all three campaigns (Core 21 + Competitor 4 +
  // Brand 3), mirroring LAUNCHABLE_DAILY_BUDGET_CAD. Not a safety bound — Brand is PAUSED and
  // contributes CA$0 of real burn; the enabled-subset bound is asserted above.
  assert.equal(paidSearchConfig.campaigns.reduce((sum, campaign) => sum + campaign.dailyBudgetCad, 0), 28);
  assert.equal(paidSearchConfig.conversionMeasurement.revenueSource, "SERVER_UPLOAD_CLICKS");
  assert.deepEqual(
    Object.values(paidSearchConfig.conversionMeasurement.requiredUploadClickActions).map((action) => [action.eventName, action.actionId, action.status]),
    [["purchase_online", "7694360837", "VERIFIED_LIVE"], ["quote_won", "7694360840", "VERIFIED_LIVE"]],
  );
  assert.equal(paidSearchConfig.conversionMeasurement.diagnosticEvents.channel, "GA4");
  assert.equal(paidSearchConfig.conversionMeasurement.diagnosticEvents.googleAdsDelivery, false);
  assert.equal(paidSearchConfig.conversionMeasurement.diagnosticEvents.phoneClicksAreQualifiedCalls, false);
  assert.equal(paidSearchConfig.conversionMeasurement.qualifiedCallAction.actionId, "7694360843");
  assert.equal(paidSearchConfig.conversionMeasurement.qualifiedCallAction.minimumDurationSeconds, 60);
  assert.equal(paidSearchConfig.conversionMeasurement.qualifiedCallAction.includedInConversions, false);
  assert.deepEqual(paidSearchConfig.liveGoogleAds.conversionGoalGraph.biddingActionIds, ["7694360837", "7694360840"]);
  assert.equal(paidSearchConfig.liveGoogleAds.conversionGoalGraph.customerGoals.purchaseWebsite.biddable, true);
  assert.equal(paidSearchConfig.liveGoogleAds.conversionGoalGraph.customerGoals.pageViewWebsite.biddable, false);
  assert.equal(paidSearchConfig.liveGoogleAds.conversionGoalGraph.customerGoals.phoneCallLeadCallFromAds.biddable, false);
  assert.equal(paidSearchConfig.liveGoogleAds.historicalBrowserPurchaseConversion.primaryForGoal, false);
  assert.equal(paidSearchConfig.liveGoogleAds.historicalBrowserPurchaseConversion.includedInConversions, false);
  assert.deepEqual(paidSearchConfig.spendControls, { scope: "EXACT_ACCOUNT_TOTAL", warningCad: 450, protectivePauseCad: 600, absoluteCapCad: 600, monitorCadenceMinutes: 15 });
  assert.equal(paidSearchConfig.spendControls.absoluteCapCad, paidSearchConfig.maximumPilotCad);
  assert.deepEqual(
    [HARD_STOP_PROFILES["public-pilot"].warningCad, HARD_STOP_PROFILES["public-pilot"].thresholdCad, HARD_STOP_PROFILES["public-pilot"].approvedCapCad],
    [paidSearchConfig.spendControls.warningCad, paidSearchConfig.spendControls.protectivePauseCad, paidSearchConfig.spendControls.absoluteCapCad],
  );
  assert.equal(HARD_STOP_PROFILES["public-pilot"].spendScope, paidSearchConfig.spendControls.scope);
  assert.deepEqual(paidSearchConfig.controlledTest, {
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    adGroupKey: "coroplast",
    dailyBudgetCad: 5,
    protectivePauseCad: 25,
    absoluteCapCad: 30,
    maximumWindowHours: 72,
  });
  assert.equal(competitors.adGroups.length, 12);
  assert.equal(competitors.adGroups.flatMap((group) => group.keywords).length, 14);
  assert.ok(competitors.adGroups.every((group) => (
    group.finalUrl === "https://truecolorprinting.ca/why-true-color?source=google-ads"
  )));
  assert.ok(competitors.adGroups.every((group) => group.keywords.every((keyword) => keyword.matchType === "EXACT")));
  assert.equal(competitors.adGroups.find((group) => group.key === "ink-house").keywords[0].text, "ink house saskatoon");
  assert.equal(competitors.adGroups.find((group) => group.key === "rayacom").keywords[0].text, "rayacom saskatoon");
  assert.deepEqual(paidSearchConfig.bidding.cpcCeilingCadByCampaignKind, { CORE: 5, COMPETITOR: 2.5, BRAND: 1.5 });
  assert.equal(paidSearchConfig.adAssets.sitelinks.length, 6);
  assert.equal(paidSearchConfig.adAssets.callouts.length, 6);
  assert.equal(core.adGroups.find((g) => g.key === "coroplast").finalUrl, "https://truecolorprinting.ca/products/coroplast-signs");
  assert.equal(core.adGroups.find((g) => g.key === "stickers-labels").finalUrl, "https://truecolorprinting.ca/products/stickers");
  assert.ok(core.campaignNegatives.some((n) => n.toLowerCase().includes("qwik signs")));
  for (const term of ["die cut stickers near me", "custom die cut stickers near me", "custom stickers near me", "custom labels near me", "die cut labels near me", "custom die cut labels near me"]) {
    assert.ok(core.adGroups.find((g) => g.key === "stickers-labels").keywords.some((keyword) => keyword.text === term && keyword.matchType === "EXACT"));
    assert.ok(core.adGroups.find((g) => g.key === "stickers-labels").keywords.some((keyword) => keyword.text === term && keyword.matchType === "PHRASE"));
  }
});

test("exports deterministic Google Ads Editor CSV artifacts", () => {
  const first = buildArtifacts(clone());
  const second = buildArtifacts(clone());
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first).sort(), [
    "ad-groups.csv", "campaign-negatives.csv", "campaigns.csv", "keywords.csv", "launch-candidate-manifest.json", "locations.csv", "responsive-search-ads.csv", "validation-summary.json",
  ]);
  assert.match(first["campaigns.csv"], /GOOG_Search_TC_CoreProducts_2026/);
  assert.match(first["keywords.csv"], /\[coroplast signs saskatoon\]/);
  assert.match(first["responsive-search-ads.csv"], /Responsive search ad/);
  assert.doesNotMatch(first["campaign-negatives.csv"], /\n,/);
  assert.doesNotMatch(first["responsive-search-ads.csv"], /Qwik Signs Alternative/);
  assert.match(first["validation-summary.json"], /"liveStatus": "LIVE_UNVERIFIED"/);
  assert.doesNotMatch(first["validation-summary.json"], /"campaignsCreatedInAds"/);
  assert.match(first["validation-summary.json"], /"accountCustomerId": "1072816342"/);
  const manifest = JSON.parse(first["launch-candidate-manifest.json"]);
  assert.equal(manifest.activationPermitted, false);
  assert.equal(manifest.requiredFreshLiveVerification, true);
  assert.equal(manifest.conversionMeasurement.revenueSource, "SERVER_UPLOAD_CLICKS");
  assert.equal(manifest.conversionMeasurement.requiredUploadClickActions.quoteWon.actionId, "7694360840");
  assert.equal(manifest.recordedLiveEvidence.validatedAt, "2026-07-25");
  assert.equal(manifest.recordedLiveEvidence.counts.positiveKeywords, 83);
  assert.deepEqual(manifest.recordedLiveEvidence.geoTarget.center, { latitude: 52.129728, longitude: -106.659637 });
  assert.deepEqual(manifest.recordedLiveEvidence.conversionGoalGraph.biddingActionIds, ["7694360837", "7694360840"]);
  assert.equal(manifest.recordedLiveEvidence.allCampaignsPaused, true);
  assert.equal(manifest.recordedLiveEvidence.spendCad, 0);
  assert.ok(!manifest.blockers.includes("OFFLINE_UPLOADER_MIGRATION"));
  assert.ok(manifest.blockers.includes("PURCHASE_UPLOAD_CLICKS_OBSERVED"));
  assert.ok(manifest.blockers.includes("QUOTE_WON_UPLOAD_CLICKS_OBSERVED"));
  assert.ok(!manifest.blockers.includes("PROMOTION_ELIGIBILITY"));
  assert.ok(!manifest.blockers.includes("RSA_POLICY_APPROVAL"));
  assert.ok(!manifest.blockers.includes("QUOTE_WON_UPLOAD_CLICKS_ACTION"));
  assert.ok(!manifest.blockers.includes("QUALIFIED_CALL_ACTION"));
  // Competitor stays retired; Core's 14 groups, including Vehicle Decals, are the candidates.
  assert.equal(manifest.launchCandidates.length, 14);
  // 1 -> 13: the 12 retired Competitor groups join the 1 held Brand group.
  assert.equal(manifest.heldGroups.length, 13);
  assert.equal(manifest.heldGroups.filter((group) => group.tier === "HOLD_AUCTION_INSIGHTS").length, 1);
  assert.equal(manifest.heldGroups.filter((group) => group.tier === "RETIRED_THIN_VOLUME").length, 12);
  assert.ok(manifest.launchCandidates.every((group) => group.targetStatus === "ENABLED"));
  assert.ok(manifest.heldGroups.every((group) => group.targetStatus === "PAUSED"));
});

test("exports canonical Editor campaign, RSA, and location entities", () => {
  const artifacts = buildArtifacts(clone());
  const campaigns = parseCsv(artifacts["campaigns.csv"]);
  assert.ok(campaigns.headers.includes("Networks"));
  assert.ok(campaigns.rows.every((row) => row.Networks === "Google Search"));
  for (const unsupported of ["Google Search", "Search partners", "Display Network", "Location option", "Location", "Location criterion ID"]) {
    assert.ok(!campaigns.headers.includes(unsupported));
  }
  // Competitor joined Brand on the paused side when it was retired 2026-08-09, so the exported
  // Editor artifacts must carry PAUSED for both — importing this CSV must never re-enable it.
  const PAUSED_IN_ARTIFACTS = new Set(["GOOG_Search_TC_BrandDefense_2026", "GOOG_Search_TC_CompetitorConquest_2026"]);
  const expectedCampaignStatus = (name) => PAUSED_IN_ARTIFACTS.has(name) ? "PAUSED" : "ENABLED";
  assert.ok(campaigns.rows.every((row) => row.Status === expectedCampaignStatus(row.Campaign)));
  assert.equal(campaigns.rows.find((row) => row.Campaign === "GOOG_Search_TC_CoreProducts_2026").Budget, "21");
  assert.equal(campaigns.rows.find((row) => row.Campaign === "GOOG_Search_TC_CoreProducts_2026")["Maximum CPC bid limit"], "5");
  assert.ok(campaigns.rows.every((row) => row["Start date"] === "2026-08-03" && row["End date"] === "2026-09-17"));
  const adGroups = parseCsv(artifacts["ad-groups.csv"]);
  assert.ok(adGroups.rows.every((row) => row.Status === expectedCampaignStatus(row.Campaign)));
  assert.ok(parseCsv(artifacts["keywords.csv"]).rows.every((row) => row.Status === expectedCampaignStatus(row.Campaign)));
  const ads = parseCsv(artifacts["responsive-search-ads.csv"]);
  assert.ok(ads.headers.includes("Type"));
  assert.ok(!ads.headers.includes("Ad type"));
  assert.ok(ads.rows.every((row) => row.Type === "Responsive search ad"));
  assert.ok(ads.rows.every((row) => row.Status === expectedCampaignStatus(row.Campaign)));
  const locations = parseCsv(artifacts["locations.csv"]);
  assert.deepEqual(locations.headers, ["Campaign", "Location", "Location ID", "Radius", "Unit"]);
  assert.equal(locations.rows.length, 3);
  assert.ok(locations.rows.every((row) => row["Location ID"] === "1002791"));
  assert.ok(locations.rows.every((row) => row.Radius === "35" && row.Unit === "km"));
});

test("exports negatives with canonical scope types and never as positive keywords", () => {
  const artifacts = buildArtifacts(clone());
  const negatives = parseCsv(artifacts["campaign-negatives.csv"]);
  assert.deepEqual(negatives.headers, ["Campaign", "Ad group", "Keyword", "Type"]);
  assert.ok(negatives.rows.some((row) => row.Type === "Negative" && row["Ad group"]));
  assert.ok(negatives.rows.some((row) => row.Type === "Campaign negative" && !row["Ad group"]));
  assert.ok(negatives.rows.every((row) => !Object.hasOwn(row, "Status") && ["Negative", "Campaign negative"].includes(row.Type)));
  const positives = parseCsv(artifacts["keywords.csv"]);
  assert.deepEqual(positives.headers, ["Campaign", "Ad group", "Keyword", "Type", "Status", "Final URL"]);
  assert.ok(positives.rows.every((row) => ["Exact", "Phrase"].includes(row.Type)));
  assert.equal(positives.rows.filter((row) => row.Campaign === "GOOG_Search_TC_CompetitorConquest_2026").length, 14);
  assert.ok(positives.rows.filter((row) => row.Campaign === "GOOG_Search_TC_CompetitorConquest_2026").every((row) => row.Type === "Exact"));
});

test("generated readiness summary records the verified paused account while retaining launch gates", () => {
  const summary = JSON.parse(buildArtifacts(clone())["validation-summary.json"]);
  assert.equal(summary.editorSupportedEntitiesImportReady, true);
  assert.equal(summary.editorImportTargetEncoded, false);
  assert.equal(summary.targetAccountPreflightRequired, true);
  assert.equal(summary.presenceOnlyCsvConfigured, false);
  assert.equal(summary.presenceOnlyStatus, "API_VERIFIED_2026-07-23_ACCOUNT_PREVIEW_REQUIRED");
  assert.equal(summary.accountPreviewRequired, true);
  assert.equal(summary.generatorAutoRollsDates, false);
  assert.deepEqual(summary.recordedLiveEvidence.counts, { campaigns: 3, adGroups: 19, positiveKeywords: 83, negativeCriteria: 189, responsiveSearchAds: 19, manualAssets: 13, campaignAssetLinks: 39 });
  assert.deepEqual(summary.recordedLiveEvidence.geoTarget.center, { latitude: 52.129728, longitude: -106.659637 });
  assert.equal(summary.recordedLiveEvidence.geoTarget.radiusKm, 35);
  assert.equal(summary.recordedLiveEvidence.allCampaignsPaused, true);
  assert.equal(summary.recordedLiveEvidence.spendCad, 0);
  assert.deepEqual(summary.recordedLiveEvidence.cpcCeilingCadByCampaignKind, { CORE: 4, COMPETITOR: 2.5, BRAND: 1.5 });
  assert.equal(summary.manualAdAssetsConfigured, true);
  assert.equal(summary.conversionFirstLaunchTiersConfigured, true);
});

test("rejects removed or added Core ad groups", () => {
  for (const mutate of [
    (c) => { c.campaigns.find((x) => x.kind === "CORE").adGroups.pop(); },
    (c) => { c.campaigns.find((x) => x.kind === "CORE").adGroups.push({ ...structuredClone(c.campaigns[0].adGroups[0]), key: "unknown-core" }); },
    (c) => { c.campaigns.find((x) => x.kind === "CORE").adGroups.at(-1).key = "coroplast"; c.campaigns[0].adGroups.at(-1).finalUrl = "https://truecolorprinting.ca/products/coroplast-signs"; },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("rejects incomplete brand structure and non-homepage routing", () => {
  for (const mutate of [
    (c) => { c.campaigns.find((x) => x.kind === "BRAND").adGroups[0].finalUrl = "https://truecolorprinting.ca/about"; },
    (c) => { c.campaigns.find((x) => x.kind === "BRAND").adGroups[0].keywords = c.campaigns[2].adGroups[0].keywords.filter((k) => k.text !== "true colour printing"); },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("rejects missing or replaced competitor targets", () => {
  for (const mutate of [
    (c) => { c.campaigns.find((x) => x.kind === "COMPETITOR").adGroups.pop(); },
    (c) => { c.campaigns.find((x) => x.kind === "COMPETITOR").adGroups[0].keywords[0].text = "replacement printer"; },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("rejects protected and competitor terms in account-wide negatives", () => {
  for (const term of ["near me", "vistaprint"]) {
    const config = clone();
    config.accountNegatives.push({ text: term, matchType: "PHRASE" });
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("rejects invented factual claims and an unapproved RSA key", () => {
  for (const mutate of [
    (c) => { c.campaigns[0].adGroups[0].rsa.headlines[0] = "Coroplast From $1"; },
    // "rsa" and "rsaVariantB" are the only sanctioned ad payloads; anything else is unreviewed.
    (c) => { c.campaigns[0].adGroups[0].rsa2 = structuredClone(c.campaigns[0].adGroups[0].rsa); },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

// ── sourced-fact claim registry ─────────────────────────────────────────────
// These lock in the 2026-08-06 fix: the contract used to ban every digit from ad copy, which
// silently forced vague ads for months. The rule is now "numbers must be SOURCED", so these
// tests must keep both halves honest — invented numbers still fail, real ones now pass.

test("accepts sourced price claims in variant-B copy", () => {
  const config = clone();
  const group = config.campaigns[0].adGroups[0];
  group.rsaVariantB.headlines[0] = "Coroplast Signs From $25";
  assert.equal(validateConfig(config).localStatus, "VALIDATED");
});

test("rejects an unsourced number anywhere in variant-B copy", () => {
  for (const mutate of [
    (c) => { c.campaigns[0].adGroups[0].rsaVariantB.headlines[0] = "Coroplast Signs From $19"; },
    (c) => { c.campaigns[0].adGroups[0].rsaVariantB.descriptions[0] = "Coroplast signs from $17 today."; },
    (c) => { c.adAssets.callouts[0] = "Signs From $12"; },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("guarantees stay banned even when the rest of the claim is sourced", () => {
  const config = clone();
  config.campaigns[0].adGroups[0].rsaVariantB.headlines[0] = "Guaranteed Signs From $25";
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("turnaround claims require an attached price or condition", () => {
  const bare = clone();
  bare.campaigns[0].adGroups[0].rsaVariantB.headlines[0] = "Same Day Printing";
  assert.equal(validateConfig(bare).localStatus, "INVALID");

  const qualified = clone();
  qualified.campaigns[0].adGroups[0].rsaVariantB.headlines[0] = "Same Day Printing +$40";
  assert.equal(validateConfig(qualified).localStatus, "VALIDATED");
});

test("legacy variant-A wording stays exempt but the exemption never reaches variant B", () => {
  // Variant A ships "Rush Options Available" and is live + policy-approved, so it must validate.
  assert.equal(validateConfig(clone()).localStatus, "VALIDATED");
  const leaked = clone();
  leaked.campaigns[0].adGroups[0].rsaVariantB.headlines[0] = "Rush Options Available";
  assert.equal(validateConfig(leaked).localStatus, "INVALID");
});

// ── relevance floor for new copy ────────────────────────────────────────────

test("variant B must carry at least one sourced price headline", () => {
  const config = clone();
  const group = config.campaigns[0].adGroups[0];
  group.rsaVariantB.headlines = group.rsaVariantB.headlines
    .map((headline) => (/\$/.test(headline) ? headline.replaceAll(/\s*(?:From\s*)?\+?\$[\d.]+(?:\/sqft)?/g, "") : headline))
    .map((headline, index) => (headline.trim() || `Filler Headline ${"I".repeat(index + 1)}`));
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("variant B may not reuse more than five headlines across ad groups", () => {
  const config = clone();
  const [first, second] = config.campaigns[0].adGroups;
  // Copy six of the first group's headlines into the second: exceeds the shared cap that keeps
  // Ad Relevance from collapsing the way variant A's 10 shared headlines did.
  for (let index = 0; index < 6; index += 1) second.rsaVariantB.headlines[index] = first.rsaVariantB.headlines[index];
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("every ad group must have an rsaVariantB — including Competitor and Brand", () => {
  // The structural guarantee that a new ad group can never ship vague, number-free copy.
  for (const campaignIndex of [0, 1, 2]) {
    const config = clone();
    delete config.campaigns[campaignIndex].adGroups[0].rsaVariantB;
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("Competitor variant B may share one payload but still may not name a competitor", () => {
  const config = clone();
  const competitor = config.campaigns.find((campaign) => campaign.kind === "COMPETITOR");
  // Nine groups deliberately share one payload — the shared-headline cap is Core-only.
  assert.equal(validateConfig(config).localStatus, "VALIDATED");
  competitor.adGroups[0].rsaVariantB = {
    ...competitor.adGroups[0].rsaVariantB,
    headlines: ["Beat Vistaprint Prices", ...competitor.adGroups[0].rsaVariantB.headlines.slice(1)],
  };
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("approvedClaims must stay the derived registry export", () => {
  const config = clone();
  config.approvedClaims = [...config.approvedClaims, { text: "$1", source: "made up" }];
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("rejects broken UTM source or medium", () => {
  for (const [from, to] of [["utm_source=google", "utm_source=bing"], ["utm_medium=cpc", "utm_medium=paid"]]) {
    const config = clone();
    config.tracking.finalUrlSuffix = config.tracking.finalUrlSuffix.replace(from, to);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("requires the Wilkie and Dubois launch-control declaration", () => {
  const config = clone();
  delete config.launchControls;
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("rejects a non-CAD account currency", () => {
  const config = clone();
  config.currency = "USD";
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("rejects an invented same-day guarantee", () => {
  const config = clone();
  config.campaigns[0].adGroups[0].rsa.headlines[0] = "Guaranteed Same Day";
  assert.equal(validateConfig(config).localStatus, "INVALID");
});

test("locks Core keyword and cross-negative contracts", () => {
  for (const mutate of [
    (c) => { c.campaigns[0].adGroups[0].keywords = c.campaigns[0].adGroups[0].keywords.filter((keyword) => keyword.matchType === "PHRASE"); },
    (c) => { c.campaigns[0].adGroups[0].crossNegatives = []; },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("rejects language, tracking mapping, and naming contract violations", () => {
  const mutations = [
    (c) => { c.campaigns[0].language = "French"; },
    (c) => { c.tracking.finalUrlSuffix = c.tracking.finalUrlSuffix.replace("device={device}", "device={keyword}"); },
    (c) => { c.campaigns[0].adGroups[1].name = c.campaigns[0].adGroups[0].name; },
    (c) => { c.campaigns[0].adGroups[0].name = " "; },
  ];
  for (const mutate of mutations) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("requires explicit date-change and advanced-geo preview controls", () => {
  const canonical = clone();
  assert.equal(canonical.pilot.generatorAutoRollsDates, false);
  assert.equal(canonical.pilot.dateChangeRequiresApprovedContractChange, true);
  assert.equal(canonical.launchControls.presenceOnlyManualOrApiRequired, true);
  assert.equal(canonical.launchControls.editorPreviewRequired, true);
  for (const mutate of [
    (c) => { delete c.pilot.generatorAutoRollsDates; },
    (c) => { delete c.launchControls.presenceOnlyManualOrApiRequired; },
    (c) => { c.externalGates = c.externalGates.filter((gate) => gate.code !== "PRESENCE_ONLY_AND_EDITOR_PREVIEW"); },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

// ── 2026-08-10 Generic Sign Shop destination repoint ────────────────────────────────────────────

test("Generic Sign Shop routes to the exact tracked paid landing page and ships variant B alone", () => {
  const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
  const group = core.adGroups.find((item) => item.key === "generic-sign-shop");
  assert.equal(group.finalUrl, "https://truecolorprinting.ca/why-true-color?source=google-ads");
  // The legacy variant-A ad points at the retired destination and is PAUSED by the swap, so the
  // contract must stop declaring it — otherwise EXPECTED_TOTAL_RESPONSIVE_SEARCH_ADS over-counts.
  assert.equal("rsa" in group, false);
  assert.ok(group.rsaVariantB);
  // /sign-company-saskatoon must NOT disappear from the repo — it stays live for organic. It is
  // simply no longer an ad destination.
  const destinations = paidSearchConfig.campaigns.flatMap((c) => c.adGroups.map((g) => g.finalUrl));
  assert.equal(destinations.some((url) => url.includes("/sign-company-saskatoon")), false);
});

test("Generic Print Price routes to the exact tracked paid landing page and ships byte-identical variant B alone", () => {
  const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
  const group = core.adGroups.find((item) => item.key === "generic-print-price");
  assert.equal(group.finalUrl, "https://truecolorprinting.ca/why-true-color?source=google-ads");
  assert.equal("rsa" in group, false);
  assert.ok(group.rsaVariantB);
  assert.deepEqual(group.rsaVariantB.headlines.slice(0, 10), [
    "Signs From $25, Cards $45",
    "Printing Prices Saskatoon",
    "Banners From $66",
    "Flyers From $45",
    "See Exact Prices Online",
    "No Quote Needed",
    "Real Prices, Not Estimates",
    "Price It Yourself Online",
    "Print Shop Saskatoon",
    "Printing Services Saskatoon",
  ]);
  assert.equal(group.rsaVariantB.descriptions[0], "Signs from $25, 250 cards $45, banners from $66. Every price is online.");
});

test("page-backed product expansion routes proven searches and blocks apparel and vehicle leakage", () => {
  const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
  const vehicle = core.adGroups.find((group) => group.key === "vehicle-decals");
  const stickers = core.adGroups.find((group) => group.key === "stickers-labels");
  const decals = core.adGroups.find((group) => group.key === "decals");
  const cards = core.adGroups.find((group) => group.key === "business-cards");
  const posters = core.adGroups.find((group) => group.key === "photo-posters");
  const keywordTexts = (group) => [...new Set(group.keywords.map(({ text }) => text))];

  assert.equal(vehicle.finalUrl, "https://truecolorprinting.ca/vehicle-decals-saskatoon");
  assert.equal("rsa" in vehicle, false);
  assert.ok(vehicle.rsaVariantB);
  assert.deepEqual(keywordTexts(vehicle), [
    "car stickers near me",
    "custom car stickers",
    "vehicle stickers custom",
    "custom car advertising stickers",
    "rv vinyl decals",
    "car window decals canada",
    "car decals saskatoon",
  ]);
  assert.ok(["car", "vehicle", "rv"].every((term) => stickers.crossNegatives.includes(term)));
  assert.ok(["car", "vehicle", "rv"].every((term) => decals.crossNegatives.includes(term)));
  assert.ok([
    "same day business cards printing",
    "business card price list",
    "business card printer",
  ].every((term) => keywordTexts(cards).includes(term)));
  assert.ok([
    "poster printing saskatoon",
    "big poster printing",
  ].every((term) => keywordTexts(posters).includes(term)));
  assert.deepEqual(
    paidSearchConfig.accountNegatives.filter(({ text }) => text === "shirts").map(({ matchType }) => matchType),
    ["EXACT", "PHRASE"],
  );
});

test("a Core group on the paid landing page must carry the exact tracked href", () => {
  for (const mutate of [
    // Right path, missing the tracking query — this is what silently escapes the live verifier.
    (c) => {
      const group = c.campaigns[0].adGroups.find((g) => g.key === "generic-print-price");
      group.finalUrl = "https://truecolorprinting.ca/why-true-color";
    },
    // Query present but altered.
    (c) => {
      const group = c.campaigns[0].adGroups.find((g) => g.key === "generic-print-price");
      group.finalUrl = "https://truecolorprinting.ca/why-true-color?source=paid";
    },
    // A DIFFERENT Core group sneaking onto the paid landing page without declaring it.
    (c) => {
      const group = c.campaigns[0].adGroups.find((g) => g.key === "large-format");
      group.finalUrl = "https://truecolorprinting.ca/why-true-color?source=google-ads";
    },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
});

test("Core ads sharing the /why-true-color destination cannot break the competitor binding", () => {
  // The competitor destination check filters by CAMPAIGN, and pins each allowlisted ad by resource
  // name and ad id — never by URL. A Core ad at the same URL therefore has no way to collide. This
  // test exists so that stays true: it is the only thing standing between the repoint and a false
  // "competitor target is shared outside its allowlisted association" failure.
  const live = makeLaunchedLiveState();
  assert.deepEqual(evaluateLaunchedLiveState(live).failures, []);

  const withCoreAdAtSameUrl = structuredClone(live);
  withCoreAdAtSameUrl.accountWideAdAssociations.push({
    campaignId: "24048123058",
    campaignResourceName: "customers/1072816342/campaigns/24048123058",
    campaignName: "GOOG_Search_TC_CoreProducts_2026",
    adGroupId: "1111111111",
    adGroupResourceName: "customers/1072816342/adGroups/1111111111",
    adGroupName: "Generic Sign Shop",
    adGroupAdResourceName: "customers/1072816342/adGroupAds/1111111111~2222222222",
    status: "ENABLED",
    adId: "2222222222",
    adResourceName: "customers/1072816342/ads/2222222222",
    finalUrls: [COMPETITOR_DESTINATION_BINDING.finalUrl],
  });
  assert.deepEqual(evaluateLaunchedLiveState(withCoreAdAtSameUrl).failures, []);

  // Contrast: an extra ad at that URL INSIDE the competitor campaign is still checked, so the
  // guard has not been weakened — only correctly scoped.
  const withCompetitorStray = structuredClone(live);
  withCompetitorStray.competitorRsaDestinations.push({
    ...structuredClone(withCompetitorStray.competitorRsaDestinations[0]),
    adGroupAdResourceName: "customers/1072816342/adGroupAds/3333333333~4444444444",
    adId: "4444444444",
    adResourceName: "customers/1072816342/ads/4444444444",
    finalUrls: ["https://truecolorprinting.ca/"],
  });
  assert.ok(evaluateLaunchedLiveState(withCompetitorStray).failures.length > 0);
});

// ── replace-stale-price-ads: URL-aware classification + the variant-A destination exception ─────

const OLD_SIGN_URL = "https://truecolorprinting.ca/sign-company-saskatoon";

// Rebuild the pre-repoint shape of the group so the fixtures describe what is ACTUALLY live today:
// a legacy variant A and a contract-copy variant B, both still pointing at the retired page.
const legacySignShopVariantA = {
  headlines: [
    "Saskatoon Sign Shop", "Custom Signs Saskatoon", "Explore Local Sign Options",
    "Order Printing Online", "Exact Prices Online", "Local Saskatoon Pickup",
    "Rush Options Available", "Upload Your Artwork", "Configure Your Order",
    "Saskatoon Print Shop", "Clear Online Pricing", "Print Locally in Saskatoon",
    "Rated 4.9 From 43 Reviews",
  ],
  descriptions: [
    "Configure signs online, see exact pricing, and submit your order online.",
    "Choose local Saskatoon pickup and upload your artwork with your order.",
    "Rush options are available. Review your configuration and price before ordering.",
    "Work with a Saskatoon print shop rated 4.9 from 43 Google reviews.",
  ],
};

const contractIndexWithLegacySignShopA = () => {
  const core = structuredClone(paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE"));
  core.adGroups.find((group) => group.key === "generic-sign-shop").rsa = legacySignShopVariantA;
  return buildCoreContractIndex(core);
};

const liveAd = ({ groupId, groupName, adId, status = "ENABLED", ad, finalUrls, approval = "APPROVED", review = "REVIEWED" }) => ({
  groupId,
  groupName,
  groupResource: `customers/1072816342/adGroups/${groupId}`,
  adId,
  adResource: `customers/1072816342/ads/${adId}`,
  status,
  approval,
  review,
  finalUrls,
  urlFp: fingerprintDestinations(finalUrls),
  fp: fingerprintCopy(ad.headlines, ad.descriptions),
  sample: [],
});

const signShopContractB = () => paidSearchConfig.campaigns
  .find((campaign) => campaign.kind === "CORE").adGroups
  .find((group) => group.key === "generic-sign-shop").rsaVariantB;

test("same copy at a superseded destination classifies STALE, and variant A stays nameable", () => {
  const index = contractIndexWithLegacySignShopA();
  const [legacyA, oldB] = classifyLiveCoreAds([
    liveAd({ groupId: "100", groupName: "Generic Sign Shop", adId: "1", ad: legacySignShopVariantA, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: "Generic Sign Shop", adId: "2", ad: signShopContractB(), finalUrls: [OLD_SIGN_URL] }),
  ], index);

  // Byte-identical CONTRACT copy — under the old copy-only rule this read as "already current" and
  // the tool reported nothing to do. Destination is part of the ad now.
  assert.equal(oldB.kind, "STALE");
  // Variant A is matched on copy alone, so it is still recognised as the control arm even though
  // the contract has moved the destination out from under it.
  assert.equal(legacyA.kind, "VARIANT_A_STALE_URL");
});

test("variant A at the contract destination is never classified stale (copy-only case unchanged)", () => {
  const core = structuredClone(paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE"));
  const coroplast = core.adGroups.find((group) => group.key === "coroplast");
  const index = buildCoreContractIndex(core);

  const classified = classifyLiveCoreAds([
    liveAd({ groupId: "200", groupName: coroplast.name, adId: "10", ad: coroplast.rsa, finalUrls: [coroplast.finalUrl] }),
    liveAd({ groupId: "200", groupName: coroplast.name, adId: "11", ad: coroplast.rsaVariantB, finalUrls: [coroplast.finalUrl] }),
    liveAd({
      groupId: "200",
      groupName: coroplast.name,
      adId: "12",
      ad: { headlines: coroplast.rsaVariantB.headlines, descriptions: ["In-house designer, $35 flat, same-day proof.", "b", "c", "d"] },
      finalUrls: [coroplast.finalUrl],
    }),
  ], index);

  assert.deepEqual(classified.map((ad) => ad.kind), ["VARIANT_A", "VARIANT_B_CURRENT", "STALE"]);

  // The copy-only swap retires the drifted ad ONLY. The control arm keeps serving, exactly as it
  // did before URL-awareness existed — this is the regression guard on the documented exception.
  const paused = classified.map((ad) => (ad.adId === "11" ? { ...ad, status: "PAUSED" } : ad));
  const { ready } = planDestinationSwap(paused);
  assert.equal(ready.length, 1);
  assert.equal(ready[0].destinationChanged, false);
  assert.deepEqual(ready[0].retire.map((ad) => ad.adId), ["12"]);
});

test("a destination change retires BOTH old ads in the group, in one atomic mutate", () => {
  const index = contractIndexWithLegacySignShopA();
  const NEW_SIGN_URL = "https://truecolorprinting.ca/why-true-color?source=google-ads";
  const before = [
    liveAd({ groupId: "100", groupName: "Generic Sign Shop", adId: "1", ad: legacySignShopVariantA, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: "Generic Sign Shop", adId: "2", ad: signShopContractB(), finalUrls: [OLD_SIGN_URL] }),
  ];

  // Phase 1 — --create plans exactly one new ad for the group, at the new destination.
  const { todo } = planReplacementCreates(classifyLiveCoreAds(before, index));
  assert.equal(todo.length, 1);
  assert.equal(todo[0].groupName, "Generic Sign Shop");
  assert.equal(todo[0].contract.finalUrl, NEW_SIGN_URL);

  // Between the phases nothing is swappable: the replacement exists but is still PAUSED and
  // unreviewed, so the old ads keep serving. This is the transient state the live verifier flags.
  const underReview = classifyLiveCoreAds([...before, liveAd({
    groupId: "100", groupName: "Generic Sign Shop", adId: "3", status: "PAUSED",
    ad: signShopContractB(), finalUrls: [NEW_SIGN_URL],
    approval: "UNKNOWN", review: "REVIEW_IN_PROGRESS",
  })], index);
  assert.equal(planDestinationSwap(underReview).ready.length, 0);
  assert.equal(planDestinationSwap(underReview).waiting.length, 1);
  // --create is idempotent across the wait: the group already has its replacement.
  assert.equal(planReplacementCreates(underReview).todo.length, 0);

  // Phase 2 — once APPROVED/REVIEWED, the swap enables the replacement and pauses BOTH old ads.
  const approved = classifyLiveCoreAds([...before, liveAd({
    groupId: "100", groupName: "Generic Sign Shop", adId: "3", status: "PAUSED",
    ad: signShopContractB(), finalUrls: [NEW_SIGN_URL],
  })], index);
  const { ready } = planDestinationSwap(approved);
  assert.equal(ready.length, 1);
  assert.equal(ready[0].destinationChanged, true);
  assert.deepEqual(ready[0].retire.map((ad) => ad.adId).sort(), ["1", "2"]);

  // One mutate, three operations: enable the new ad, pause the old B, pause the legacy A. Leaving
  // the legacy A enabled would split the group across two landing pages and void the experiment.
  const operations = buildSwapOperations(ready);
  assert.equal(operations.length, 3);
  assert.equal(operations.filter((op) => op.update.status === "ENABLED").length, 1);
  assert.equal(operations.filter((op) => op.update.status === "PAUSED").length, 2);
  // Pause only — this tool has no code path that rewrites an existing ad.
  assert.ok(operations.every((op) => op.updateMask === "status"));
});

test("the replacement tool fails closed on a contract that still quotes a retired design price", () => {
  const core = structuredClone(paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE"));
  assert.equal(findRetiredPriceInContract(buildCoreContractIndex(core)), null);
  core.adGroups[0].rsaVariantB.descriptions[3] = "In-house designer, $35 flat, same-day proof.";
  assert.equal(findRetiredPriceInContract(buildCoreContractIndex(core)), core.adGroups[0].name);
});

test("the destination exception fires even when the contract drops variant A in the same pass", () => {
  // This is the SHAPE THAT ACTUALLY SHIPS. The repoint removes `headlines` from the group (a
  // paused ad cannot also be counted as live contract inventory), so the legacy control arm reads
  // back as plain STALE. It must still be recognised as a destination change and retired.
  const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
  const group = core.adGroups.find((item) => item.key === "generic-sign-shop");
  const index = buildCoreContractIndex(core);

  const classified = classifyLiveCoreAds([
    liveAd({ groupId: "100", groupName: group.name, adId: "1", ad: legacySignShopVariantA, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: group.name, adId: "2", ad: group.rsaVariantB, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: group.name, adId: "3", status: "PAUSED", ad: group.rsaVariantB, finalUrls: [group.finalUrl] }),
  ], index);
  assert.deepEqual(classified.map((ad) => ad.kind), ["STALE", "STALE", "VARIANT_B_CURRENT"]);

  // Still exactly ONE create per group, never two.
  const beforeCreate = classified.slice(0, 2);
  assert.equal(planReplacementCreates(beforeCreate).todo.length, 1);
  assert.equal(planReplacementCreates(beforeCreate).skipped.length, 1);

  const { ready } = planDestinationSwap(classified);
  assert.equal(ready.length, 1);
  assert.equal(ready[0].destinationChanged, true);
  assert.deepEqual(ready[0].retire.map((ad) => ad.adId).sort(), ["1", "2"]);
  assert.equal(buildSwapOperations(ready).length, 3);
});

test("superseded ads left PAUSED are never re-replaced or re-retired", () => {
  // The account permanently carries paused superseded ads (12 from the 2026-08-09 price fix, 2 more
  // from this repoint). They are STALE forever by construction; neither phase may act on them.
  const core = paidSearchConfig.campaigns.find((campaign) => campaign.kind === "CORE");
  const group = core.adGroups.find((item) => item.key === "generic-sign-shop");
  const index = buildCoreContractIndex(core);
  const settled = classifyLiveCoreAds([
    liveAd({ groupId: "100", groupName: group.name, adId: "1", status: "PAUSED", ad: legacySignShopVariantA, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: group.name, adId: "2", status: "PAUSED", ad: group.rsaVariantB, finalUrls: [OLD_SIGN_URL] }),
    liveAd({ groupId: "100", groupName: group.name, adId: "3", ad: group.rsaVariantB, finalUrls: [group.finalUrl] }),
  ], index);
  assert.equal(planReplacementCreates(settled).todo.length, 0);
  assert.equal(planDestinationSwap(settled).ready.length, 0);
  assert.equal(planDestinationSwap(settled).waiting.length, 0);
});
