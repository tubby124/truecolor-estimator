import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBudgetOperations,
  buildStatusOperations,
  CONTROLLED_EXACT_KEYWORDS,
  CONTROLLED_TEST,
  parseControlledTestOptions,
  signMonitorAttestation,
  validateActivatedState,
  validateBudgetStagedState,
  validateControlledAccount,
  validateMonitorAttestation,
  validatePreflightState,
  validateResourcesStagedState,
  validateRolledBackState,
} from "../controlled-test-contract.mjs";
import {
  createControlledTestGoogleAdsApi,
  createCoroplastLandingProbe,
  runControlledTestController,
  validateLandingProbe,
} from "../controlled-test-controller.mjs";
import { COMPETITOR_DESTINATION_BINDING } from "../live-verification-contract.mjs";

const NOW = new Date("2026-07-23T19:30:00.000Z");
const ATTESTATION_SECRET = "test-only-controlled-attestation-secret-2026";

function makeState(stage = "paused") {
  const enabled = stage === "active";
  return {
    account: {
      id: CONTROLLED_TEST.customerId,
      currencyCode: "CAD",
      timeZone: CONTROLLED_TEST.timeZone,
    },
    campaigns: CONTROLLED_TEST.campaigns.map((campaign) => ({
      ...campaign,
      status: enabled && campaign.id === CONTROLLED_TEST.campaign.id ? "ENABLED" : "PAUSED",
      channel: "SEARCH",
      budgetResourceName: campaign.id === CONTROLLED_TEST.campaign.id
        ? CONTROLLED_TEST.budget.resourceName
        : `customers/${CONTROLLED_TEST.customerId}/campaignBudgets/other-${campaign.id}`,
      cpcBidCeilingMicros: campaign.id === CONTROLLED_TEST.campaign.id ? "4000000" : "2500000",
    })),
    budget: {
      ...CONTROLLED_TEST.budget,
      status: "ENABLED",
      amountMicros: enabled ? CONTROLLED_TEST.budget.controlledMicros : CONTROLLED_TEST.budget.normalMicros,
      explicitlyShared: false,
      referenceCount: "1",
    },
    adGroups: [
      {
        ...CONTROLLED_TEST.adGroup,
        status: enabled ? "ENABLED" : "PAUSED",
        campaignResourceName: CONTROLLED_TEST.campaign.resourceName,
      },
      {
        id: "other-group",
        resourceName: `customers/${CONTROLLED_TEST.customerId}/adGroups/other-group`,
        name: "Other group",
        status: "PAUSED",
        campaignResourceName: CONTROLLED_TEST.campaign.resourceName,
      },
    ],
    ads: [
      {
        ...CONTROLLED_TEST.rsa,
        status: enabled ? "ENABLED" : "PAUSED",
        type: "RESPONSIVE_SEARCH_AD",
        approvalStatus: "APPROVED",
        reviewStatus: "REVIEWED",
        finalUrls: [CONTROLLED_TEST.rsa.finalUrl],
        adGroupResourceName: CONTROLLED_TEST.adGroup.resourceName,
      },
      {
        id: "other-ad",
        resourceName: `customers/${CONTROLLED_TEST.customerId}/adGroupAds/other-group~other-ad`,
        status: "PAUSED",
        type: "RESPONSIVE_SEARCH_AD",
        approvalStatus: "APPROVED",
        reviewStatus: "REVIEWED",
        finalUrls: ["https://truecolorprinting.ca/products/stickers"],
        adGroupResourceName: `customers/${CONTROLLED_TEST.customerId}/adGroups/other-group`,
      },
    ],
    keywords: [
      ...CONTROLLED_TEST.keywords.map((keyword) => ({
        ...keyword,
        status: enabled && keyword.matchType === "EXACT" ? "ENABLED" : "PAUSED",
        negative: false,
        adGroupResourceName: CONTROLLED_TEST.adGroup.resourceName,
      })),
      {
        criterionId: "other-keyword",
        resourceName: `customers/${CONTROLLED_TEST.customerId}/adGroupCriteria/other-group~other-keyword`,
        status: "PAUSED",
        negative: false,
        text: "stickers",
        matchType: "EXACT",
        adGroupResourceName: `customers/${CONTROLLED_TEST.customerId}/adGroups/other-group`,
      },
      {
        criterionId: "negative",
        resourceName: `customers/${CONTROLLED_TEST.customerId}/adGroupCriteria/197192347366~negative`,
        status: "ENABLED",
        negative: true,
        text: "free",
        matchType: "BROAD",
        adGroupResourceName: CONTROLLED_TEST.adGroup.resourceName,
      },
    ],
  };
}

