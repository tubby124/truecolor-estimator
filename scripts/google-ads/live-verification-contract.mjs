import { COMPETITOR_RSA_REVIEW } from "./request-competitor-rsa-review.mjs";

const EXPECTED_CAMPAIGNS = {
  GOOG_Search_TC_CoreProducts_2026: { id: "24048123058", budget: 8, ceiling: 4 },
  GOOG_Search_TC_CompetitorConquest_2026: { id: "24048123061", budget: 2, ceiling: 2.5 },
  GOOG_Search_TC_BrandDefense_2026: { id: "24048123064", budget: 3, ceiling: 1.5 },
};
const EXPECTED_SUFFIX = "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}";
const EXPECTED_GEO_POINT = {
  latitudeInMicroDegrees: 52_129_728,
  longitudeInMicroDegrees: -106_659_637,
};
const EXPECTED_NEAR_ME_TERMS = [
  "die cut stickers near me",
  "custom die cut stickers near me",
  "custom stickers near me",
  "custom labels near me",
  "die cut labels near me",
  "custom die cut labels near me",
];
const HISTORICAL_BROWSER_PURCHASE_ACTION_ID = "7689029977";
const OFFLINE_UPLOADER_CLEARANCE = "REAL_TRANSACTION_RECONCILED";
const QUALIFIED_CALL_ASSET_ID = "394889103183";
const PROMOTION_CLEARANCES = new Set([
  "UI_CONFIRMED_ACTIVE",
  "API_APPLIED_INCENTIVE_REDEEMED",
]);
export const API_PROMOTION_CLEARANCE = "API_APPLIED_INCENTIVE_REDEEMED";
export const COMPETITOR_DESTINATION_BINDING = Object.freeze({
  finalUrl: COMPETITOR_RSA_REVIEW.proposedFinalUrl,
  landingMarker: COMPETITOR_RSA_REVIEW.landingMarker,
  adGroupAdResources: Object.freeze(
    COMPETITOR_RSA_REVIEW.ads.map((ad) => ad.adGroupAdResourceName),
  ),
});

export function withoutLoginCustomerHeader(headers) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    throw new Error("Google Ads headers must be an object");
  }
  const directHeaders = { ...headers };
  delete directHeaders["login-customer-id"];
  return directHeaders;
}

export function classifyAppliedIncentive(incentives, {
  customerId,
  now = new Date(),
} = {}) {
  if (!Array.isArray(incentives)) throw new Error("Applied incentives must be an array");
  if (typeof customerId !== "string" || !/^\d+$/.test(customerId)) {
    throw new Error("Applied incentive customer ID is invalid");
  }
  const nowMs = now instanceof Date ? now.getTime() : Number.NaN;
  if (!Number.isFinite(nowMs)) throw new Error("Applied incentive verification time is invalid");

  const verified = incentives.find((incentive) => {
    const expiration = parseGoogleAdsUtcDateTime(incentive?.fulfillmentExpirationDateTime);
    return incentive?.incentiveState === "REDEEMED"
      && incentive.resourceName?.startsWith(`customers/${customerId}/appliedIncentives/`)
      && incentive.currencyCode === "CAD"
      && Number(incentive.rewardAmountMicros) === 600_000_000
      && Number(incentive.requiredMinSpendMicros) === 600_000_000
      && Number.isFinite(expiration)
      && expiration > nowMs;
  });

  return {
    verified: Boolean(verified),
    method: verified ? API_PROMOTION_CLEARANCE : null,
    appliedIncentives: incentives.map((incentive) => ({
      incentiveState: incentive?.incentiveState ?? null,
      fulfillmentExpirationDateTime: incentive?.fulfillmentExpirationDateTime ?? null,
      currencyCode: incentive?.currencyCode ?? null,
      rewardAmountMicros: incentive?.rewardAmountMicros ?? null,
      requiredMinSpendMicros: incentive?.requiredMinSpendMicros ?? null,
      currentSpendTowardsFulfillmentMicros: incentive?.currentSpendTowardsFulfillmentMicros ?? null,
    })),
  };
}

