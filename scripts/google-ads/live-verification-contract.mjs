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

  const competitorLanding = live.endpointChecks?.find((check) => check.url.endsWith("/why-true-color"));
  if (competitorLanding?.status !== 200) launchBlockers.push(`competitor landing is HTTP ${competitorLanding?.status ?? "unknown"}`);
  else if (!competitorLanding.noindex) launchBlockers.push("competitor landing is missing noindex");
  if (live.rsaApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more RSAs are not policy-approved");
  if (live.assetApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more manual assets are not policy-approved");
  if (live.offlineUploaderVerification?.verified !== true
    || live.offlineUploaderVerification?.method !== OFFLINE_UPLOADER_CLEARANCE) {
    launchBlockers.push("offline conversion uploader requires a reconciled real transaction before launch");
  }
  return { failures, launchBlockers };
}