function makeAttestation(overrides = {}) {
  const heartbeat = (auditRunId, timestampUtc, timestampLocal) => ({
    auditRunId,
    databaseEventId: `00000000-0000-4000-8000-${auditRunId.slice(-3).padStart(12, "0")}`,
    persistedAtUtc: new Date(new Date(timestampUtc).getTime() + 100).toISOString(),
    ok: true,
    customerId: CONTROLLED_TEST.customerId,
    profile: "controlled-test",
    executionMode: "EXECUTE",
    schedulerSource: "RAILWAY",
    activationEligible: true,
    timeZone: CONTROLLED_TEST.timeZone,
    accountVerified: true,
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: 25,
    thresholdCad: 25,
    approvedCapCad: 30,
    outcome: "BELOW_STOP",
    action: "NONE",
    spendCad: 0,
    spendMicros: "0",
    timestampUtc,
    timestampLocal,
    windowStartLocal: "2026-07-23T13:00",
    windowEndLocal: "2026-07-26T13:00",
    campaignsBefore: CONTROLLED_TEST.campaigns.map((campaign) => ({ ...campaign, status: "PAUSED" })),
  });
  const unsigned = {
    attestationVersion: 1,
    evidence: {
      schedulerCadenceMinutes: 15,
      heartbeatPersisted: true,
      warningAlertVerified: true,
      protectivePauseVerified: true,
      failClosedVerified: true,
      proofs: {
        warningAlert: {
          eventType: "google_ads.monitor.drill.warning_alert_verified",
          evidenceId: "drill_warning_20260723",
          databaseEventId: "10000000-0000-4000-8000-000000000001",
          checkedAtUtc: "2026-07-23T19:20:00.000Z",
          persistedAtUtc: "2026-07-23T19:20:00.100Z",
          source: "MONITOR_SAFETY_DRILL",
          artifactDigest: `sha256:${"a".repeat(64)}`,
          campaignIds: CONTROLLED_TEST.campaigns.map((campaign) => campaign.id).sort(),
          outcome: "WARNING",
          action: "NONE",
          pauseVerified: false,
          telegramMessageId: "42",
        },
        protectivePause: {
          eventType: "google_ads.monitor.drill.protective_pause_verified",
          evidenceId: "drill_pause_20260723",
          databaseEventId: "10000000-0000-4000-8000-000000000002",
          checkedAtUtc: "2026-07-23T19:20:00.000Z",
          persistedAtUtc: "2026-07-23T19:20:00.100Z",
          source: "MONITOR_SAFETY_DRILL",
          artifactDigest: `sha256:${"b".repeat(64)}`,
          campaignIds: CONTROLLED_TEST.campaigns.map((campaign) => campaign.id).sort(),
          outcome: "STOPPED",
          action: "PAUSED",
          pauseVerified: true,
        },
        failClosed: {
          eventType: "google_ads.monitor.drill.fail_closed_verified",
          evidenceId: "drill_failclosed_20260723",
          databaseEventId: "10000000-0000-4000-8000-000000000003",
          checkedAtUtc: "2026-07-23T19:20:00.000Z",
          persistedAtUtc: "2026-07-23T19:20:00.100Z",
          source: "MONITOR_SAFETY_DRILL",
          artifactDigest: `sha256:${"c".repeat(64)}`,
          campaignIds: CONTROLLED_TEST.campaigns.map((campaign) => campaign.id).sort(),
          outcome: "ERROR_FAIL_CLOSED_PAUSED",
          action: "PAUSED",
          pauseVerified: true,
        },
      },
    },
    promotion: {
      evidenceId: "promo_ui_20260723",
      verified: true,
      source: "GOOGLE_ADS_UI",
      status: "ACTIVE",
      currency: "CAD",
      requiredQualifyingSpendCad: 600,
      checkedAtUtc: "2026-07-23T19:20:00.000Z",
      eligibilityWindowStartUtc: "2026-07-20T06:00:00.000Z",
      eligibilityWindowEndUtc: "2026-09-18T06:00:00.000Z",
    },
    liveVerification: {
      evidenceId: "live_verify_20260723",
      status: "VALIDATED_PAUSED",
      checkedAtUtc: "2026-07-23T19:20:00.000Z",
      customerId: CONTROLLED_TEST.customerId,
      safetyFailures: [],
      launchBlockers: [],
      settings: {
        campaignIds: CONTROLLED_TEST.campaigns.map((campaign) => campaign.id),
        allCampaignsPaused: true,
        searchOnly: true,
        searchPartnersDisabled: true,
        displayDisabled: true,
        presenceOnlyRadiusKm: 35,
        languageConstant: "languageConstants/1000",
        startDate: "2026-07-20",
        endDate: "2026-09-17",
        finalUrlSuffix: "utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}&keyword={keyword}&matchtype={matchtype}&device={device}&loc_physical_ms={loc_physical_ms}&loc_interest_ms={loc_interest_ms}&adgroupid={adgroupid}&creative={creative}&campaignid={campaignid}&network={network}",
        purchaseOnlineActionId: "7694360837",
        quoteWonActionId: "7694360840",
        qualifiedCallActionId: "7694360843",
        qualifiedCallAssetId: "394889103183",
        revenueActionsPrimaryOnly: true,
        qualifiedCallsSecondary: true,
        allPolicyApproved: true,
        competitorDestinationUrl: COMPETITOR_DESTINATION_BINDING.finalUrl,
        competitorRsaAdGroupAdResources: COMPETITOR_DESTINATION_BINDING.adGroupAdResources,
        unexpectedSpendCad: 0,
      },
    },
    heartbeats: [
      heartbeat("cronrun_001", "2026-07-23T19:00:00.000Z", "2026-07-23T13:00:00"),
      heartbeat("cronrun_002", "2026-07-23T19:15:00.000Z", "2026-07-23T13:15:00"),
      heartbeat("cronrun_003", "2026-07-23T19:30:00.000Z", "2026-07-23T13:30:00"),
    ],
    ...overrides,
  };
  return signMonitorAttestation(unsigned, ATTESTATION_SECRET);
}