export function exactAccountSpendCad(spendRows, { customerId } = {}) {
  if (!Array.isArray(spendRows) || spendRows.length !== 1) {
    throw new Error("Exactly one account-wide spend row is required");
  }
  if (typeof customerId !== "string" || !/^\d+$/.test(customerId)) {
    throw new Error("Spend customer ID is invalid");
  }
  const [row] = spendRows;
  if (String(row?.customer?.id ?? "") !== customerId) {
    throw new Error("Spend row belongs to the wrong Google Ads customer");
  }
  const micros = row?.metrics?.costMicros;
  if (typeof micros !== "string" || !/^\d+$/.test(micros)) {
    throw new Error("Account spend micros must be a non-negative integer string");
  }
  const parsed = BigInt(micros);
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Account spend micros exceed the exact numeric range");
  }
  return Number(parsed) / 1_000_000;
}

function parseGoogleAdsUtcDateTime(value) {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  const normalized = value.trim().replace(" ", "T");
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  return new Date(timestamp).getTime();
}
const validRevenueAction = (action, eventName) => action
  && action.eventName === eventName
  && typeof action.id === "string"
  && /^\d+$/.test(action.id)
  && action.status === "ENABLED"
  && action.type === "UPLOAD_CLICKS"
  && action.category === "PURCHASE"
  && action.primaryForGoal === true
  && action.included === true
  && action.currency === "CAD"
  && action.dynamicValue === true;

const validQualifiedCallAction = (action) => {
  const minimumDurationSeconds = Number(action?.minimumDurationSeconds);
  return action
    && typeof action.id === "string"
    && /^\d+$/.test(action.id)
    && action.status === "ENABLED"
    && ["AD_CALL", "WEBSITE_CALL", "UPLOAD_CALLS"].includes(action.type)
    && action.category === "PHONE_CALL_LEAD"
    && action.primaryForGoal === false
    && action.included === false
    && Number.isInteger(minimumDurationSeconds)
    && minimumDurationSeconds > 0;
};

export function liveVerificationStatus({ failures, launchBlockers }) {
  if (failures.length > 0) return "UNSAFE";
  if (launchBlockers.length > 0) return "BLOCKED";
  return "VALIDATED_PAUSED";
}

export function validateCompetitorDestinationInventory(
  inventory,
  accountWideAssociations = inventory,
) {
  if (!Array.isArray(inventory)
    || inventory.length !== COMPETITOR_RSA_REVIEW.ads.length) {
    throw new Error("Competitor destination inventory must contain the exact nine ads");
  }
  if (!Array.isArray(accountWideAssociations)
    || accountWideAssociations.length < inventory.length) {
    throw new Error("Account-wide ad association inventory is incomplete");
  }
  const validated = COMPETITOR_RSA_REVIEW.ads.map((expected) => {
    const accountWideMatches = accountWideAssociations.filter(
      (ad) => String(ad?.adId ?? "") === expected.adId
        || ad?.adResourceName === expected.adResourceName,
    );
    if (accountWideMatches.length !== 1
      || accountWideMatches[0]?.adGroupAdResourceName !== expected.adGroupAdResourceName) {
      throw new Error(`Competitor target is shared outside its allowlisted association: ${expected.adGroupName}`);
    }
    const matches = inventory.filter((ad) => ad?.adGroupAdResourceName === expected.adGroupAdResourceName
      || String(ad?.adId ?? "") === expected.adId
      || ad?.adResourceName === expected.adResourceName);
    if (matches.length !== 1) {
      throw new Error(`Competitor destination identity is missing, duplicated, or shared: ${expected.adGroupName}`);
    }
    const [ad] = matches;
    if (String(ad.campaignId ?? "") !== COMPETITOR_RSA_REVIEW.campaign.id
      || ad.campaignResourceName !== COMPETITOR_RSA_REVIEW.campaign.resourceName
      || ad.campaignName !== COMPETITOR_RSA_REVIEW.campaign.name
      || String(ad.adGroupId ?? "") !== expected.adGroupId
      || ad.adGroupResourceName !== expected.adGroupResourceName
      || ad.adGroupName !== expected.adGroupName
      || ad.adGroupAdResourceName !== expected.adGroupAdResourceName
      || String(ad.adId ?? "") !== expected.adId
      || ad.adResourceName !== expected.adResourceName
      || ad.status !== "PAUSED"
      || !Array.isArray(ad.finalUrls)
      || ad.finalUrls.length !== 1
      || ad.finalUrls[0] !== COMPETITOR_DESTINATION_BINDING.finalUrl) {
      throw new Error(`Competitor destination drifted: ${expected.adGroupName}`);
    }
    return ad;
  });
  return validated;
}

