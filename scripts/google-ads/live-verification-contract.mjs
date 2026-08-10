import { COMPETITOR_RSA_REVIEW } from "./request-competitor-rsa-review.mjs";

// Budgets/ceilings track the CURRENT staged values (Core raised to CA$21 + ceiling CA$5 on
// 2026-08-07) — a rollback pause does not revert budgets or bids, so the paused map must match.
export const PAUSED_EXPECTED_CAMPAIGNS = Object.freeze({
  GOOG_Search_TC_CoreProducts_2026: Object.freeze({ id: "24048123058", budget: 21, ceiling: 5, status: "PAUSED" }),
  GOOG_Search_TC_CompetitorConquest_2026: Object.freeze({ id: "24048123061", budget: 4, ceiling: 2.5, status: "PAUSED" }),
  GOOG_Search_TC_BrandDefense_2026: Object.freeze({ id: "24048123064", budget: 3, ceiling: 1.5, status: "PAUSED" }),
});
// Stage 1 launch = Core + Competitor enabled, Brand held paused (2026-08-03 PM owner decision).
// Brand contributes the single paused ad group and RSA in the launched counts below.
export const LAUNCHED_EXPECTED_CAMPAIGNS = Object.freeze({
  GOOG_Search_TC_CoreProducts_2026: Object.freeze({ id: "24048123058", budget: 21, ceiling: 5, status: "ENABLED" }),
  // 2026-08-09 RETIRED: zero impressions across the pilot resolved the 2026-08-12 gate to its
  // documented pause branch. Budget/ceiling stay staged so drift in them is still detected.
  GOOG_Search_TC_CompetitorConquest_2026: Object.freeze({ id: "24048123061", budget: 4, ceiling: 2.5, status: "PAUSED" }),
  GOOG_Search_TC_BrandDefense_2026: Object.freeze({ id: "24048123064", budget: 3, ceiling: 1.5, status: "PAUSED" }),
});
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
export const OFFLINE_UPLOADER_CLEARANCE = "REAL_TRANSACTION_RECONCILED";
export const OFFLINE_UPLOADER_LAUNCH_BLOCKER =
  "offline conversion uploader requires a reconciled real transaction before launch";
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

export function liveVerificationStatus({ failures, launchBlockers, mode = "paused" }) {
  if (mode !== "paused" && mode !== "launched") throw new Error(`Unsupported live verification mode: ${mode}`);
  if (failures.length > 0) return "UNSAFE";
  if (launchBlockers.length > 0) return "BLOCKED";
  return mode === "paused" ? "VALIDATED_PAUSED" : "VALIDATED_LAUNCHED";
}

export function controlledTestLaunchBlockers(launchBlockers) {
  if (!Array.isArray(launchBlockers)) {
    throw new Error("Controlled-test launch blockers must be an array");
  }
  return launchBlockers.filter(
    (blocker) => blocker !== OFFLINE_UPLOADER_LAUNCH_BLOCKER,
  );
}

export function validateCompetitorDestinationInventory(
  inventory,
  accountWideAssociations = inventory,
  { expectedStatus = "PAUSED" } = {},
) {
  // The nine allowlisted variant-A ads are pinned by resource name and must each still be
  // present and undrifted. Since 2026-08-06 each competitor group also carries a variant-B ad,
  // so the inventory is a superset — every EXTRA competitor ad is checked below against the same
  // tracked destination. Widening the count alone would have left the new ads unvalidated.
  if (!Array.isArray(inventory)
    || inventory.length < COMPETITOR_RSA_REVIEW.ads.length) {
    throw new Error("Competitor destination inventory must contain at least the nine allowlisted ads");
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
      || ad.status !== expectedStatus
      || !Array.isArray(ad.finalUrls)
      || ad.finalUrls.length !== 1
      || ad.finalUrls[0] !== COMPETITOR_DESTINATION_BINDING.finalUrl) {
      throw new Error(`Competitor destination drifted: ${expected.adGroupName}`);
    }
    return ad;
  });

  // Every competitor ad OUTSIDE the pinned allowlist (the variant-B additions) must still sit in
  // the competitor campaign, carry the exact tracked destination, and match the expected status.
  // Without this, a second ad in a conquest group could point anywhere at all.
  const allowlisted = new Set(COMPETITOR_RSA_REVIEW.ads.map((expected) => expected.adGroupAdResourceName));
  for (const ad of inventory) {
    if (allowlisted.has(ad?.adGroupAdResourceName)) continue;
    if (String(ad?.campaignId ?? "") !== COMPETITOR_RSA_REVIEW.campaign.id
      || ad?.status !== expectedStatus
      || !Array.isArray(ad?.finalUrls)
      || ad.finalUrls.length !== 1
      || ad.finalUrls[0] !== COMPETITOR_DESTINATION_BINDING.finalUrl) {
      throw new Error(`Additional competitor ad drifted from the tracked destination: ${ad?.adGroupName ?? ad?.adGroupAdResourceName ?? "unknown"}`);
    }
  }
  return validated;
}