const healthyLandingProbe = async (url) => ({
  requestedUrl: url,
  finalUrl: url,
  status: 200,
});

function makeApi({
  failAt = null,
  readFailureAt = null,
  initialStage = "paused",
  onRead = null,
  account = null,
} = {}) {
  let state = structuredClone(makeState(initialStage));
  let reads = 0;
  let failureConsumed = false;
  const calls = [];
  const mutate = async (kind, resources, statusOrAmount, { validateOnly }) => {
    calls.push({ kind, resources: [...resources], statusOrAmount, validateOnly });
    if (!failureConsumed && failAt === `${kind}:${validateOnly ? "validate" : "execute"}`) {
      failureConsumed = true;
      throw new Error(`${kind} failed`);
    }
    if (validateOnly) return;
    if (kind === "budget") {
      state.budget.amountMicros = String(statusOrAmount);
      return;
    }
    const collection = {
      campaign: state.campaigns,
      group: state.adGroups,
      ad: state.ads,
      keyword: state.keywords,
    }[kind];
    for (const item of collection) if (resources.includes(item.resourceName)) item.status = statusOrAmount;
  };
  return {
    calls,
    get state() { return state; },
    async readAccount() {
      return structuredClone(account ?? state.account);
    },
    async readCampaigns() {
      return structuredClone(state.campaigns);
    },
    async readState() {
      reads += 1;
      onRead?.({ reads, state });
      if (readFailureAt === reads) throw new Error("read failed");
      return structuredClone(state);
    },
    setBudget(amount, options) {
      return mutate("budget", [CONTROLLED_TEST.budget.resourceName], amount, options);
    },
    setKeywordStatuses(resources, status, options) {
      return mutate("keyword", resources, status, options);
    },
    setAdStatuses(resources, status, options) {
      return mutate("ad", resources, status, options);
    },
    setAdGroupStatuses(resources, status, options) {
      return mutate("group", resources, status, options);
    },
    setCampaignStatuses(resources, status, options) {
      return mutate("campaign", resources, status, options);
    },
  };
}

test("CLI defaults to read-only preflight and requires explicit execute for writes", () => {
  assert.deepEqual(parseControlledTestOptions([]), {
    mode: "preflight",
    execute: false,
    monitorAttestationPath: null,
  });
  assert.throws(() => parseControlledTestOptions(["preflight", "--execute"]), /always read-only/);
  assert.throws(() => parseControlledTestOptions(["activate"]), /requires the explicit --execute/);
  assert.throws(() => parseControlledTestOptions(["rollback"]), /requires the explicit --execute/);
  assert.throws(() => parseControlledTestOptions(["activate", "--execute"]), /monitor-attestation/);
  assert.throws(() => parseControlledTestOptions(["rollback", "--execute", "--monitor-attestation=x"]), /does not accept/);
  assert.equal(
    parseControlledTestOptions(["activate", "--execute", "--monitor-attestation=/tmp/proof.json"]).mode,
    "activate",
  );
});

test("exported controller rejects direct-call write bypasses before touching the API", async () => {
  for (const options of [
    { mode: "rollback", execute: false },
    { mode: "activate", execute: false },
    { mode: "unexpected", execute: true },
    { mode: "preflight", execute: true },
  ]) {
    const api = makeApi({ initialStage: "active" });
    const result = await runControlledTestController({
      api,
      options,
      monitorAttestation: makeAttestation(),
      attestationSecret: ATTESTATION_SECRET,
      landingProbe: healthyLandingProbe,
      now: NOW,
    });
    assert.equal(result.outcome, "INVALID_INVOCATION");
    assert.equal(api.calls.length, 0);
  }
});

