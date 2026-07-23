import { localNow, parseHardStopOptions } from "./hard-stop-contract.mjs";

export const CONTROLLED_TEST = Object.freeze({
  customerId: "1072816342",
  loginCustomerId: "1125402990",
  timeZone: "America/Regina",
  campaign: Object.freeze({
    id: "24048123058",
    name: "GOOG_Search_TC_CoreProducts_2026",
    resourceName: "customers/1072816342/campaigns/24048123058",
    cpcBidCeilingMicros: "4000000",
  }),
  campaigns: Object.freeze([
    Object.freeze({
      id: "24048123058",
      name: "GOOG_Search_TC_CoreProducts_2026",
      resourceName: "customers/1072816342/campaigns/24048123058",
    }),
    Object.freeze({
      id: "24048123061",
      name: "GOOG_Search_TC_CompetitorConquest_2026",
      resourceName: "customers/1072816342/campaigns/24048123061",
    }),
    Object.freeze({
      id: "24048123064",
      name: "GOOG_Search_TC_BrandDefense_2026",
      resourceName: "customers/1072816342/campaigns/24048123064",
    }),
  ]),
  budget: Object.freeze({
    id: "15721292390",
    resourceName: "customers/1072816342/campaignBudgets/15721292390",
    controlledMicros: "5000000",
    normalMicros: "8000000",
  }),
  adGroup: Object.freeze({
    id: "197192347366",
    name: "Coroplast Signs",
    resourceName: "customers/1072816342/adGroups/197192347366",
  }),
  rsa: Object.freeze({
    id: "817302599484",
    resourceName: "customers/1072816342/adGroupAds/197192347366~817302599484",
    finalUrl: "https://truecolorprinting.ca/products/coroplast-signs",
  }),
  keywords: Object.freeze([
    Object.freeze({
      criterionId: "24802921",
      text: "coroplast signs",
      matchType: "PHRASE",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~24802921",
    }),
    Object.freeze({
      criterionId: "42733951",
      text: "coroplast signs",
      matchType: "EXACT",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~42733951",
    }),
    Object.freeze({
      criterionId: "5534459212",
      text: "coroplast sign printing",
      matchType: "EXACT",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~5534459212",
    }),
    Object.freeze({
      criterionId: "304715118377",
      text: "coroplast sign printing",
      matchType: "PHRASE",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~304715118377",
    }),
    Object.freeze({
      criterionId: "1966278005669",
      text: "coroplast signs saskatoon",
      matchType: "EXACT",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~1966278005669",
    }),
    Object.freeze({
      criterionId: "2478886532359",
      text: "coroplast signs saskatoon",
      matchType: "PHRASE",
      resourceName: "customers/1072816342/adGroupCriteria/197192347366~2478886532359",
    }),
  ]),
  monitor: Object.freeze({
    attestationVersion: 1,
    cadenceMinutes: 15,
    maximumAgeMinutes: 20,
    maximumFutureSkewMinutes: 2,
    requiredConsecutiveHeartbeats: 3,
    warningCad: 25,
    thresholdCad: 25,
    approvedCapCad: 30,
  }),
});

const RESOURCE_PREFIX = `customers/${CONTROLLED_TEST.customerId}/`;

