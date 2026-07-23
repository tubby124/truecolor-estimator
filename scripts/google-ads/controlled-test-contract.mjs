import { createHmac, timingSafeEqual } from "node:crypto";
import { localNow, parseHardStopOptions } from "./hard-stop-contract.mjs";

const EXPECTED_FINAL_URL_SUFFIX = "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}";

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

export const CONTROLLED_EXACT_KEYWORDS = Object.freeze(
  CONTROLLED_TEST.keywords.filter((keyword) => keyword.matchType === "EXACT"),
);

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

export function validateMonitorAttestation(attestation, {
  now = new Date(),
  signingSecret,
} = {}) {
  const expected = CONTROLLED_TEST.monitor;
  validateAttestationEnvelope(attestation, signingSecret, expected);
  validateMonitorEvidence(attestation.evidence, expected);
  const promotion = validatePromotionProof(attestation.promotion, now, expected);
  const latest = validateHeartbeatSequence(attestation.heartbeats, now, expected);
  validateWindowContainment(latest, promotion);
  return {
    heartbeatTimestampUtc: latest.timestamp.toISOString(),
    heartbeatCount: attestation.heartbeats.length,
    windowStartLocal: latest.windowStartLocal,
    windowEndLocal: latest.windowEndLocal,
    spendCad: latest.spendCad,
    promotion: {
      checkedAtUtc: promotion.checkedAt.toISOString(),
      requiredQualifyingSpendCad: promotion.requiredSpendCad,
      eligibilityWindowStartUtc: promotion.eligibilityStart.toISOString(),
      eligibilityWindowEndUtc: promotion.eligibilityEnd.toISOString(),
    },
  };
}

export function validateActivationAttestation(attestation, {
  now = new Date(),
  signingSecret,
  minimumRemainingMinutes = 30,
} = {}) {
  const monitor = validateMonitorAttestation(attestation, { now, signingSecret });
  const liveVerification = validateLiveVerificationClearance(attestation.liveVerification, now);
  const windowEnd = reginaLocalToDate(monitor.windowEndLocal);
  const remainingWindowMinutes = (windowEnd.getTime() - now.getTime()) / 60_000;
  if (!Number.isFinite(minimumRemainingMinutes)
    || minimumRemainingMinutes < 1
    || remainingWindowMinutes < minimumRemainingMinutes) {
    throw new Error(`Controlled-test window must have at least ${minimumRemainingMinutes} minutes remaining`);
  }
  return { ...monitor, liveVerification, remainingWindowMinutes };
}

function validateLiveVerificationClearance(clearance, now) {
  const expected = CONTROLLED_TEST.monitor;
  if (!clearance || typeof clearance !== "object"
    || clearance.status !== "VALIDATED_PAUSED"
    || clearance.customerId !== CONTROLLED_TEST.customerId
    || !validEvidenceId(clearance.evidenceId)
    || !Array.isArray(clearance.safetyFailures)
    || clearance.safetyFailures.length !== 0
    || !Array.isArray(clearance.launchBlockers)
    || clearance.launchBlockers.length !== 0) {
    throw new Error("Activation requires a blocker-free VALIDATED_PAUSED live-account clearance");
  }
  const checkedAt = parseFreshTimestamp(
    clearance.checkedAtUtc,
    now,
    expected,
    "Live-account clearance",
  );
  const settings = clearance.settings;
  const expectedCampaignIds = CONTROLLED_TEST.campaigns.map((campaign) => campaign.id);
  if (!settings
    || JSON.stringify(settings.campaignIds) !== JSON.stringify(expectedCampaignIds)
    || settings.allCampaignsPaused !== true
    || settings.searchOnly !== true
    || settings.searchPartnersDisabled !== true
    || settings.displayDisabled !== true
    || settings.presenceOnlyRadiusKm !== 35
    || settings.languageConstant !== "languageConstants/1000"
    || settings.startDate !== "2026-07-20"
    || settings.endDate !== "2026-09-17"
    || settings.finalUrlSuffix !== EXPECTED_FINAL_URL_SUFFIX
    || settings.purchaseOnlineActionId !== "7694360837"
    || settings.quoteWonActionId !== "7694360840"
    || settings.qualifiedCallActionId !== "7694360843"
    || settings.qualifiedCallAssetId !== "394889103183"
    || settings.revenueActionsPrimaryOnly !== true
    || settings.qualifiedCallsSecondary !== true
    || settings.allPolicyApproved !== true
    || settings.unexpectedSpendCad !== 0) {
    throw new Error("Live-account clearance does not prove the exact launch-critical settings");
  }
  return {
    evidenceId: clearance.evidenceId,
    checkedAtUtc: checkedAt.toISOString(),
    status: clearance.status,
  };
}