test("mutation builders accept only exact True Color resources and CA$5/CA$8 budgets", () => {
  assert.equal(buildStatusOperations([CONTROLLED_TEST.campaign.resourceName], "PAUSED")[0].updateMask, "status");
  assert.equal(buildBudgetOperations("5000000")[0].updateMask, "amount_micros");
  assert.equal(buildBudgetOperations("8000000")[0].update.amountMicros, "8000000");
  assert.throws(() => buildStatusOperations(["customers/999/campaigns/1"], "PAUSED"), /outside/);
  assert.throws(() => buildStatusOperations([CONTROLLED_TEST.campaign.resourceName], "REMOVED"), /Unsupported/);
  assert.throws(() => buildBudgetOperations("6000000"), /exactly CA\$5 or CA\$8/);
});

test("monitor attestation is exact, signed, fresh, in-window, and proves fail-closed monitoring", () => {
  assert.deepEqual(validateMonitorAttestation(makeAttestation(), {
    now: NOW,
    signingSecret: ATTESTATION_SECRET,
  }), {
    heartbeatTimestampUtc: "2026-07-23T19:30:00.000Z",
    heartbeatCount: 3,
    windowStartLocal: "2026-07-23T13:00",
    windowEndLocal: "2026-07-26T13:00",
    spendCad: 0,
    promotion: {
      checkedAtUtc: "2026-07-23T19:20:00.000Z",
      requiredQualifyingSpendCad: 600,
      eligibilityWindowStartUtc: "2026-07-20T06:00:00.000Z",
      eligibilityWindowEndUtc: "2026-09-18T06:00:00.000Z",
    },
  });
  const cases = [
    { evidence: { ...makeAttestation().evidence, failClosedVerified: false } },
    {
      evidence: {
        ...makeAttestation().evidence,
        proofs: {
          ...makeAttestation().evidence.proofs,
          warningAlert: undefined,
        },
      },
    },
    { promotion: { ...makeAttestation().promotion, source: "API_ASSUMPTION" } },
    { promotion: { ...makeAttestation().promotion, checkedAtUtc: "2026-07-23T19:00:00.000Z" } },
    { promotion: { ...makeAttestation().promotion, requiredQualifyingSpendCad: 1000 } },
    { promotion: { ...makeAttestation().promotion, eligibilityWindowEndUtc: "2026-07-23T19:00:00.000Z" } },
    { promotion: { ...makeAttestation().promotion, eligibilityWindowEndUtc: "2026-07-25T19:30:00.000Z" } },
    { heartbeats: makeAttestation().heartbeats.slice(1) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 0 ? { ...item, timestampUtc: "2026-07-23T18:40:00.000Z", timestampLocal: "2026-07-23T12:40:00", windowStartLocal: "2026-07-23T12:00" } : { ...item, windowStartLocal: "2026-07-23T12:00" }) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, executionMode: "DRY_RUN" } : item) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, customerId: "999" } : item) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, spendCad: 25 } : item) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, timestampUtc: "2026-07-23T19:00:00.000Z", timestampLocal: "2026-07-23T13:00:00" } : item) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, windowEndLocal: "2026-07-26T14:00" } : item) },
    { heartbeats: makeAttestation().heartbeats.map((item, index) => index === 2 ? { ...item, campaignsBefore: [] } : item) },
    {
      heartbeats: makeAttestation().heartbeats.map((item, index) => ({
        ...item,
        timestampUtc: `2026-07-23T19:00:${String(index * 10).padStart(2, "0")}.000Z`,
        timestampLocal: `2026-07-23T13:00:${String(index * 10).padStart(2, "0")}`,
        persistedAtUtc: `2026-07-23T19:00:${String(index * 10).padStart(2, "0")}.100Z`,
      })),
    },
    {
      heartbeats: makeAttestation().heartbeats.map((item, index) => ({
        ...item,
        timestampUtc: `2026-07-23T19:${String(index * 10).padStart(2, "0")}:00.000Z`,
        timestampLocal: `2026-07-23T13:${String(index * 10).padStart(2, "0")}:00`,
        persistedAtUtc: `2026-07-23T19:${String(index * 10).padStart(2, "0")}:00.100Z`,
      })),
    },
  ];
  for (const overrides of cases) {
    assert.throws(() => validateMonitorAttestation(makeAttestation(overrides), {
      now: NOW,
      signingSecret: ATTESTATION_SECRET,
    }));
  }
  const tampered = makeAttestation();
  tampered.promotion.requiredQualifyingSpendCad = 650;
  assert.throws(
    () => validateMonitorAttestation(tampered, { now: NOW, signingSecret: ATTESTATION_SECRET }),
    /signature verification failed/,
  );
  const invalidSpendCases = [
    [null, null, null],
    ["0", "0", "0"],
    [20, 10, 0],
  ];
  for (const spends of invalidSpendCases) {
    const heartbeats = makeAttestation().heartbeats.map((item, index) => ({
      ...item,
      spendCad: spends[index],
      spendMicros: typeof spends[index] === "number" ? String(spends[index] * 1_000_000) : "0",
    }));
    assert.throws(() => validateMonitorAttestation(
      makeAttestation({ heartbeats }),
      { now: NOW, signingSecret: ATTESTATION_SECRET },
    ));
  }
});