// 20 ad groups x variant A + variant B = 40. Variant B is mandatory on every group, so this
// count moves only when the ad-group inventory does. Independently asserted here rather than
// imported from the contract on purpose: the checker must be able to disagree with the config,
// or it stops being a check.
// 2026-08-06 boat split: 44 -> 45. The new Boat Registration Decals Core group ships
// variant B only (no legacy variant A to preserve), so the inventory grows by exactly one ad.
const EXPECTED_TOTAL_RESPONSIVE_SEARCH_ADS = 46;
// 2026-08-09: replace-stale-price-ads.mjs swapped 12 Core RSAs that quoted the retired $35 design
// price for contract-correct $40 copy. Google RSA text is immutable, so every "edit" is a new ad,
// and --swap PAUSES the superseded ad rather than removing it — the reversible choice.
//
// Counted EXPLICITLY, not folded into the total, so it stays visible and reversible. The ENABLED
// count is unchanged at 23 Core; all 12 of these are PAUSED and quote a price the shop no longer
// charges. Remove them from the account and this constant returns to 0 in the same pass — that is
// the only end state that matches the contract exactly, and it is deliberately an owner decision.
const SUPERSEDED_COPY_RSAS_PAUSED = 12;

function evaluateLiveState(live, {
  expectedCampaigns,
  expectedPausedAdGroups,
  expectedPausedResponsiveSearchAds,
  expectedEnabledAdGroups,
  expectedEnabledResponsiveSearchAds,
  campaignStateFailure,
  adGroupStateFailure,
  rsaStateFailure,
  nearMeStateFailure,
  // Split 2026-08-09. One "non-Brand" status stopped being expressible when Competitor was
  // retired: Core children must stay ENABLED while Competitor children must be PAUSED. Collapsing
  // them back into one knob would silently stop checking one of the two.
  expectedCoreChildStatus,
  expectedCompetitorChildStatus,
  // Ads superseded by a copy replacement and left PAUSED. Defaults to 0 so any mode that does not
  // opt in keeps asserting the pure contract inventory.
  supersededCopyRsas = 0,
  requireExactCampaignInventory,
  requireZeroSpend,
}) {
  const failures = [];
  const launchBlockers = [];
  if (String(live.account?.id ?? "") !== "1072816342"
    || live.account?.currencyCode !== "CAD"
    || live.account?.timeZone !== "America/Regina") failures.push("live verifier is not reading the exact True Color CAD account");
  if (live.spendScope !== "EXACT_ACCOUNT_TOTAL") failures.push("live spend verification is not exact-account-wide");
  const campaigns = live.campaigns ?? [];
  if (campaigns.length !== 3) failures.push("exactly three campaigns are required");
  for (const [name, expected] of Object.entries(expectedCampaigns)) {
    const campaign = campaigns.find((item) => item.name === name);
    if (!campaign || campaign.id !== expected.id) failures.push(`${name} identity changed`);
    if (!campaign || campaign.status !== expected.status || campaign.channel !== "SEARCH") failures.push(`${name} ${campaignStateFailure}`);
    if (!campaign || campaign.dailyBudgetCad !== expected.budget || campaign.cpcCeilingCad !== expected.ceiling) failures.push(`${name} budget or CPC ceiling changed`);
    if (!campaign || campaign.startDate !== "2026-07-20" || campaign.endDate !== "2026-09-17") failures.push(`${name} pilot dates changed`);
    if (!campaign || campaign.presence !== "PRESENCE" || !campaign.networks?.targetGoogleSearch || campaign.networks?.targetSearchNetwork || campaign.networks?.targetContentNetwork || campaign.networks?.targetPartnerSearchNetwork) failures.push(`${name} network or presence setting changed`);
    if (campaign?.finalUrlSuffix !== EXPECTED_SUFFIX) failures.push(`${name} final URL suffix changed`);
  }
  // 2026-08-07 photo-poster split: 25 -> 26 ad groups. Photo printing terms route to the
  // dedicated photo-poster landing page instead of Generic Print Price.
  if (live.adGroups !== 26
    || live.pausedAdGroups !== expectedPausedAdGroups
    || (expectedEnabledAdGroups !== null && live.enabledAdGroups !== expectedEnabledAdGroups)) failures.push(adGroupStateFailure);
  // 2026-08-06 variant-B copy rollout: 20 -> 30 RSAs. Ten Core ad groups gain a second,
  // price-anchored RSA beside the live policy-approved variant A. Reports drift until
  // apply-sync lands, which is the intended import-completion signal, not a fault.
  // Superseded-copy ads are added to the expected TOTAL and to the expected PAUSED count, never to
  // the enabled count — a superseded ad that reads back ENABLED is drift and must still fail.
  if (live.responsiveSearchAds !== EXPECTED_TOTAL_RESPONSIVE_SEARCH_ADS + supersededCopyRsas
    || live.pausedResponsiveSearchAds !== expectedPausedResponsiveSearchAds
    || (expectedEnabledResponsiveSearchAds !== null
      && live.enabledResponsiveSearchAds !== expectedEnabledResponsiveSearchAds)) failures.push(rsaStateFailure);
  try {
    validateCompetitorDestinationInventory(
      live.competitorRsaDestinations,
      live.accountWideAdAssociations,
      { expectedStatus: expectedCompetitorChildStatus },
    );
  } catch {
    failures.push("competitor RSA destinations must match the exact nine-ad tracked-URL allowlist");
  }
  // 2026-08-05 Phase 1 keyword expansion: 83 -> 121 positive, 189 -> 229 negative criteria.
  // 2026-08-06 first search-term harvest: 121 -> 143 positive (11 mined terms x EXACT+PHRASE),
  // 229 -> 253 negative (t shirt / tshirt / london drugs / photo lab x EXACT+PHRASE x 3 campaigns).
  // Reports drift until apply-sync lands, which is the intended import-completion signal.
  // 2026-08-06 second harvest: +1 Core group (Decals -> /products/window-decals) and +3
  // Competitor groups (Print Baron, Mister Print, Labels Made Easy) plus "vista print".
  // 143 -> 159 positive, 253 -> 262 negative, 20 -> 24 ad groups, 40 -> 44 ads.
  // 2026-08-06 boat split: positives UNCHANGED at 159 — the new Boat group's 2 terms x
  // EXACT+PHRASE (+4) exactly offset the same 2 terms leaving Decals (-4). Negatives
  // 262 -> 269: the Boat group's 6 cross-negatives, plus "boat" added to Decals.
  //
  // ⚠ TWO STEPS, NOT ONE. apply-sync is create-only by design (see gaql-read.mjs — mutation
  // authority is split three ways and none of them deletes). It will ADD the 4 Boat keywords
  // but will NOT REMOVE the same 4 from Decals, which are live today. Between apply-sync and
  // the manual removal the account sits at 163 positives and the same query can serve from two
  // ad groups with different destinations. Verified live 2026-08-06:
  //   [EXACT|PHRASE] "custom boat decals"  -> Decals
  //   [EXACT|PHRASE] "boat decals near me" -> Decals
  // Remove those four in the Google Ads UI right after apply-sync. Until then this line
  // reporting drift is correct and expected — it is the removal reminder.
  // 2026-08-07: negativeCriteria 269 -> 281. Added account negatives "canvas" and
  // "shirt printing" (2 negatives x EXACT+PHRASE x 3 campaigns).
  // 2026-08-07 owner correction/mining pass: negativeCriteria 281 -> 287. Added only
  // "3d printer" as an account negative; kept signs/sticker/staples/photo terms as legitimate demand.
  // 2026-08-07 routing fix: positiveKeywords 159 -> 164 and negativeCriteria 287 -> 292.
  // Added a Photo Posters ad group for photo-printing demand and added "staples saskatoon printing"
  // to the Staples conquest group so it routes to /why-true-color instead of Generic Print Price.
  // 2026-08-10 search-term audit: negativeCriteria 292 -> 372, positiveKeywords UNCHANGED at 164
  // (this pass adds negatives only). Two tiers:
  //   +72 account negatives — 12 new terms x EXACT+PHRASE x 3 campaigns. "staples", "rayacom",
  //       "art print", "book binding", and "invitation" were audited and held out; the first two
  //       are blocked by the PROTECTED_ACCOUNT_NEGATIVES guard and the last three are real
  //       capability. Rationale lives in campaign-config.mjs beside the terms.
  //   +8 ad-group cross-negatives — eight product terms on Generic Print Price only, so a query
  //       naming a specific product routes to that product's group instead of the price-index page.
  // Current composition: 282 account-negative criteria + 76 ad-group cross-negatives + 14 campaign negatives.
  if (live.positiveKeywords !== 164 || live.negativeCriteria !== 372) failures.push("keyword counts changed");
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
      || keyword.status !== expectedCoreChildStatus)) failures.push(nearMeStateFailure);
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
    || Object.keys(expectedCampaigns).some((campaign) => !positiveGeoCriteria.some((criterion) => criterion.campaign === campaign))) {
    failures.push("positive geo criteria must be exactly one 35 km Saskatoon proximity per planned campaign");
  }
  if (live.languageTargets !== 3 || live.englishLanguageTargets !== 3) failures.push("English language criteria changed");
  const expectedIds = new Set(Object.values(expectedCampaigns).map((campaign) => campaign.id));
  const allCampaigns = live.allCampaigns ?? [];
  if (requireExactCampaignInventory) {
    if (allCampaigns.length !== 3
      || Object.entries(expectedCampaigns).some(([name, expected]) => !allCampaigns.some((campaign) => String(campaign.id) === expected.id
        && campaign.name === name
        && campaign.status === expected.status))) failures.push("full account campaign inventory must contain exactly the three Stage 1 campaigns in their approved statuses");
  } else {
    if ([...expectedIds].some((id) => !allCampaigns.some((campaign) => String(campaign.id) === id))) failures.push("full account campaign inventory did not contain every planned campaign");
    const unexpectedEnabled = allCampaigns.filter((campaign) => campaign.status === "ENABLED" && !expectedIds.has(String(campaign.id)));
    if (unexpectedEnabled.length > 0) failures.push(`unexpected enabled campaign(s): ${unexpectedEnabled.map((campaign) => `${campaign.id}:${campaign.name}`).join(",")}`);
  }
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
    || Object.keys(expectedCampaigns).some((campaign) => !campaignCallGoals.some((goal) => goal.campaign === campaign))) {
    failures.push("every planned campaign qualified-call goal must remain non-biddable");
  }
  const biddableCampaignGoals = (live.campaignConversionGoals ?? [])
    .filter((goal) => goal.biddable === true);
  if (biddableCampaignGoals.length !== 3
    || biddableCampaignGoals.some((goal) => goal.category !== "PURCHASE" || goal.origin !== "WEBSITE")
    || new Set(biddableCampaignGoals.map((goal) => goal.campaign)).size !== 3
    || Object.keys(expectedCampaigns).some((campaign) => !biddableCampaignGoals.some((goal) => goal.campaign === campaign))) {
    failures.push("purchase website must be the only biddable goal for every planned campaign");
  }
  const campaignGoalConfigs = live.campaignGoalConfigs ?? [];
  if (campaignGoalConfigs.length !== 3
    || campaignGoalConfigs.some((config) => config.goalConfigLevel !== "CUSTOMER" || config.customConversionGoal)
    || new Set(campaignGoalConfigs.map((config) => config.campaign)).size !== 3
    || Object.keys(expectedCampaigns).some((campaign) => !campaignGoalConfigs.some((config) => config.campaign === campaign))
    || (live.customConversionGoals ?? []).length !== 0) {
    failures.push("planned campaigns must inherit customer goals without custom conversion goals");
  }

  if (requireZeroSpend && live.spendCadPilot !== 0) failures.push("nonzero pilot-period spend detected");

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
    launchBlockers.push(OFFLINE_UPLOADER_LAUNCH_BLOCKER);
  }
  if (live.promotion?.verified !== true
    || !PROMOTION_CLEARANCES.has(live.promotion?.method)) {
    launchBlockers.push("Google Ads promotion eligibility requires fresh UI or applied-incentive API confirmation");
  }
  return { failures, launchBlockers };
}