function validateAttestationEnvelope(attestation, signingSecret, expected) {
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) {
    throw new Error("Monitor attestation must be a JSON object");
  }
  verifyMonitorAttestationSignature(attestation, signingSecret);
  if (attestation.attestationVersion !== expected.attestationVersion) {
    throw new Error(`Monitor attestation version must be ${expected.attestationVersion}`);
  }
}

function validateMonitorEvidence(evidence, expected) {
  if (!evidence || typeof evidence !== "object"
    || evidence.schedulerCadenceMinutes !== expected.cadenceMinutes
    || evidence.heartbeatPersisted !== true
    || evidence.warningAlertVerified !== true
    || evidence.protectivePauseVerified !== true
    || evidence.failClosedVerified !== true) {
    throw new Error("Monitor attestation is missing the exact scheduler, heartbeat, alert, pause, or fail-closed proof");
  }
}

function validatePromotionProof(promotion, now, expected) {
  if (!promotion || typeof promotion !== "object"
    || promotion.verified !== true
    || promotion.source !== "GOOGLE_ADS_UI"
    || promotion.status !== "ACTIVE"
    || promotion.currency !== "CAD"
    || !validEvidenceId(promotion.evidenceId)) {
    throw new Error("Promotion proof must be an active CAD promotion freshly verified in GOOGLE_ADS_UI");
  }
  const requiredSpendCad = Number(promotion.requiredQualifyingSpendCad);
  if (!Number.isFinite(requiredSpendCad) || requiredSpendCad < 550 || requiredSpendCad > 650) {
    throw new Error("Promotion qualifying-spend requirement must be the verified amount around CA$600");
  }
  const checkedAt = parseFreshTimestamp(promotion.checkedAtUtc, now, expected, "Promotion proof");
  const eligibilityStart = new Date(promotion.eligibilityWindowStartUtc);
  const eligibilityEnd = new Date(promotion.eligibilityWindowEndUtc);
  if (!Number.isFinite(eligibilityStart.getTime())
    || !Number.isFinite(eligibilityEnd.getTime())
    || eligibilityStart >= eligibilityEnd
    || now < eligibilityStart
    || now >= eligibilityEnd) {
    throw new Error("Promotion eligibility window is invalid or not currently active");
  }
  return { checkedAt, requiredSpendCad, eligibilityStart, eligibilityEnd };
}

function validateHeartbeatSequence(heartbeats, now, expected) {
  if (!Array.isArray(heartbeats) || heartbeats.length !== expected.requiredConsecutiveHeartbeats) {
    throw new Error(`Monitor attestation requires exactly ${expected.requiredConsecutiveHeartbeats} consecutive heartbeats`);
  }
  const validated = heartbeats.map((heartbeat) => validateHeartbeatShape(heartbeat));
  if (new Set(heartbeats.map((heartbeat) => heartbeat.auditRunId)).size !== heartbeats.length) {
    throw new Error("Monitor heartbeat audit run IDs must be distinct");
  }
  for (let index = 1; index < validated.length; index += 1) {
    validateHeartbeatTransition(validated[index - 1], validated[index], expected);
  }
  const latest = validated.at(-1);
  parseFreshTimestamp(heartbeats.at(-1).timestampUtc, now, expected, "Monitor heartbeat");
  const nowLocal = localNow(now);
  if (nowLocal < `${latest.windowStartLocal}:00` || nowLocal >= `${latest.windowEndLocal}:00`) {
    throw new Error("Controlled-test monitor window is not active");
  }
  return latest;
}