test("activation clearance is signed, fresh, exact-account, and launch-blocker free", async () => {
  const cases = [
    { liveVerification: undefined },
    { liveVerification: { ...makeAttestation().liveVerification, customerId: "999" } },
    { liveVerification: { ...makeAttestation().liveVerification, checkedAtUtc: "2026-07-23T19:00:00.000Z" } },
    { liveVerification: { ...makeAttestation().liveVerification, launchBlockers: ["policy review"] } },
    {
      liveVerification: {
        ...makeAttestation().liveVerification,
        settings: { ...makeAttestation().liveVerification.settings, searchPartnersDisabled: false },
      },
    },
    {
      liveVerification: {
        ...makeAttestation().liveVerification,
        settings: { ...makeAttestation().liveVerification.settings, allPolicyApproved: false },
      },
    },
    {
      liveVerification: {
        ...makeAttestation().liveVerification,
        settings: {
          ...makeAttestation().liveVerification.settings,
          competitorDestinationUrl: "https://truecolorprinting.ca/why-true-color",
        },
      },
    },
    {
      liveVerification: {
        ...makeAttestation().liveVerification,
        settings: {
          ...makeAttestation().liveVerification.settings,
          competitorRsaAdGroupAdResources:
            makeAttestation().liveVerification.settings.competitorRsaAdGroupAdResources.slice(0, 8),
        },
      },
    },
  ];
  for (const overrides of cases) {
    const api = makeApi();
    const result = await runControlledTestController({
      api,
      options: { mode: "activate", execute: true },
      monitorAttestation: makeAttestation(overrides),
      attestationSecret: ATTESTATION_SECRET,
      landingProbe: healthyLandingProbe,
      now: NOW,
      clock: () => NOW,
    });
    assert.equal(result.outcome, "ACTIVATION_REFUSED");
    assert.equal(api.calls.length, 0);
  }
});

test("state validators enforce exact resource identities and only the intended enabled resources", () => {
  assert.equal(validatePreflightState(makeState("paused")).budget.amountMicros, "8000000");
  const budgetStaged = makeState("paused");
  budgetStaged.budget.amountMicros = "5000000";
  assert.equal(validateBudgetStagedState(budgetStaged).budget.amountMicros, "5000000");
  const resourcesStaged = makeState("active");
  resourcesStaged.campaigns[0].status = "PAUSED";
  assert.equal(validateResourcesStagedState(resourcesStaged).campaigns[0].status, "PAUSED");
  assert.equal(validateActivatedState(makeState("active")).budget.amountMicros, "5000000");
  assert.equal(validateRolledBackState(makeState("paused")).budget.amountMicros, "8000000");

  const wrongUrl = makeState("paused");
  wrongUrl.ads[0].finalUrls = ["https://truecolorprinting.ca/why-true-color"];
  assert.throws(() => validatePreflightState(wrongUrl), /final URL/);
  const extraKeyword = makeState("paused");
  extraKeyword.keywords.push({
    ...extraKeyword.keywords[0],
    resourceName: `customers/${CONTROLLED_TEST.customerId}/adGroupCriteria/197192347366~extra`,
    criterionId: "extra",
  });
  assert.throws(() => validatePreflightState(extraKeyword), /exactly the six/);
  const sharedBudget = makeState("paused");
  sharedBudget.budget.explicitlyShared = true;
  assert.throws(() => validatePreflightState(sharedBudget), /budget/);
  const wrongCpc = makeState("paused");
  wrongCpc.campaigns[0].cpcBidCeilingMicros = "5000000";
  assert.throws(() => validatePreflightState(wrongCpc), /CPC ceiling/);
  const unexpectedEnabled = makeState("paused");
  unexpectedEnabled.campaigns[1].status = "ENABLED";
  assert.throws(() => validatePreflightState(unexpectedEnabled), /Every campaign/);
  const enabledWhileBudgetStaged = makeState("paused");
  enabledWhileBudgetStaged.budget.amountMicros = "5000000";
  enabledWhileBudgetStaged.campaigns[0].status = "ENABLED";
  assert.throws(() => validateBudgetStagedState(enabledWhileBudgetStaged), /Every campaign/);
  assert.throws(
    () => validateControlledAccount({ id: "999", currencyCode: "CAD", timeZone: CONTROLLED_TEST.timeZone }),
    /exact True Color/,
  );
});

test("preflight is read-only and reports unsafe state without any mutation", async () => {
  const api = makeApi();
  const pass = await runControlledTestController({
    api,
    options: parseControlledTestOptions([]),
    now: NOW,
  });
  assert.equal(pass.outcome, "PREFLIGHT_PASSED");
  assert.equal(pass.summary.budgetCad, 8);
  assert.equal(api.calls.length, 0);

  api.state.ads[0].approvalStatus = "DISAPPROVED";
  const fail = await runControlledTestController({
    api,
    options: parseControlledTestOptions([]),
    now: NOW,
  });
  assert.equal(fail.outcome, "PREFLIGHT_FAILED");
  assert.equal(api.calls.length, 0);
});