export function parseControlledTestOptions(argv) {
  const options = {
    mode: "preflight",
    execute: false,
    monitorAttestationPath: null,
  };
  let modeSeen = false;
  for (const arg of argv) {
    if (["preflight", "activate", "rollback"].includes(arg)) {
      if (modeSeen) throw new Error("Specify exactly one mode: preflight, activate, or rollback");
      options.mode = arg;
      modeSeen = true;
    } else if (arg === "--execute") {
      options.execute = true;
    } else if (arg.startsWith("--monitor-attestation=")) {
      options.monitorAttestationPath = arg.slice("--monitor-attestation=".length);
    } else {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }
  if (options.mode === "preflight" && options.execute) {
    throw new Error("preflight is always read-only and does not accept --execute");
  }
  if (options.mode !== "preflight" && !options.execute) {
    throw new Error(`${options.mode} requires the explicit --execute flag`);
  }
  if (options.mode === "activate" && !options.monitorAttestationPath) {
    throw new Error("activate requires --monitor-attestation=<path>");
  }
  if (options.mode === "rollback" && options.monitorAttestationPath) {
    throw new Error("rollback does not accept a monitor attestation");
  }
  return options;
}

export function validateMonitorAttestation(attestation, { now = new Date() } = {}) {
  const expected = CONTROLLED_TEST.monitor;
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) {
    throw new Error("Monitor attestation must be a JSON object");
  }
  if (attestation.attestationVersion !== expected.attestationVersion) {
    throw new Error(`Monitor attestation version must be ${expected.attestationVersion}`);
  }
  const evidence = attestation.evidence;
  if (!evidence || typeof evidence !== "object"
    || evidence.schedulerCadenceMinutes !== expected.cadenceMinutes
    || evidence.heartbeatPersisted !== true
    || evidence.warningAlertVerified !== true
    || evidence.protectivePauseVerified !== true
    || evidence.failClosedVerified !== true) {
    throw new Error("Monitor attestation is missing the exact scheduler, heartbeat, alert, pause, or fail-closed proof");
  }
  const promotion = attestation.promotion;
  if (!promotion || typeof promotion !== "object"
    || promotion.verified !== true
    || promotion.source !== "GOOGLE_ADS_UI"
    || promotion.status !== "ACTIVE"
    || promotion.currency !== "CAD") {
    throw new Error("Promotion proof must be an active CAD promotion freshly verified in GOOGLE_ADS_UI");
  }
  const requiredSpendCad = Number(promotion.requiredQualifyingSpendCad);
  if (!Number.isFinite(requiredSpendCad) || requiredSpendCad < 550 || requiredSpendCad > 650) {
    throw new Error("Promotion qualifying-spend requirement must be the verified amount around CA$600");
  }
  const promotionCheckedAt = parseFreshTimestamp(
    promotion.checkedAtUtc,
    now,
    expected,
    "Promotion proof",
  );
  const eligibilityStart = new Date(promotion.eligibilityWindowStartUtc);
  const eligibilityEnd = new Date(promotion.eligibilityWindowEndUtc);
  if (!Number.isFinite(eligibilityStart.getTime())
    || !Number.isFinite(eligibilityEnd.getTime())
    || eligibilityStart >= eligibilityEnd
    || now < eligibilityStart
    || now >= eligibilityEnd) {
    throw new Error("Promotion eligibility window is invalid or not currently active");
  }
  const heartbeats = attestation.heartbeats;
  if (!Array.isArray(heartbeats) || heartbeats.length !== expected.requiredConsecutiveHeartbeats) {
    throw new Error(`Monitor attestation requires exactly ${expected.requiredConsecutiveHeartbeats} consecutive heartbeats`);
  }
  const validatedHeartbeats = heartbeats.map((heartbeat) => validateHeartbeatShape(heartbeat));
  for (let index = 1; index < validatedHeartbeats.length; index += 1) {
    const previous = validatedHeartbeats[index - 1];
    const current = validatedHeartbeats[index];
    const gapMs = current.timestamp.getTime() - previous.timestamp.getTime();
    if (gapMs <= 0 || gapMs > expected.maximumAgeMinutes * 60_000) {
      throw new Error(`Monitor heartbeat gap must be positive and no more than ${expected.maximumAgeMinutes} minutes`);
    }
    if (current.windowStartLocal !== previous.windowStartLocal
      || current.windowEndLocal !== previous.windowEndLocal) {
      throw new Error("Consecutive monitor heartbeats must use the same controlled-test window");
    }
  }
  const heartbeat = heartbeats.at(-1);
  const latest = validatedHeartbeats.at(-1);
  parseFreshTimestamp(heartbeat.timestampUtc, now, expected, "Monitor heartbeat");
  const nowLocal = localNow(now);
  if (nowLocal < `${latest.windowStartLocal}:00` || nowLocal >= `${latest.windowEndLocal}:00`) {
    throw new Error("Controlled-test monitor window is not active");
  }
  return {
    heartbeatTimestampUtc: latest.timestamp.toISOString(),
    heartbeatCount: validatedHeartbeats.length,
    windowStartLocal: latest.windowStartLocal,
    windowEndLocal: latest.windowEndLocal,
    spendCad: latest.spendCad,
    promotion: {
      checkedAtUtc: promotionCheckedAt.toISOString(),
      requiredQualifyingSpendCad: requiredSpendCad,
      eligibilityWindowStartUtc: eligibilityStart.toISOString(),
      eligibilityWindowEndUtc: eligibilityEnd.toISOString(),
    },
  };
}

