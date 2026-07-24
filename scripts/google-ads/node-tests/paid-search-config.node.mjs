import assert from "node:assert/strict";
import test from "node:test";

import { paidSearchConfig } from "../../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "../config-validator.mjs";
import { buildArtifacts } from "../export-google-ads.mjs";
import { evaluateLaunchCandidate } from "../validate-launch-candidate.mjs";
import {
  classifyAppliedIncentive,
  COMPETITOR_DESTINATION_BINDING,
  exactAccountSpendCad,
  evaluatePausedLiveState,
  liveVerificationStatus,
  withoutLoginCustomerHeader,
} from "../live-verification-contract.mjs";
import { COMPETITOR_RSA_REVIEW } from "../request-competitor-rsa-review.mjs";

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
  assert.equal(ready.candidates.length, 15);
  assert.equal(ready.held.length, 4);
});

test("live verification contract rejects launch-critical drift and missing noindex", () => {
  // Fixture-only IDs exercise the contract; they are not True Color account IDs.
  const live = {
    account: { id: "1072816342", currencyCode: "CAD", timeZone: "America/Regina" },
    spendScope: "EXACT_ACCOUNT_TOTAL",
    campaigns: paidSearchConfig.campaigns.map((campaign) => ({
      id: paidSearchConfig.liveGoogleAds.campaignIds[campaign.name],
      name: campaign.name,
      status: "PAUSED",
      channel: "SEARCH",
      dailyBudgetCad: campaign.dailyBudgetCad,
      cpcCeilingCad: paidSearchConfig.bidding.cpcCeilingCadByCampaignKind[campaign.kind],
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
    adGroups: 19, pausedAdGroups: 19, positiveKeywords: 83, negativeCriteria: 189,
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
      status: "PAUSED",
    }))),
    competitorMatchTypes: ["EXACT"], responsiveSearchAds: 19, pausedResponsiveSearchAds: 19,
    competitorRsaDestinations: COMPETITOR_RSA_REVIEW.ads.map((ad) => ({
      campaignId: COMPETITOR_RSA_REVIEW.campaign.id,
      campaignResourceName: COMPETITOR_RSA_REVIEW.campaign.resourceName,
      campaignName: COMPETITOR_RSA_REVIEW.campaign.name,
      adGroupId: ad.adGroupId,
      adGroupResourceName: ad.adGroupResourceName,
      adGroupName: ad.adGroupName,
      adGroupAdResourceName: ad.adGroupAdResourceName,
      status: "PAUSED",
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
      status: "PAUSED",
      adId: ad.adId,
      adResourceName: ad.adResourceName,
      finalUrls: [COMPETITOR_DESTINATION_BINDING.finalUrl],
    })),
    rsaApprovalStatuses: ["APPROVED"], manualAssets: 13, assetApprovalStatuses: ["APPROVED"], campaignAssetLinks: 39,
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
  };
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
    (value) => { value.nearMeKeywords[0].status = "ENABLED"; },
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
    "offline conversion uploader requires a reconciled real transaction before launch",
  ]);
  assert.equal(liveVerificationStatus(evaluatePausedLiveState(uploaderUnverified)), "BLOCKED");

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
      "QUALIFIED_CALL_ACTION",
      "COMPETITOR_LANDING_DEPLOYED",
      "CURRENT_KEYWORD_PLANNER_FORECAST",
      "BUDGET_APPROVAL",
    ],
  );
  assert.deepEqual(
    paidSearchConfig.externalGates.filter((gate) => gate.status === "BLOCKED").map((gate) => gate.code).slice(0, 4),
    ["OFFLINE_UPLOADER_MIGRATION", "PURCHASE_UPLOAD_CLICKS_OBSERVED", "QUOTE_WON_UPLOAD_CLICKS_OBSERVED", "PROMOTION_ELIGIBILITY"],
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

test("rejects enabled campaigns and unsafe network, match, geo, budget, and date settings", () => {
  const mutations = [
    (c) => { c.campaigns[0].status = "ENABLED"; },
    (c) => { c.campaigns[0].networks.display = true; },
    (c) => { c.campaigns[0].geoTarget.presenceOnly = false; },
    (c) => { c.campaigns[0].geoTarget.radiusKm = 50; },
    (c) => { c.campaigns[0].geoTarget.center.longitude = 0; },
    (c) => { c.campaigns[0].adGroups[0].keywords[0].matchType = "BROAD"; },
    (c) => { c.campaigns[0].adGroups[0].keywords = []; },
    (c) => { c.campaigns[0].dailyBudgetCad = 9; },
    (c) => { c.pilot.endDate = "2026-09-18"; },
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
    (c) => { c.campaigns[1].adGroups[0].rsa.headlines[0] = "Qwik Signs Alternative"; },
    (c) => { c.campaigns[1].adGroups[0].rsa.path1 = "qwik-signs"; },
    (c) => { c.campaigns[0].adGroups[0].rsa.headlines = ["Too few headlines"]; },
    (c) => { c.campaigns[0].adGroups[0].rsa.descriptions[0] = "x".repeat(91); },
    (c) => { c.tracking.finalUrlSuffix = c.tracking.finalUrlSuffix.replace("keyword={keyword}&", ""); },
    (c) => { c.bidding.cpcCeilingCadByCampaignKind.CORE = 6; },
    (c) => { c.campaigns[0].adGroups[0].launchTier = "TIER_2_EXPANSION"; },
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

  assert.equal(core.dailyBudgetCad, 8);
  assert.equal(core.maximumPilotCad, 480);
  assert.equal(competitors.dailyBudgetCad, 2);
  assert.equal(competitors.maximumPilotCad, 120);
  assert.equal(brand.dailyBudgetCad, 3);
  assert.equal(brand.maximumPilotCad, 0);
  assert.equal(paidSearchConfig.targetQualifyingSpendCad, 600);
  assert.equal(paidSearchConfig.maximumPilotCad, 650);
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
  assert.deepEqual(paidSearchConfig.spendControls, { scope: "EXACT_ACCOUNT_TOTAL", warningCad: 500, protectivePauseCad: 625, absoluteCapCad: 650, monitorCadenceMinutes: 15 });
  assert.deepEqual(paidSearchConfig.controlledTest, {
    campaign: "GOOG_Search_TC_CoreProducts_2026",
    adGroupKey: "coroplast",
    dailyBudgetCad: 5,
    protectivePauseCad: 25,
    absoluteCapCad: 30,
    maximumWindowHours: 72,
  });
  assert.equal(competitors.adGroups.length, 9);
  assert.equal(competitors.adGroups.flatMap((group) => group.keywords).length, 9);
  assert.ok(competitors.adGroups.every((group) => group.keywords.every((keyword) => keyword.matchType === "EXACT")));
  assert.equal(competitors.adGroups.find((group) => group.key === "ink-house").keywords[0].text, "ink house saskatoon");
  assert.equal(competitors.adGroups.find((group) => group.key === "rayacom").keywords[0].text, "rayacom saskatoon");
  assert.deepEqual(paidSearchConfig.bidding.cpcCeilingCadByCampaignKind, { CORE: 4, COMPETITOR: 2.5, BRAND: 1.5 });
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
  assert.equal(manifest.recordedLiveEvidence.validatedAt, "2026-07-23");
  assert.equal(manifest.recordedLiveEvidence.counts.positiveKeywords, 83);
  assert.deepEqual(manifest.recordedLiveEvidence.geoTarget.center, { latitude: 52.129728, longitude: -106.659637 });
  assert.deepEqual(manifest.recordedLiveEvidence.conversionGoalGraph.biddingActionIds, ["7694360837", "7694360840"]);
  assert.equal(manifest.recordedLiveEvidence.allCampaignsPaused, true);
  assert.equal(manifest.recordedLiveEvidence.spendCad, 0);
  assert.ok(manifest.blockers.includes("OFFLINE_UPLOADER_MIGRATION"));
  assert.ok(manifest.blockers.includes("PURCHASE_UPLOAD_CLICKS_OBSERVED"));
  assert.ok(manifest.blockers.includes("QUOTE_WON_UPLOAD_CLICKS_OBSERVED"));
  assert.ok(manifest.blockers.includes("PROMOTION_ELIGIBILITY"));
  assert.ok(manifest.blockers.includes("RSA_POLICY_APPROVAL"));
  assert.ok(!manifest.blockers.includes("QUOTE_WON_UPLOAD_CLICKS_ACTION"));
  assert.ok(!manifest.blockers.includes("QUALIFIED_CALL_ACTION"));
  assert.equal(manifest.launchCandidates.length, 15);
  assert.equal(manifest.heldGroups.length, 4);
  assert.ok(manifest.heldGroups.every((group) => ["TIER_2_EXPANSION", "HOLD_AUCTION_INSIGHTS"].includes(group.tier)));
});

test("exports canonical Editor campaign, RSA, and location entities", () => {
  const artifacts = buildArtifacts(clone());
  const campaigns = parseCsv(artifacts["campaigns.csv"]);
  assert.ok(campaigns.headers.includes("Networks"));
  assert.ok(campaigns.rows.every((row) => row.Networks === "Google Search"));
  for (const unsupported of ["Google Search", "Search partners", "Display Network", "Location option", "Location", "Location criterion ID"]) {
    assert.ok(!campaigns.headers.includes(unsupported));
  }
  const ads = parseCsv(artifacts["responsive-search-ads.csv"]);
  assert.ok(ads.headers.includes("Type"));
  assert.ok(!ads.headers.includes("Ad type"));
  assert.ok(ads.rows.every((row) => row.Type === "Responsive search ad"));
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
  assert.equal(positives.rows.filter((row) => row.Campaign === "GOOG_Search_TC_CompetitorConquest_2026").length, 9);
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

test("rejects invented factual claims and a second RSA payload", () => {
  for (const mutate of [
    (c) => { c.campaigns[0].adGroups[0].rsa.headlines[0] = "Coroplast From $1"; },
    (c) => { c.campaigns[0].adGroups[0].rsa2 = structuredClone(c.campaigns[0].adGroups[0].rsa); },
  ]) {
    const config = clone();
    mutate(config);
    assert.equal(validateConfig(config).localStatus, "INVALID");
  }
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