test("activation validates every batch, enables Core last, and passes strict readback", async () => {
  const api = makeApi();
  const result = await runControlledTestController({
    api,
    options: parseControlledTestOptions([
      "activate",
      "--execute",
      "--monitor-attestation=/tmp/proof.json",
    ]),
    monitorAttestation: makeAttestation(),
    attestationSecret: ATTESTATION_SECRET,
    landingProbe: healthyLandingProbe,
    now: NOW,
    clock: () => NOW,
  });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "ACTIVATED");
  assert.equal(result.summary.budgetCad, 5);
  assert.deepEqual(
    api.calls.map((call) => `${call.kind}:${call.validateOnly ? "validate" : "execute"}`),
    [
      "budget:validate", "budget:execute",
      "keyword:validate", "keyword:execute",
      "ad:validate", "ad:execute",
      "group:validate", "group:execute",
      "campaign:validate", "campaign:execute",
    ],
  );
  assert.equal(api.calls.at(-1).resources[0], CONTROLLED_TEST.campaign.resourceName);
  assert.equal(api.state.campaigns[0].status, "ENABLED");
  const keywordEnable = api.calls.find(
    (call) => call.kind === "keyword" && call.statusOrAmount === "ENABLED" && !call.validateOnly,
  );
  assert.deepEqual(
    keywordEnable.resources,
    CONTROLLED_EXACT_KEYWORDS.map((keyword) => keyword.resourceName),
  );
  assert.ok(api.state.keywords
    .filter((keyword) => keyword.matchType === "PHRASE")
    .every((keyword) => keyword.status === "PAUSED"));
});

test("invalid attestation refuses activation before any write", async () => {
  const api = makeApi();
  const attestation = makeAttestation();
  attestation.heartbeats[2] = {
    ...attestation.heartbeats[2],
    outcome: "WARNING",
    spendCad: 25,
  };
  const result = await runControlledTestController({
    api,
    options: { mode: "activate", execute: true },
    monitorAttestation: attestation,
    attestationSecret: ATTESTATION_SECRET,
    landingProbe: healthyLandingProbe,
    now: NOW,
    clock: () => NOW,
  });
  assert.equal(result.outcome, "ACTIVATION_REFUSED");
  assert.equal(api.calls.length, 0);
});

test("any failure after the first write invokes full rollback and restores CA$8", async () => {
  const api = makeApi({ failAt: "ad:execute" });
  const result = await runControlledTestController({
    api,
    options: { mode: "activate", execute: true },
    monitorAttestation: makeAttestation(),
    attestationSecret: ATTESTATION_SECRET,
    landingProbe: healthyLandingProbe,
    now: NOW,
    clock: () => NOW,
  });
  assert.equal(result.outcome, "ACTIVATION_FAILED_ROLLED_BACK");
  assert.equal(result.rollback.outcome, "ROLLED_BACK");
  assert.equal(api.state.budget.amountMicros, "8000000");
  assert.ok(api.state.campaigns.every((campaign) => campaign.status === "PAUSED"));
  assert.ok(api.state.adGroups.every((group) => group.status === "PAUSED"));
  assert.ok(api.state.ads.every((ad) => ad.status === "PAUSED"));
  assert.ok(api.state.keywords.filter((keyword) => !keyword.negative).every((keyword) => keyword.status === "PAUSED"));
  const firstRollbackCampaign = api.calls.findIndex((call, index) => (
    index > 0 && call.kind === "campaign" && call.statusOrAmount === "PAUSED"
  ));
  assert.notEqual(firstRollbackCampaign, -1);
  assert.equal(api.calls[firstRollbackCampaign].resources.length, CONTROLLED_TEST.campaigns.length);
});

test("resource-stage drift triggers rollback before Core can be enabled", async () => {
  const api = makeApi({
    onRead({ reads, state }) {
      if (reads === 3) state.adGroups[1].status = "ENABLED";
    },
  });
  const result = await runControlledTestController({
    api,
    options: { mode: "activate", execute: true },
    monitorAttestation: makeAttestation(),
    attestationSecret: ATTESTATION_SECRET,
    landingProbe: healthyLandingProbe,
    now: NOW,
    clock: () => NOW,
  });
  assert.equal(result.outcome, "ACTIVATION_FAILED_ROLLED_BACK");
  const coreEnable = api.calls.find(
    (call) => call.kind === "campaign" && call.statusOrAmount === "ENABLED",
  );
  assert.equal(coreEnable, undefined);
  assert.ok(api.state.campaigns.every((campaign) => campaign.status === "PAUSED"));
});