function validateHeartbeatShape(heartbeat) {
  if (!heartbeat || typeof heartbeat !== "object") throw new Error("Monitor heartbeat is missing");
  const expected = CONTROLLED_TEST.monitor;
  const exactFields = {
    ok: true,
    customerId: CONTROLLED_TEST.customerId,
    profile: "controlled-test",
    executionMode: "EXECUTE",
    timeZone: CONTROLLED_TEST.timeZone,
    accountVerified: true,
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: expected.warningCad,
    thresholdCad: expected.thresholdCad,
    approvedCapCad: expected.approvedCapCad,
    outcome: "BELOW_STOP",
    action: "NONE",
  };
  for (const [field, value] of Object.entries(exactFields)) {
    if (heartbeat[field] !== value) throw new Error(`Monitor heartbeat ${field} must equal ${JSON.stringify(value)}`);
  }
  const spendCad = Number(heartbeat.spendCad);
  if (!Number.isFinite(spendCad) || spendCad < 0 || spendCad >= expected.thresholdCad) {
    throw new Error(`Monitor heartbeat spend must be between CA$0 and CA$${expected.thresholdCad - 0.01}`);
  }
  const parsedWindow = parseHardStopOptions([
    "--profile=controlled-test",
    `--window-start=${heartbeat.windowStartLocal}`,
    `--window-end=${heartbeat.windowEndLocal}`,
  ]);
  const timestamp = new Date(heartbeat.timestampUtc);
  if (!Number.isFinite(timestamp.getTime())) throw new Error("Monitor heartbeat timestampUtc is invalid");
  const expectedLocal = localNow(timestamp);
  if (heartbeat.timestampLocal !== expectedLocal) {
    throw new Error(`Monitor heartbeat timestampLocal must equal ${expectedLocal}`);
  }
  const campaigns = heartbeat.campaignsBefore;
  if (!Array.isArray(campaigns) || campaigns.length !== CONTROLLED_TEST.campaigns.length) {
    throw new Error("Monitor heartbeat must contain the exact three-campaign paused inventory");
  }
  for (const expectedCampaign of CONTROLLED_TEST.campaigns) {
    const actual = campaigns.find((campaign) => String(campaign.id) === expectedCampaign.id);
    if (!actual || actual.name !== expectedCampaign.name || actual.status !== "PAUSED") {
      throw new Error(`Monitor heartbeat campaign inventory mismatch for ${expectedCampaign.id}`);
    }
  }
  return {
    timestamp,
    windowStartLocal: parsedWindow.windowStart,
    windowEndLocal: parsedWindow.windowEnd,
    spendCad,
  };
}

function parseFreshTimestamp(value, now, expected, label) {
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) throw new Error(`${label} timestamp is invalid`);
  const ageMs = now.getTime() - timestamp.getTime();
  if (ageMs > expected.maximumAgeMinutes * 60_000) {
    throw new Error(`${label} is older than ${expected.maximumAgeMinutes} minutes`);
  }
  if (ageMs < -expected.maximumFutureSkewMinutes * 60_000) {
    throw new Error(`${label} timestamp is unexpectedly in the future`);
  }
  return timestamp;
}

