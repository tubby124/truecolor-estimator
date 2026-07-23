import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBudgetOperations,
  buildStatusOperations,
  CONTROLLED_TEST,
  parseControlledTestOptions,
  validateActivatedState,
  validateBudgetStagedState,
  validateMonitorAttestation,
  validatePreflightState,
  validateRolledBackState,
} from "../controlled-test-contract.mjs";
import { runControlledTestController } from "../controlled-test-controller.mjs";

const NOW = new Date("2026-07-23T19:30:00.000Z");

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
        status: enabled ? "ENABLED" : "PAUSED",
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
  return {
    attestationVersion: 1,
    evidence: {
      schedulerCadenceMinutes: 15,
      heartbeatPersisted: true,
      warningAlertVerified: true,
      protectivePauseVerified: true,
      failClosedVerified: true,
    },
    heartbeat: {
      ok: true,
      customerId: CONTROLLED_TEST.customerId,
      profile: "controlled-test",
      executionMode: "EXECUTE",
      timeZone: CONTROLLED_TEST.timeZone,
      accountVerified: true,
      spendScope: "EXACT_ACCOUNT_TOTAL",
      warningCad: 25,
      thresholdCad: 25,
      approvedCapCad: 30,
      outcome: "BELOW_STOP",
      action: "NONE",
      spendCad: 0,
      timestampUtc: "2026-07-23T19:20:00.000Z",
      timestampLocal: "2026-07-23T13:20:00",
      windowStartLocal: "2026-07-23T13:00",
      windowEndLocal: "2026-07-26T13:00",
      campaignsBefore: CONTROLLED_TEST.campaigns.map((campaign) => ({ ...campaign, status: "PAUSED" })),
    },
    ...overrides,
  };
}

function makeApi({ failAt = null, readFailureAt = null, initialStage = "paused" } = {}) {
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
    async readCampaigns() {
      return structuredClone(state.campaigns);
    },
    async readState() {
      reads += 1;
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

test("mutation builders accept only exact True Color resources and CA$5/CA$8 budgets", () => {
  assert.equal(buildStatusOperations([CONTROLLED_TEST.campaign.resourceName], "PAUSED")[0].updateMask, "status");
  assert.equal(buildBudgetOperations("5000000")[0].updateMask, "amountMicros");
  assert.equal(buildBudgetOperations("8000000")[0].update.amountMicros, "8000000");
  assert.throws(() => buildStatusOperations(["customers/999/campaigns/1"], "PAUSED"), /outside/);
  assert.throws(() => buildStatusOperations([CONTROLLED_TEST.campaign.resourceName], "REMOVED"), /Unsupported/);
  assert.throws(() => buildBudgetOperations("6000000"), /exactly CA\$5 or CA\$8/);
});

test("monitor attestation is exact, fresh, in-window, and proves fail-closed monitoring", () => {
  assert.deepEqual(validateMonitorAttestation(makeAttestation(), { now: NOW }), {
    heartbeatTimestampUtc: "2026-07-23T19:20:00.000Z",
    windowStartLocal: "2026-07-23T13:00",
    windowEndLocal: "2026-07-26T13:00",
    spendCad: 0,
  });
  const cases = [
    { evidence: { ...makeAttestation().evidence, failClosedVerified: false } },
    { heartbeat: { ...makeAttestation().heartbeat, executionMode: "DRY_RUN" } },
    { heartbeat: { ...makeAttestation().heartbeat, customerId: "999" } },
    { heartbeat: { ...makeAttestation().heartbeat, spendCad: 25 } },
    { heartbeat: { ...makeAttestation().heartbeat, timestampUtc: "2026-07-23T19:00:00.000Z", timestampLocal: "2026-07-23T13:00:00" } },
    { heartbeat: { ...makeAttestation().heartbeat, windowEndLocal: "2026-07-26T14:00" } },
    { heartbeat: { ...makeAttestation().heartbeat, campaignsBefore: [] } },
  ];
  for (const overrides of cases) {
    assert.throws(() => validateMonitorAttestation(makeAttestation(overrides), { now: NOW }));
  }
});

test("state validators enforce exact resource identities and only the intended enabled resources", () => {
  assert.equal(validatePreflightState(makeState("paused")).budget.amountMicros, "8000000");
  const budgetStaged = makeState("paused");
  budgetStaged.budget.amountMicros = "5000000";
  assert.equal(validateBudgetStagedState(budgetStaged).budget.amountMicros, "5000000");
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
  const unexpectedEnabled = makeState("paused");
  unexpectedEnabled.campaigns[1].status = "ENABLED";
  assert.throws(() => validatePreflightState(unexpectedEnabled), /Every campaign/);
  const enabledWhileBudgetStaged = makeState("paused");
  enabledWhileBudgetStaged.budget.amountMicros = "5000000";
  enabledWhileBudgetStaged.campaigns[0].status = "ENABLED";
  assert.throws(() => validateBudgetStagedState(enabledWhileBudgetStaged), /Every campaign/);
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
    now: NOW,
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
});

test("invalid attestation refuses activation before any write", async () => {
  const api = makeApi();
  const attestation = makeAttestation({
    heartbeat: { ...makeAttestation().heartbeat, outcome: "WARNING", spendCad: 25 },
  });
  const result = await runControlledTestController({
    api,
    options: { mode: "activate", execute: true },
    monitorAttestation: attestation,
    now: NOW,
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
    now: NOW,
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