test("fresh pre-campaign clock blocks activation when the remaining window buffer expires", async () => {
  const api = makeApi();
  const base = makeAttestation();
  const heartbeats = base.heartbeats.map((heartbeat) => ({
    ...heartbeat,
    windowEndLocal: "2026-07-23T14:00",
  }));
  const result = await runControlledTestController({
    api,
    options: { mode: "activate", execute: true },
    monitorAttestation: makeAttestation({ heartbeats }),
    attestationSecret: ATTESTATION_SECRET,
    landingProbe: healthyLandingProbe,
    now: NOW,
    clock: () => new Date("2026-07-23T19:31:00.000Z"),
  });
  assert.equal(result.outcome, "ACTIVATION_FAILED_ROLLED_BACK");
  assert.match(result.error, /at least 30 minutes remaining/);
  assert.equal(
    api.calls.some((call) => call.kind === "campaign" && call.statusOrAmount === "ENABLED"),
    false,
  );
  assert.ok(api.state.campaigns.every((campaign) => campaign.status === "PAUSED"));
});

test("omitted clock still uses real current time for the pre-campaign check", { concurrency: false }, async () => {
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length > 0 ? args : ["2026-07-23T19:31:00.000Z"]));
    }

    static now() {
      return RealDate.parse("2026-07-23T19:31:00.000Z");
    }
  };
  try {
    const base = makeAttestation();
    const heartbeats = base.heartbeats.map((heartbeat) => ({
      ...heartbeat,
      windowEndLocal: "2026-07-23T14:00",
    }));
    const api = makeApi();
    const result = await runControlledTestController({
      api,
      options: { mode: "activate", execute: true },
      monitorAttestation: makeAttestation({ heartbeats }),
      attestationSecret: ATTESTATION_SECRET,
      landingProbe: healthyLandingProbe,
      now: NOW,
    });
    assert.equal(result.outcome, "ACTIVATION_FAILED_ROLLED_BACK");
    assert.match(result.error, /at least 30 minutes remaining/);
    assert.equal(
      api.calls.some((call) => call.kind === "campaign" && call.statusOrAmount === "ENABLED"),
      false,
    );
  } finally {
    globalThis.Date = RealDate;
  }
});

test("activation refuses a broken or redirected Coroplast URL before the first write", async () => {
  for (const probe of [
    async (url) => ({ requestedUrl: url, finalUrl: url, status: 503 }),
    async (url) => ({ requestedUrl: url, finalUrl: "https://example.com/", status: 200 }),
  ]) {
    const api = makeApi();
    const result = await runControlledTestController({
      api,
      options: { mode: "activate", execute: true },
      monitorAttestation: makeAttestation(),
      attestationSecret: ATTESTATION_SECRET,
      landingProbe: probe,
      now: NOW,
      clock: () => NOW,
    });
    assert.equal(result.outcome, "ACTIVATION_REFUSED");
    assert.equal(api.calls.length, 0);
  }
  assert.equal(validateLandingProbe(await healthyLandingProbe(CONTROLLED_TEST.rsa.finalUrl)).status, 200);
});

test("the production landing probe uses GET, follows redirects, and returns only status evidence", async () => {
  let request;
  let cancelled = false;
  const probe = createCoroplastLandingProbe({
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        url,
        status: 200,
        body: { async cancel() { cancelled = true; } },
      };
    },
  });
  assert.deepEqual(await probe(CONTROLLED_TEST.rsa.finalUrl), {
    requestedUrl: CONTROLLED_TEST.rsa.finalUrl,
    finalUrl: CONTROLLED_TEST.rsa.finalUrl,
    status: 200,
  });
  assert.equal(request.options.method, "GET");
  assert.equal(request.options.redirect, "follow");
  assert.equal(cancelled, true);
});