export function validateControlledInventory(state, {
  allowedBudgetMicros = [CONTROLLED_TEST.budget.normalMicros],
} = {}) {
  validateAccount(state?.account);
  assertUniqueResources(state?.campaigns, "campaign");
  assertUniqueResources(state?.adGroups, "ad group");
  assertUniqueResources(state?.ads, "ad");
  assertUniqueResources(state?.keywords, "keyword");

  const campaigns = state.campaigns ?? [];
  if (campaigns.length !== CONTROLLED_TEST.campaigns.length) {
    throw new Error("The account must contain exactly the three allowlisted non-removed campaigns");
  }
  for (const expected of CONTROLLED_TEST.campaigns) {
    const actual = campaigns.find((campaign) => campaign.resourceName === expected.resourceName);
    if (!actual || String(actual.id) !== expected.id || actual.name !== expected.name || actual.channel !== "SEARCH") {
      throw new Error(`Campaign identity or channel mismatch for ${expected.id}`);
    }
  }
  const budget = state.budget;
  if (!budget
    || budget.resourceName !== CONTROLLED_TEST.budget.resourceName
    || String(budget.id) !== CONTROLLED_TEST.budget.id
    || budget.status !== "ENABLED"
    || budget.explicitlyShared !== false
    || Number(budget.referenceCount) !== 1
    || !allowedBudgetMicros.includes(String(budget.amountMicros))) {
    throw new Error("Core budget identity, exclusivity, status, or amount is unsafe");
  }
  const core = campaigns.find((campaign) => campaign.resourceName === CONTROLLED_TEST.campaign.resourceName);
  if (core?.budgetResourceName !== CONTROLLED_TEST.budget.resourceName) {
    throw new Error("Core campaign is not attached to the exact controlled-test budget");
  }
  if (String(core?.cpcBidCeilingMicros ?? "") !== CONTROLLED_TEST.campaign.cpcBidCeilingMicros) {
    throw new Error("Core campaign CPC ceiling must remain exactly CA$4");
  }
  const group = (state.adGroups ?? []).find((item) => item.resourceName === CONTROLLED_TEST.adGroup.resourceName);
  if (!group
    || String(group.id) !== CONTROLLED_TEST.adGroup.id
    || group.name !== CONTROLLED_TEST.adGroup.name
    || group.campaignResourceName !== CONTROLLED_TEST.campaign.resourceName) {
    throw new Error("Coroplast ad group identity is unsafe");
  }
  const groupAds = (state.ads ?? []).filter((ad) => ad.adGroupResourceName === CONTROLLED_TEST.adGroup.resourceName);
  if (groupAds.length !== 1) throw new Error("Coroplast ad group must contain exactly one non-removed RSA");
  const rsa = groupAds[0];
  if (rsa.resourceName !== CONTROLLED_TEST.rsa.resourceName
    || String(rsa.id) !== CONTROLLED_TEST.rsa.id
    || rsa.type !== "RESPONSIVE_SEARCH_AD"
    || rsa.approvalStatus !== "APPROVED"
    || rsa.reviewStatus !== "REVIEWED"
    || rsa.finalUrls?.length !== 1
    || rsa.finalUrls[0] !== CONTROLLED_TEST.rsa.finalUrl) {
    throw new Error("Coroplast RSA identity, policy approval, or final URL is unsafe");
  }
  const positiveGroupKeywords = (state.keywords ?? [])
    .filter((keyword) => keyword.adGroupResourceName === CONTROLLED_TEST.adGroup.resourceName && keyword.negative !== true);
  if (positiveGroupKeywords.length !== CONTROLLED_TEST.keywords.length) {
    throw new Error("Coroplast ad group must contain exactly the six allowlisted positive keywords");
  }
  for (const expected of CONTROLLED_TEST.keywords) {
    const actual = positiveGroupKeywords.find((keyword) => keyword.resourceName === expected.resourceName);
    if (!actual
      || String(actual.criterionId) !== expected.criterionId
      || actual.text !== expected.text
      || actual.matchType !== expected.matchType) {
      throw new Error(`Coroplast keyword identity mismatch for ${expected.resourceName}`);
    }
  }
  return state;
}

export function validatePreflightState(state) {
  validateControlledInventory(state);
  assertAllStatus(state.campaigns, "PAUSED", "campaign");
  assertAllStatus(state.adGroups, "PAUSED", "ad group");
  assertAllStatus(state.ads, "PAUSED", "ad");
  assertPositiveKeywords(state.keywords, new Set(), "preflight");
  return state;
}

export function validateBudgetStagedState(state) {
  validateControlledInventory(state, { allowedBudgetMicros: [CONTROLLED_TEST.budget.controlledMicros] });
  assertAllStatus(state.campaigns, "PAUSED", "campaign");
  assertAllStatus(state.adGroups, "PAUSED", "ad group");
  assertAllStatus(state.ads, "PAUSED", "ad");
  assertPositiveKeywords(state.keywords, new Set(), "budget-stage");
  return state;
}