function validateHeartbeatTransition(previous, current, expected) {
  const gapMs = current.timestamp.getTime() - previous.timestamp.getTime();
  if (gapMs <= 0 || gapMs > expected.maximumAgeMinutes * 60_000) {
    throw new Error(`Monitor heartbeat gap must be positive and no more than ${expected.maximumAgeMinutes} minutes`);
  }
  if (current.windowStartLocal !== previous.windowStartLocal
    || current.windowEndLocal !== previous.windowEndLocal) {
    throw new Error("Consecutive monitor heartbeats must use the same controlled-test window");
  }
  if (current.spendMicros < previous.spendMicros) {
    throw new Error("Controlled-test cumulative spend cannot decrease across heartbeats");
  }
}

function validateWindowContainment(latest, promotion) {
  const controlledStart = reginaLocalToDate(latest.windowStartLocal);
  const controlledEnd = reginaLocalToDate(latest.windowEndLocal);
  if (controlledStart < promotion.eligibilityStart || controlledEnd > promotion.eligibilityEnd) {
    throw new Error("The full controlled-test window must be contained in the promotion eligibility window");
  }
}

function validateHeartbeatShape(heartbeat) {
  if (!heartbeat || typeof heartbeat !== "object") throw new Error("Monitor heartbeat is missing");
  const expected = CONTROLLED_TEST.monitor;
  validateExactHeartbeatFields(heartbeat, expected);
  if (!validEvidenceId(heartbeat.auditRunId)) {
    throw new Error("Monitor heartbeat must include a persisted audit run ID");
  }
  const spend = validateHeartbeatSpend(heartbeat, expected);
  const timing = validateHeartbeatTiming(heartbeat);
  validateHeartbeatCampaigns(heartbeat.campaignsBefore);
  return { ...timing, ...spend };
}

function validateExactHeartbeatFields(heartbeat, expected) {
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
}

function validateHeartbeatSpend(heartbeat, expected) {
  const spendCad = heartbeat.spendCad;
  if (typeof spendCad !== "number"
    || !Number.isFinite(spendCad)
    || spendCad < 0
    || spendCad >= expected.thresholdCad) {
    throw new Error(`Monitor heartbeat spend must be between CA$0 and CA$${expected.thresholdCad - 0.01}`);
  }
  if (typeof heartbeat.spendMicros !== "string" || !/^\d+$/.test(heartbeat.spendMicros)) {
    throw new Error("Monitor heartbeat spendMicros must be a decimal string");
  }
  const spendMicros = BigInt(heartbeat.spendMicros);
  if (Math.abs(Number(spendMicros) / 1_000_000 - spendCad) > 0.0000001) {
    throw new Error("Monitor heartbeat spendCad and spendMicros are inconsistent");
  }
  return { spendCad, spendMicros };
}

function validateHeartbeatTiming(heartbeat) {
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
  if (heartbeat.timestampLocal < `${parsedWindow.windowStart}:00`
    || heartbeat.timestampLocal >= `${parsedWindow.windowEnd}:00`) {
    throw new Error("Every monitor heartbeat must fall inside the controlled-test window");
  }
  return {
    timestamp,
    windowStartLocal: parsedWindow.windowStart,
    windowEndLocal: parsedWindow.windowEnd,
  };
}

function validateHeartbeatCampaigns(campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length !== CONTROLLED_TEST.campaigns.length) {
    throw new Error("Monitor heartbeat must contain the exact three-campaign paused inventory");
  }
  for (const expectedCampaign of CONTROLLED_TEST.campaigns) {
    const actual = campaigns.find((campaign) => String(campaign.id) === expectedCampaign.id);
    if (!actual || actual.name !== expectedCampaign.name || actual.status !== "PAUSED") {
      throw new Error(`Monitor heartbeat campaign inventory mismatch for ${expectedCampaign.id}`);
    }
  }
}

export function signMonitorAttestation(attestation, signingSecret) {
  validateSigningSecret(signingSecret);
  const unsigned = structuredClone(attestation);
  delete unsigned.signature;
  const digest = createHmac("sha256", signingSecret)
    .update(canonicalJson(unsigned))
    .digest("hex");
  return { ...unsigned, signature: `sha256=${digest}` };
}

function verifyMonitorAttestationSignature(attestation, signingSecret) {
  validateSigningSecret(signingSecret);
  if (typeof attestation.signature !== "string" || !/^sha256=[a-f0-9]{64}$/.test(attestation.signature)) {
    throw new Error("Monitor attestation signature is missing or invalid");
  }
  const expected = signMonitorAttestation(attestation, signingSecret).signature;
  const actualBuffer = Buffer.from(attestation.signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Monitor attestation signature verification failed");
  }
}

