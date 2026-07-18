const EXPECTED_CAMPAIGNS = {
  GOOG_Search_TC_CoreProducts_2026: { id: "24048123058", budget: 40, ceiling: 4 },
  GOOG_Search_TC_CompetitorConquest_2026: { id: "24048123061", budget: 7, ceiling: 2.5 },
  GOOG_Search_TC_BrandDefense_2026: { id: "24048123064", budget: 3, ceiling: 1.5 },
};
const EXPECTED_SUFFIX = "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}";

export function evaluatePausedLiveState(live) {
  const failures = [];
  const campaigns = live.campaigns ?? [];
  if (campaigns.length !== 3) failures.push("exactly three campaigns are required");
  for (const [name, expected] of Object.entries(EXPECTED_CAMPAIGNS)) {
    const campaign = campaigns.find((item) => item.name === name);
    if (!campaign || campaign.id !== expected.id) failures.push(`${name} identity changed`);
    if (!campaign || campaign.status !== "PAUSED" || campaign.channel !== "SEARCH") failures.push(`${name} is not paused Search`);
    if (!campaign || campaign.dailyBudgetCad !== expected.budget || campaign.cpcCeilingCad !== expected.ceiling) failures.push(`${name} budget or CPC ceiling changed`);
    if (!campaign || campaign.startDate !== "2026-07-20" || campaign.endDate !== "2026-08-18") failures.push(`${name} pilot dates changed`);
    if (!campaign || campaign.presence !== "PRESENCE" || !campaign.networks?.targetGoogleSearch || campaign.networks?.targetSearchNetwork || campaign.networks?.targetContentNetwork || campaign.networks?.targetPartnerSearchNetwork) failures.push(`${name} network or presence setting changed`);
    if (campaign?.finalUrlSuffix !== EXPECTED_SUFFIX) failures.push(`${name} final URL suffix changed`);
  }
  if (live.adGroups !== 19 || live.pausedAdGroups !== 19) failures.push("all 19 ad groups must remain paused");
  if (live.responsiveSearchAds !== 19 || live.pausedResponsiveSearchAds !== 19) failures.push("all 19 RSAs must remain paused");
  if (live.positiveKeywords !== 71 || live.negativeCriteria !== 189) failures.push("keyword counts changed");
  if (live.competitorMatchTypes?.length !== 1 || live.competitorMatchTypes[0] !== "EXACT") failures.push("competitor targeting is not exact-only");
  if (live.manualAssets !== 13 || live.campaignAssetLinks !== 39) failures.push("asset counts changed");
  if (live.locationTargets !== 3 || live.saskatoonLocationTargets !== 3) failures.push("Saskatoon location criteria changed");
  if (live.languageTargets !== 3 || live.englishLanguageTargets !== 3) failures.push("English language criteria changed");
  if (live.purchaseConversion?.id !== "7689029977"
    || live.purchaseConversion.status !== "ENABLED"
    || live.purchaseConversion.category !== "PURCHASE"
    || live.purchaseConversion.primaryForGoal !== true
    || live.purchaseConversion.included !== true
    || live.purchaseConversion.currency !== "CAD"
    || live.purchaseConversion.dynamicValue !== true
    || live.purchaseConversion.destination !== "AW-18330693756/F1pQCNmStdIcEPzg4KRE") failures.push("purchase conversion changed");
  if (live.spendCadPilot !== 0) failures.push("nonzero pilot-period spend detected");

  const launchBlockers = [];
  const competitorLanding = live.endpointChecks?.find((check) => check.url.endsWith("/why-true-color"));
  if (competitorLanding?.status !== 200) launchBlockers.push(`competitor landing is HTTP ${competitorLanding?.status ?? "unknown"}`);
  else if (!competitorLanding.noindex) launchBlockers.push("competitor landing is missing noindex");
  if (live.rsaApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more RSAs are not policy-approved");
  if (live.assetApprovalStatuses?.some((status) => status !== "APPROVED")) launchBlockers.push("one or more manual assets are not policy-approved");
  return { failures, launchBlockers };
}