test("Google Ads transport exhausts pagination and emits the live-validated budget mask", async () => {
  const requests = [];
  const response = (body) => ({
    ok: true,
    status: 200,
    async json() { return body; },
  });
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options, body: options.body instanceof URLSearchParams ? null : JSON.parse(options.body) });
    if (String(url).includes("oauth2.googleapis.com")) return response({ access_token: "token" });
    if (String(url).endsWith("/campaigns:mutate")) return response({});
    if (String(url).endsWith("/campaignBudgets:mutate")) return response({});
    const body = JSON.parse(options.body);
    if (body.pageToken === "page-2") {
      return response({
        results: [{
          campaign: {
            id: "24048123061",
            resourceName: CONTROLLED_TEST.campaigns[1].resourceName,
            name: CONTROLLED_TEST.campaigns[1].name,
            status: "PAUSED",
            advertisingChannelType: "SEARCH",
            campaignBudget: "customers/1072816342/campaignBudgets/2",
          },
        }],
      });
    }
    return response({
      results: [{
        campaign: {
          id: CONTROLLED_TEST.campaign.id,
          resourceName: CONTROLLED_TEST.campaign.resourceName,
          name: CONTROLLED_TEST.campaign.name,
          status: "PAUSED",
          advertisingChannelType: "SEARCH",
          campaignBudget: CONTROLLED_TEST.budget.resourceName,
        },
      }],
      nextPageToken: "page-2",
    });
  };
  const api = createControlledTestGoogleAdsApi({
    fetchImpl,
    env: {
      GOOGLE_ADS_CLIENT_ID: "id",
      GOOGLE_ADS_CLIENT_SECRET: "secret",
      GOOGLE_ADS_REFRESH_TOKEN: "refresh",
      GOOGLE_ADS_DEVELOPER_TOKEN: "developer",
    },
  });
  const campaigns = await api.readCampaigns();
  assert.equal(campaigns.length, 2);
  const searchBodies = requests.filter((request) => request.url.endsWith("/googleAds:search")).map((request) => request.body);
  assert.deepEqual(searchBodies.map((body) => body.pageToken ?? null), [null, "page-2"]);

  await api.setBudget(CONTROLLED_TEST.budget.controlledMicros, { validateOnly: true });
  const budgetRequest = requests.find((request) => request.url.endsWith("/campaignBudgets:mutate"));
  assert.equal(budgetRequest.body.validateOnly, true);
  assert.equal(budgetRequest.body.partialFailure, false);
  assert.equal(budgetRequest.body.operations[0].update.amountMicros, "5000000");
  assert.equal(budgetRequest.body.operations[0].updateMask, "amount_micros");
});

test("explicit rollback is account-wide, validated, idempotent, and strictly read back", async () => {
  const api = makeApi({ initialStage: "active" });
  api.state.campaigns.push({
    id: "999",
    resourceName: `customers/${CONTROLLED_TEST.customerId}/campaigns/999`,
    name: "Unexpected campaign",
    status: "ENABLED",
    channel: "SEARCH",
    budgetResourceName: `customers/${CONTROLLED_TEST.customerId}/campaignBudgets/999`,
  });
  const result = await runControlledTestController({
    api,
    options: { mode: "rollback", execute: true },
    now: NOW,
  });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ROLLBACK_UNVERIFIED");
  assert.ok(api.state.campaigns.every((campaign) => campaign.status === "PAUSED"));
  assert.equal(api.state.budget.amountMicros, "8000000");
  const accountPause = api.calls.find((call) => call.kind === "campaign" && call.validateOnly);
  assert.equal(accountPause.resources.length, 4);

  api.state.campaigns.pop();
  const second = await runControlledTestController({
    api,
    options: { mode: "rollback", execute: true },
    now: NOW,
  });
  assert.equal(second.outcome, "ROLLED_BACK");
  assert.equal(second.ok, true);
});

test("rollback continues remaining safety batches after one batch fails and reports unverified", async () => {
  const api = makeApi({ initialStage: "active", failAt: "keyword:validate" });
  const result = await runControlledTestController({
    api,
    options: { mode: "rollback", execute: true },
    now: NOW,
  });
  assert.equal(result.outcome, "ROLLBACK_UNVERIFIED");
  assert.ok(result.errors.some((error) => error.includes("keyword pause failed")));
  assert.equal(api.state.campaigns[0].status, "PAUSED");
  assert.equal(api.state.adGroups[0].status, "PAUSED");
  assert.equal(api.state.ads[0].status, "PAUSED");
  assert.equal(api.state.budget.amountMicros, "8000000");
});

test("rollback never restores CA$8 unless a fresh read proves every campaign is paused", async () => {
  const api = makeApi({ initialStage: "active", failAt: "campaign:execute" });
  const result = await runControlledTestController({
    api,
    options: { mode: "rollback", execute: true },
    now: NOW,
  });
  assert.equal(result.outcome, "ROLLBACK_UNVERIFIED");
  assert.ok(result.errors.some((error) => error.includes("campaign pause")));
  assert.equal(api.state.campaigns[0].status, "ENABLED");
  assert.equal(api.state.budget.amountMicros, "5000000");
  assert.equal(
    api.calls.some((call) => call.kind === "budget" && call.statusOrAmount === "8000000"),
    false,
  );
  assert.ok(api.state.adGroups.every((group) => group.status === "PAUSED"));
  assert.ok(api.state.ads.every((ad) => ad.status === "PAUSED"));
  assert.ok(api.state.keywords.filter((keyword) => !keyword.negative).every((keyword) => keyword.status === "PAUSED"));
});

test("rollback refuses mutation when exact account identity cannot be verified", async () => {
  const api = makeApi({
    initialStage: "active",
    account: { id: "999", currencyCode: "CAD", timeZone: CONTROLLED_TEST.timeZone },
  });
  const result = await runControlledTestController({
    api,
    options: { mode: "rollback", execute: true },
    now: NOW,
  });
  assert.equal(result.outcome, "ROLLBACK_UNVERIFIED");
  assert.match(result.errors[0], /account identity verification failed/);
  assert.equal(api.calls.length, 0);
});