export function validateActivatedState(state) {
  validateControlledInventory(state, { allowedBudgetMicros: [CONTROLLED_TEST.budget.controlledMicros] });
  assertOnlyEnabled(state.campaigns, new Set([CONTROLLED_TEST.campaign.resourceName]), "campaign");
  assertOnlyEnabled(state.adGroups, new Set([CONTROLLED_TEST.adGroup.resourceName]), "ad group");
  assertOnlyEnabled(state.ads, new Set([CONTROLLED_TEST.rsa.resourceName]), "ad");
  assertPositiveKeywords(state.keywords, new Set(CONTROLLED_TEST.keywords.map((keyword) => keyword.resourceName)), "activation");
  return state;
}

export function validateRolledBackState(state) {
  validateControlledInventory(state);
  assertAllStatus(state.campaigns, "PAUSED", "campaign");
  assertAllStatus(state.adGroups, "PAUSED", "ad group");
  assertAllStatus(state.ads, "PAUSED", "ad");
  assertPositiveKeywords(state.keywords, new Set(), "rollback");
  return state;
}

export function buildStatusOperations(resourceNames, status) {
  if (!["ENABLED", "PAUSED"].includes(status)) throw new Error(`Unsupported status: ${status}`);
  if (!Array.isArray(resourceNames) || resourceNames.length === 0) throw new Error("At least one resource is required");
  const unique = [...new Set(resourceNames)];
  if (unique.length !== resourceNames.length) throw new Error("Duplicate mutation resource");
  for (const resourceName of unique) {
    if (typeof resourceName !== "string" || !resourceName.startsWith(RESOURCE_PREFIX)) {
      throw new Error("Mutation resource is outside the True Color account");
    }
  }
  return unique.map((resourceName) => ({
    update: { resourceName, status },
    updateMask: "status",
  }));
}

export function buildBudgetOperations(amountMicros) {
  if (![CONTROLLED_TEST.budget.controlledMicros, CONTROLLED_TEST.budget.normalMicros].includes(String(amountMicros))) {
    throw new Error("Budget mutation must be exactly CA$5 or CA$8");
  }
  return [{
    update: {
      resourceName: CONTROLLED_TEST.budget.resourceName,
      amountMicros: String(amountMicros),
    },
    updateMask: "amountMicros",
  }];
}

function validateAccount(account) {
  if (String(account?.id ?? "") !== CONTROLLED_TEST.customerId
    || account?.currencyCode !== "CAD"
    || account?.timeZone !== CONTROLLED_TEST.timeZone) {
    throw new Error("Google Ads account is not the exact True Color CAD account");
  }
}

function assertUniqueResources(items, label) {
  if (!Array.isArray(items)) throw new Error(`${label} inventory was not returned`);
  const names = items.map((item) => item.resourceName);
  if (names.some((name) => typeof name !== "string") || new Set(names).size !== names.length) {
    throw new Error(`${label} inventory contains missing or duplicate resource names`);
  }
}

function assertAllStatus(items, status, label) {
  const unexpected = (items ?? []).filter((item) => item.status !== status);
  if (unexpected.length > 0) {
    throw new Error(`Every ${label} must be ${status}: ${unexpected.map((item) => item.resourceName).join(",")}`);
  }
}

function assertOnlyEnabled(items, enabledResources, label) {
  for (const item of items ?? []) {
    const expected = enabledResources.has(item.resourceName) ? "ENABLED" : "PAUSED";
    if (item.status !== expected) throw new Error(`${label} status mismatch for ${item.resourceName}`);
  }
  if ([...enabledResources].some((resourceName) => !(items ?? []).some((item) => item.resourceName === resourceName))) {
    throw new Error(`Enabled ${label} allowlist is incomplete`);
  }
}

function assertPositiveKeywords(keywords, enabledResources, stage) {
  const positive = (keywords ?? []).filter((keyword) => keyword.negative !== true);
  assertOnlyEnabled(positive, enabledResources, `${stage} positive keyword`);
}