export function evaluatePausedLiveState(live) {
  return evaluateLiveState(live, {
    expectedCampaigns: PAUSED_EXPECTED_CAMPAIGNS,
    expectedPausedAdGroups: 1,
    expectedPausedResponsiveSearchAds: 2,
    expectedEnabledAdGroups: null,
    expectedEnabledResponsiveSearchAds: null,
    campaignStateFailure: "is not paused Search",
    adGroupStateFailure: "25 staged ad groups must be enabled and the held Brand ad group paused",
    rsaStateFailure: "44 staged RSAs must be enabled and both held Brand RSAs paused",
    nearMeStateFailure: "all 12 GSC-backed near-me keywords must remain present and staged enabled",
    // Paused mode describes the PRE-LAUNCH staging state, where every non-Brand child was staged
    // ENABLED beneath paused campaigns. It is the rollback reference and is deliberately left at
    // that historical shape; the 2026-08-09 retirement changes launched mode only.
    expectedCoreChildStatus: "ENABLED",
    expectedCompetitorChildStatus: "ENABLED",
    requireExactCampaignInventory: false,
    requireZeroSpend: true,
  });
}

export function evaluateLaunchedLiveState(live) {
  return evaluateLiveState(live, {
    expectedCampaigns: LAUNCHED_EXPECTED_CAMPAIGNS,
    // 2026-08-07 photo-poster routing split gave Core a 13th ad group and 23rd RSA.
    // 2026-08-09 Competitor retirement: enabled is now Core alone (13 groups / 23 RSAs), and
    // paused is the 12 retired Competitor groups + the 1 held Brand group (13), plus their
    // 21 Competitor RSAs + 2 Brand RSAs (23).
    expectedPausedAdGroups: 13,
    // 23 contract-paused (21 retired Competitor + 2 held Brand) + 12 superseded Core copy ads.
    expectedPausedResponsiveSearchAds: 23 + SUPERSEDED_COPY_RSAS_PAUSED,
    expectedEnabledAdGroups: 13,
    expectedEnabledResponsiveSearchAds: 23,
    supersededCopyRsas: SUPERSEDED_COPY_RSAS_PAUSED,
    campaignStateFailure: "is not in its approved Stage 1 launch state",
    adGroupStateFailure: "13 Core ad groups must be enabled and the 12 retired Competitor groups plus the held Brand group paused",
    rsaStateFailure: "23 Core RSAs must be enabled and the 21 retired Competitor RSAs plus both held Brand RSAs paused",
    nearMeStateFailure: "all 12 GSC-backed near-me keywords must remain present and enabled",
    expectedCoreChildStatus: "ENABLED",
    expectedCompetitorChildStatus: "PAUSED",
    requireExactCampaignInventory: true,
    requireZeroSpend: false,
  });
}