export function evaluatePausedLiveState(live) {
  const failures = [];
  const launchBlockers = [];
  if (String(live.account?.id ?? "") !== "1072816342"
    || live.account?.currencyCode !== "CAD"
    || live.account?.timeZone !== "America/Regina") failures.push("live verifier is not reading the exact True Color CAD account");
  if (live.spendScope !== "EXACT_ACCOUNT_TOTAL") failures.push("live spend verification is not exact-account-wide");
  const campaigns = live.campaigns ?? [];
  if (campaigns.length !== 3) failures.push("exactly three campaigns are required");
  for (const [name, expected] of Object.entries(EXPECTED_CAMPAIGNS)) {
    const campaign = campaigns.find((item) => item.name === name);
    if (!campaign || campaign.id !== expected.id) failures.push(`${name} identity changed`);
    if (!campaign || campaign.status !== "PAUSED" || campaign.channel !== "SEARCH") failures.push(`${name} is not paused Search`);
    if (!campaign || campaign.dailyBudgetCad !== expected.budget || campaign.cpcCeilingCad !== expected.ceiling) failures.push(`${name} budget or CPC ceiling changed`);
    if (!campaign || campaign.startDate !== "2026-07-20" || campaign.endDate !== "2026-09-17") failures.push(`${name} pilot dates changed`);
    if (!campaign || campaign.presence !== "PRESENCE" || !campaign.networks?.targetGoogleSearch || campaign.networks?.targetSearchNetwork || campaign.networks?.targetContentNetwork || campaign.networks?.targetPartnerSearchNetwork) failures.push(`${name} network or presence setting changed`);
    if (campaign?.finalUrlSuffix !== EXPECTED_SUFFIX) failures.push(`${name} final URL suffix changed`);
  }
  if (live.adGroups !== 19 || live.pausedAdGroups !== 19) failures.push("all 19 ad groups must remain paused");
  if (live.responsiveSearchAds !== 19 || live.pausedResponsiveSearchAds !== 19) failures.push("all 19 RSAs must remain paused");
  try {
    validateCompetitorDestinationInventory(
      live.competitorRsaDestinations,
      live.accountWideAdAssociations,
    );
  } catch {
    failures.push("competitor RSA destinations must match the exact nine-ad tracked-URL allowlist");
  }
  if (live.positiveKeywords !== 83 || live.negativeCriteria !== 189) failures.push("keyword counts changed");
  const expectedNearMeKeywords = new Set(EXPECTED_NEAR_ME_TERMS.flatMap((text) => [
    `${text}|EXACT`,
    `${text}|PHRASE`,
  ]));
  const nearMeKeywords = live.nearMeKeywords ?? [];
  const observedNearMeKeywords = new Set(nearMeKeywords.map((keyword) => `${keyword.text}|${keyword.matchType}`));
  if (nearMeKeywords.length !== 12
    || observedNearMeKeywords.size !== 12
    || [...expectedNearMeKeywords].some((keyword) => !observedNearMeKeywords.has(keyword))
    || nearMeKeywords.some((keyword) => keyword.campaign !== "GOOG_Search_TC_CoreProducts_2026"
      || keyword.adGroup !== "Stickers and Labels"
      || keyword.status !== "PAUSED")) failures.push("all 12 GSC-backed near-me keywords must remain present and paused");
  if (live.competitorMatchTypes?.length !== 1 || live.competitorMatchTypes[0] !== "EXACT") failures.push("competitor targeting is not exact-only");
  if (live.manualAssets !== 13 || live.campaignAssetLinks !== 39) failures.push("asset counts changed");
  if (live.locationTargets !== 0 || live.proximityTargets !== 3 || live.radius35KmTargets !== 3) failures.push("Saskatoon +35 km proximity criteria changed");
  const positiveGeoCriteria = live.positiveGeoCriteria ?? [];
  if (positiveGeoCriteria.length !== 3
    || positiveGeoCriteria.some((criterion) => criterion.type !== "PROXIMITY"
      || Number(criterion.radius) !== 35
      || criterion.radiusUnits !== "KILOMETERS"
      || Number(criterion.latitudeInMicroDegrees) !== EXPECTED_GEO_POINT.latitudeInMicroDegrees
      || Number(criterion.longitudeInMicroDegrees) !== EXPECTED_GEO_POINT.longitudeInMicroDegrees)
    || new Set(positiveGeoCriteria.map((criterion) => criterion.campaign)).size !== 3
    || Object.keys(EXPECTED_CAMPAIGNS).some((campaign) => !positiveGeoCriteria.some((criterion) => criterion.campaign === campaign))) {
    failures.push("positive geo criteria must be exactly one 35 km Saskatoon proximity per planned campaign");
  }
  if (live.languageTargets !== 3 || live.englishLanguageTargets !== 3) failures.push("English language criteria changed");
  const expectedIds = new Set(Object.values(EXPECTED_CAMPAIGNS).map((campaign) => campaign.id));
  const allCampaigns = live.allCampaigns ?? [];
  if ([...expectedIds].some((id) => !allCampaigns.some((campaign) => String(campaign.id) === id))) failures.push("full account campaign inventory did not contain every planned campaign");
  const unexpectedEnabled = allCampaigns.filter((campaign) => campaign.status === "ENABLED" && !expectedIds.has(String(campaign.id)));
  if (unexpectedEnabled.length > 0) failures.push(`unexpected enabled campaign(s): ${unexpectedEnabled.map((campaign) => `${campaign.id}:${campaign.name}`).join(",")}`);
  const purchaseRevenue = live.revenueConversions?.purchaseOnline;
  const quoteWonRevenue = live.revenueConversions?.quoteWon;
  const qualifiedCall = live.qualifiedCallConversion;
  const selections = live.conversionActionSelections ?? {
    purchaseOnline: { id: purchaseRevenue?.id },
    quoteWon: { id: quoteWonRevenue?.id },
    qualifiedCall: { id: qualifiedCall?.id },
  };
  const requireSelection = (key, envVar) => {
    const id = selections[key]?.id;
    if (!id) {
      launchBlockers.push(`${envVar} is missing; inspect the read-only conversionActionInventory and configure the owned-account action ID`);
      return false;
    }
    if (!/^\d+$/.test(id)) {
      launchBlockers.push(`${envVar} must be a numeric owned-account action ID`);
      return false;
    }
    return true;
  };
  const hasPurchaseSelection = requireSelection("purchaseOnline", "GOOGLE_ADS_PURCHASE_CONVERSION_ACTION_ID");
  const hasQuoteSelection = requireSelection("quoteWon", "GOOGLE_ADS_QUOTE_WON_CONVERSION_ACTION_ID");
  const hasCallSelection = requireSelection("qualifiedCall", "GOOGLE_ADS_QUALIFIED_CALL_CONVERSION_ACTION_ID");
  if (hasPurchaseSelection && !validRevenueAction(purchaseRevenue, "purchase_online")) failures.push("configured purchase_online UPLOAD_CLICKS conversion is missing from inventory or unsafe");
  if (hasQuoteSelection && !validRevenueAction(quoteWonRevenue, "quote_won")) failures.push("configured quote_won UPLOAD_CLICKS conversion is missing from inventory or unsafe");
  if (hasPurchaseSelection && hasQuoteSelection && purchaseRevenue?.id === quoteWonRevenue?.id) failures.push("purchase_online and quote_won must use distinct UPLOAD_CLICKS actions");
  if (hasCallSelection && !validQualifiedCallAction(qualifiedCall)) failures.push("configured duration-qualified call conversion is missing from inventory, primary, or included in bidding");
  if (hasCallSelection && [purchaseRevenue?.id, quoteWonRevenue?.id].filter(Boolean).includes(qualifiedCall?.id)) failures.push("qualified calls must use a distinct secondary action");
  if (hasCallSelection) {
    const callMeasurement = live.callMeasurement;
    const expectedCallAction =
      `customers/1072816342/conversionActions/${qualifiedCall?.id}`;
    const callAsset = callMeasurement?.asset;
    const customerCallLinks = callMeasurement?.customerLinks ?? [];
    if (callMeasurement?.accountSettings?.callReportingEnabled !== true
      || callMeasurement?.accountSettings?.callConversionReportingEnabled !== true) {
      failures.push("account call reporting and call-conversion reporting must both remain enabled");
    }
    if (!callAsset
      || callAsset.id !== QUALIFIED_CALL_ASSET_ID
      || callAsset.resourceName !== `customers/1072816342/assets/${QUALIFIED_CALL_ASSET_ID}`
      || callAsset.type !== "CALL"
      || callAsset.countryCode !== "CA"
      || callAsset.phoneNumber !== "(306) 954-8688"
      || callAsset.callConversionReportingState !== "USE_RESOURCE_LEVEL_CALL_CONVERSION_ACTION"
      || callAsset.callConversionAction !== expectedCallAction) {
      failures.push("True Color call asset is not wired to qualified_call_60s");
    }
    if (customerCallLinks.length !== 1
      || customerCallLinks[0]?.asset !== `customers/1072816342/assets/${QUALIFIED_CALL_ASSET_ID}`
      || customerCallLinks[0]?.fieldType !== "CALL"
      || customerCallLinks[0]?.status !== "ENABLED"
      || (callMeasurement?.campaignLinks ?? []).length !== 0
      || (callMeasurement?.adGroupLinks ?? []).length !== 0) {
      failures.push("qualified call asset link scope changed");
    }
    if (callAsset
      && (callAsset.approvalStatus !== "APPROVED"
        || callAsset.reviewStatus !== "REVIEWED")) {
      launchBlockers.push("qualified call asset is awaiting Google policy approval");
    }
  }
  const includedConversionActions = (live.conversionActionInventory ?? [])
    .filter((action) => action.included === true);
  const expectedIncludedConversionIds = new Set(
    [purchaseRevenue?.id, quoteWonRevenue?.id].filter(Boolean),
  );
  if (hasPurchaseSelection && hasQuoteSelection
    && (includedConversionActions.length !== 2
      || includedConversionActions.some((action) => !expectedIncludedConversionIds.has(action.id)))) {
    failures.push("purchase_online and quote_won must be the only included conversion actions");
  }
  const historicalBrowserPurchase = live.historicalBrowserPurchaseConversion;
  if (!historicalBrowserPurchase
    || historicalBrowserPurchase.id !== HISTORICAL_BROWSER_PURCHASE_ACTION_ID
    || historicalBrowserPurchase.name !== "Purchase - Website (True Color)"
    || historicalBrowserPurchase.status !== "ENABLED"
    || historicalBrowserPurchase.type !== "WEBPAGE"
    || historicalBrowserPurchase.category !== "PURCHASE"
    || historicalBrowserPurchase.primaryForGoal !== false
    || historicalBrowserPurchase.included !== false) {
    failures.push("historical browser purchase action must remain secondary and excluded");
  }
  const customerCallGoals = (live.customerConversionGoals ?? [])
    .filter((goal) => goal.category === "PHONE_CALL_LEAD" && goal.origin === "CALL_FROM_ADS");
  if (customerCallGoals.length !== 1 || customerCallGoals[0].biddable !== false) {
    failures.push("customer qualified-call goal must remain non-biddable");
  }
  const biddableCustomerGoals = (live.customerConversionGoals ?? [])
    .filter((goal) => goal.biddable === true);
  if (biddableCustomerGoals.length !== 1
    || biddableCustomerGoals[0].category !== "PURCHASE"
    || biddableCustomerGoals[0].origin !== "WEBSITE") {
    failures.push("purchase website must be the only biddable customer conversion goal");
  }
  const campaignCallGoals = (live.campaignConversionGoals ?? [])
    .filter((goal) => goal.category === "PHONE_CALL_LEAD" && goal.origin === "CALL_FROM_ADS");
  if (campaignCallGoals.length !== 3
    || campaignCallGoals.some((goal) => goal.biddable !== false)
    || new Set(campaignCallGoals.map((goal) => goal.campaign)).size !== 3
    || Object.keys(EXPECTED_CAMPAIGNS).some((campaign) => !campaignCallGoals.some((goal) => goal.campaign === campaign))) {
    failures.push("every planned campaign qualified-call goal must remain non-biddable");
  }
  const biddableCampaignGoals = (live.campaignConversionGoals ?? [])
    .filter((goal) => goal.biddable === true);
  if (biddableCampaignGoals.length !== 3
    || biddableCampaignGoals.some((goal) => goal.category !== "PURCHASE" || goal.origin !== "WEBSITE")
    || new Set(biddableCampaignGoals.map((goal) => goal.campaign)).size !== 3
    || Object.keys(EXPECTED_CAMPAIGNS).some((campaign) => !biddableCampaignGoals.some((goal) => goal.campaign === campaign))) {
    failures.push("purchase website must be the only biddable goal for every planned campaign");
  }
  const campaignGoalConfigs = live.campaignGoalConfigs ?? [];
  if (campaignGoalConfigs.length !== 3
    || campaignGoalConfigs.some((config) => config.goalConfigLevel !== "CUSTOMER" || config.customConversionGoal)
    || new Set(campaignGoalConfigs.map((config) => config.campaign)).size !== 3
    || Object.keys(EXPECTED_CAMPAIGNS).some((campaign) => !campaignGoalConfigs.some((config) => config.campaign === campaign))
    || (live.customConversionGoals ?? []).length !== 0) {
    failures.push("planned campaigns must inherit customer goals without custom conversion goals");
  }

  if (live.spendCadPilot !== 0) failures.push("nonzero pilot-period spend detected");

  const competitorLanding = live.endpointChecks?.find(
    (check) => check.requestedUrl === COMPETITOR_DESTINATION_BINDING.finalUrl,
  );
  if (competitorLanding?.finalUrl !== COMPETITOR_DESTINATION_BINDING.finalUrl) {
    launchBlockers.push("competitor landing redirected or resolved outside the exact tracked URL");
  } else if (competitorLanding.status !== 200) {
    launchBlockers.push(`competitor landing is HTTP ${competitorLanding.status ?? "unknown"}`);
  } else if (!String(competitorLanding.contentType ?? "").toLowerCase().startsWith("text/html")) {
    launchBlockers.push("competitor landing did not return HTML");
  } else if (competitorLanding.markerFound !== true) {
    launchBlockers.push("competitor landing is missing the paid-page marker");
  } else if (!competitorLanding.noindex) {
    launchBlockers.push("competitor landing is missing noindex");
  }
  if (live.rsaApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more RSAs are not policy-approved");
  if (live.assetApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more manual assets are not policy-approved");
  if (live.offlineUploaderVerification?.verified !== true
    || live.offlineUploaderVerification?.method !== OFFLINE_UPLOADER_CLEARANCE) {
    launchBlockers.push("offline conversion uploader requires a reconciled real transaction before launch");
  }
  if (live.promotion?.verified !== true
    || !PROMOTION_CLEARANCES.has(live.promotion?.method)) {
    launchBlockers.push("Google Ads promotion eligibility requires fresh UI or applied-incentive API confirmation");
  }
  return { failures, launchBlockers };
}