function validateSigningSecret(signingSecret) {
  if (typeof signingSecret !== "string" || signingSecret.length < 32) {
    throw new Error("Controlled-test attestation signing secret must be at least 32 characters");
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function validEvidenceId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

function reginaLocalToDate(value) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  let candidate = Date.UTC(year, month - 1, day, hour, minute);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rendered = localNow(new Date(candidate)).slice(0, 16);
    candidate += Date.parse(`${value}:00Z`) - Date.parse(`${rendered}:00Z`);
  }
  const result = new Date(candidate);
  if (localNow(result).slice(0, 16) !== value) throw new Error(`Invalid ${CONTROLLED_TEST.timeZone} local time`);
  return result;
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
  validateControlledAccount(state?.account);
  assertUniqueResources(state?.campaigns, "campaign");
  assertUniqueResources(state?.adGroups, "ad group");
  assertUniqueResources(state?.ads, "ad");
  assertUniqueResources(state?.keywords, "keyword");
  const campaigns = validateCampaignInventory(state?.campaigns);
  validateBudgetInventory(state?.budget, campaigns, allowedBudgetMicros);
  validateCoroplastCreativeInventory(state);
  return state;
}

function validateCampaignInventory(campaigns = []) {
  if (campaigns.length !== CONTROLLED_TEST.campaigns.length) {
    throw new Error("The account must contain exactly the three allowlisted non-removed campaigns");
  }
  for (const expected of CONTROLLED_TEST.campaigns) {
    const actual = campaigns.find((campaign) => campaign.resourceName === expected.resourceName);
    if (!actual || String(actual.id) !== expected.id || actual.name !== expected.name || actual.channel !== "SEARCH") {
      throw new Error(`Campaign identity or channel mismatch for ${expected.id}`);
    }
  }
  return campaigns;
}

function validateBudgetInventory(budget, campaigns, allowedBudgetMicros) {
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
}

function validateCoroplastCreativeInventory(state) {
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
  validateCoroplastKeywords(state.keywords);
}

function validateCoroplastKeywords(keywords = []) {
  const positiveGroupKeywords = keywords
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

export function validateResourcesStagedState(state) {
  validateControlledInventory(state, { allowedBudgetMicros: [CONTROLLED_TEST.budget.controlledMicros] });
  assertAllStatus(state.campaigns, "PAUSED", "campaign");
  assertOnlyEnabled(state.adGroups, new Set([CONTROLLED_TEST.adGroup.resourceName]), "ad group");
  assertOnlyEnabled(state.ads, new Set([CONTROLLED_TEST.rsa.resourceName]), "ad");
  assertPositiveKeywords(
    state.keywords,
    new Set(CONTROLLED_EXACT_KEYWORDS.map((keyword) => keyword.resourceName)),
    "resource-stage",
  );
  return state;
}

export function validateActivatedState(state) {
  validateControlledInventory(state, { allowedBudgetMicros: [CONTROLLED_TEST.budget.controlledMicros] });
  assertOnlyEnabled(state.campaigns, new Set([CONTROLLED_TEST.campaign.resourceName]), "campaign");
  assertOnlyEnabled(state.adGroups, new Set([CONTROLLED_TEST.adGroup.resourceName]), "ad group");
  assertOnlyEnabled(state.ads, new Set([CONTROLLED_TEST.rsa.resourceName]), "ad");
  assertPositiveKeywords(
    state.keywords,
    new Set(CONTROLLED_EXACT_KEYWORDS.map((keyword) => keyword.resourceName)),
    "activation",
  );
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

export function validateRollbackContainmentState(state) {
  validateControlledInventory(state, {
    allowedBudgetMicros: [CONTROLLED_TEST.budget.controlledMicros],
  });
  assertAllStatus(state.adGroups, "PAUSED", "ad group");
  assertAllStatus(state.ads, "PAUSED", "ad");
  assertPositiveKeywords(state.keywords, new Set(), "rollback containment");
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
    updateMask: "amount_micros",
  }];
}

export function validateControlledAccount(account) {
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
