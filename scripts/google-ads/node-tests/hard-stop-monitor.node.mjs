import assert from "node:assert/strict";
import test from "node:test";
import {
  HARD_STOP_CAMPAIGNS,
  gaqlDateRange,
  localNow,
  parseHardStopOptions,
  sumSpendMicros,
} from "../hard-stop-contract.mjs";
import { runHardStopMonitor } from "../hard-stop-monitor.mjs";

const ACCOUNT = { id: "1072816342", currencyCode: "CAD", timeZone: "America/Regina" };
const ACTIVE_CAMPAIGNS = HARD_STOP_CAMPAIGNS.map((campaign) => ({ ...campaign, status: "ENABLED" }));
const PAUSED_CAMPAIGNS = HARD_STOP_CAMPAIGNS.map((campaign) => ({ ...campaign, status: "PAUSED" }));
const UNEXPECTED_CAMPAIGN = { id: "99999999999", name: "Unexpected Campaign", status: "ENABLED" };
const PUBLIC_OPTIONS = parseHardStopOptions(["--profile=public-pilot"]);
const PUBLIC_NOW = new Date("2026-07-21T18:00:00.000Z");

function createApi({
  account = ACCOUNT,
  campaigns = ACTIVE_CAMPAIGNS,
  spendMicros = "0",
  spendRows,
  readAccountError,
  readCampaignsError,
  readSpendError,
  pauseError,
  stayEnabledAfterPause = false,
} = {}) {
  const pausedIds = new Set(campaigns.filter((campaign) => campaign.status === "PAUSED").map((campaign) => campaign.id));
  let pauseCalls = 0;
  let pauseTargets = [];
  return {
    get pauseCalls() { return pauseCalls; },
    get pauseTargets() { return pauseTargets; },
    async readAccount() {
      if (readAccountError) throw readAccountError;
      return account;
    },
    async readCampaigns() {
      if (readCampaignsError) throw readCampaignsError;
      return campaigns.map((campaign) => ({
        ...campaign,
        status: pausedIds.has(campaign.id) && !stayEnabledAfterPause ? "PAUSED" : campaign.status,
      }));
    },
    async readSpend() {
      if (readSpendError) throw readSpendError;
      return spendRows ?? [{ customerId: ACCOUNT.id, date: "2026-07-21", hour: 12, costMicros: spendMicros }];
    },
    async pauseEnabledCampaigns() {
      pauseCalls += 1;
      if (readCampaignsError) throw readCampaignsError;
      pauseTargets = campaigns.filter((campaign) => !pausedIds.has(campaign.id) && campaign.status === "ENABLED");
      if (pauseError) throw pauseError;
      for (const campaign of pauseTargets) pausedIds.add(campaign.id);
      return pauseTargets;
    },
  };
}

test("defaults to read-only below the public-pilot warning", async () => {
  const api = createApi({ spendMicros: "449999999" });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.executionMode, "DRY_RUN");
  assert.equal(result.outcome, "BELOW_STOP");
  assert.equal(result.action, "NONE");
  assert.equal(api.pauseCalls, 0);
});

test("reports the public warning without mutating below the protective threshold", async () => {
  const api = createApi({ spendMicros: "450000000" });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "WARNING");
  assert.equal(result.action, "NONE");
  assert.equal(result.warningCad, 450);
  assert.equal(api.pauseCalls, 0);
});

test("reaching the CA$600 promo target starts the protective pause", async () => {
  const api = createApi({ spendMicros: "600000000" });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.outcome, "STOPPED");
  assert.equal(result.action, "PAUSED");
  assert.equal(result.decisionReason, "PROTECTIVE_PAUSE_THRESHOLD_REACHED");
  assert.equal(result.absoluteCapReached, false);
  assert.equal(api.pauseCalls, 1);
});

test("one cent under the CA$600 protective threshold still does not pause", async () => {
  const api = createApi({ spendMicros: "599990000" });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.outcome, "WARNING");
  assert.equal(result.action, "NONE");
  assert.equal(api.pauseCalls, 0);
});

test("dry-run reports a protective pause at CA$600 without mutating", async () => {
  const api = createApi({ spendMicros: "600000000" });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "STOP_REQUIRED");
  assert.equal(result.action, "WOULD_PAUSE");
  assert.equal(result.thresholdCad, 600);
  assert.equal(result.approvedCapCad, 650);
  assert.equal(api.pauseCalls, 0);
});

test("explicit execute pauses every allowlisted campaign above threshold and verifies readback", async () => {
  const api = createApi({ spendMicros: "651000000" });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "STOPPED");
  assert.equal(result.action, "PAUSED");
  assert.equal(result.pauseVerified, true);
  assert.ok(result.campaignsAfter.every((campaign) => campaign.status === "PAUSED"));
  assert.equal(api.pauseCalls, 1);
  assert.deepEqual(api.pauseTargets.map((campaign) => campaign.id).sort(), HARD_STOP_CAMPAIGNS.map((campaign) => campaign.id).sort());
});

test("public monitor distinguishes the CA$600 protective pause from the authorized limit", async () => {
  const protective = createApi({ spendMicros: "600000000" });
  const protectiveResult = await runHardStopMonitor({ api: protective, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(protectiveResult.outcome, "STOPPED");
  assert.equal(protectiveResult.decisionReason, "PROTECTIVE_PAUSE_THRESHOLD_REACHED");
  assert.equal(protectiveResult.absoluteCapReached, false);
  assert.equal(protectiveResult.thresholdCad, 600);
  assert.equal(protectiveResult.approvedCapCad, 650);
  assert.equal(protective.pauseCalls, 1);
});

test("public monitor pauses at the CA$650 ceiling and reports it as the absolute cap", async () => {
  const capped = createApi({ spendMicros: "650000000" });
  const cappedResult = await runHardStopMonitor({ api: capped, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(cappedResult.outcome, "STOPPED");
  assert.equal(cappedResult.decisionReason, "ABSOLUTE_CAP_REACHED");
  assert.equal(cappedResult.absoluteCapReached, true);
  assert.equal(cappedResult.approvedCapCad, 650);
  assert.equal(cappedResult.spendScope, "EXACT_ACCOUNT_TOTAL");
  assert.equal(capped.pauseCalls, 1);
});

// The controlled-test profile keeps a distinct soft tier (CA$25 protective vs CA$30 cap),
// so the two decision reasons must both remain reachable somewhere in the contract.
test("controlled-test profile still distinguishes the protective pause from the absolute cap", async () => {
  const controlledOptions = {
    profile: "controlled-test",
    execute: true,
    windowStart: "2026-07-23T16:00",
    windowEnd: "2026-07-26T16:00",
  };
  const now = new Date("2026-07-24T18:00:00.000Z");

  // The row must fall inside the controlled-test window or spend filters out to zero.
  const inWindow = (costMicros) => [{ customerId: ACCOUNT.id, date: "2026-07-24", hour: 12, costMicros }];

  const protective = createApi({ spendRows: inWindow("25000000") });
  const protectiveResult = await runHardStopMonitor({ api: protective, options: controlledOptions, now });
  assert.equal(protectiveResult.decisionReason, "PROTECTIVE_PAUSE_THRESHOLD_REACHED");
  assert.equal(protectiveResult.absoluteCapReached, false);

  const capped = createApi({ spendRows: inWindow("30000000") });
  const cappedResult = await runHardStopMonitor({ api: capped, options: controlledOptions, now });
  assert.equal(cappedResult.decisionReason, "ABSOLUTE_CAP_REACHED");
  assert.equal(cappedResult.absoluteCapReached, true);
});

test("the approved public window stays open through 2026-12-30 and stops once it ends", async () => {
  const insideWindow = createApi({ spendMicros: "0" });
  const insideResult = await runHardStopMonitor({
    api: insideWindow,
    options: PUBLIC_OPTIONS,
    now: new Date("2026-12-30T18:00:00.000Z"),
  });
  assert.equal(insideResult.windowEndLocal, "2026-12-31T00:00");
  assert.equal(insideResult.timestampLocal, "2026-12-30T12:00:00");
  assert.equal(insideResult.outcome, "BELOW_STOP");
  assert.equal(insideResult.action, "NONE");
  assert.equal(insideWindow.pauseCalls, 0);

  const afterWindow = createApi({ spendMicros: "0" });
  const endedResult = await runHardStopMonitor({
    api: afterWindow,
    options: { ...PUBLIC_OPTIONS, execute: true },
    now: new Date("2026-12-31T06:00:00.000Z"),
  });
  assert.equal(endedResult.timestampLocal, "2026-12-31T00:00:00");
  assert.equal(endedResult.decisionReason, "WINDOW_ENDED");
  assert.equal(endedResult.outcome, "STOPPED");
  assert.equal(endedResult.pauseVerified, true);
  assert.equal(afterWindow.pauseCalls, 1);
});

test("controlled-test profile enforces a 72-hour Regina-local window and CA$25 threshold", async () => {
  const options = parseHardStopOptions([
    "--profile=controlled-test",
    "--window-start=2026-07-20T08:00",
    "--window-end=2026-07-23T08:00",
  ]);
  const api = createApi({ spendMicros: "25000000" });
  const result = await runHardStopMonitor({ api, options, now: new Date("2026-07-21T18:00:00.000Z") });
  assert.equal(result.timestampLocal, "2026-07-21T12:00:00");
  assert.equal(result.thresholdCad, 25);
  assert.equal(result.approvedCapCad, 30);
  assert.equal(result.action, "WOULD_PAUSE");
  assert.throws(() => parseHardStopOptions([
    "--profile=controlled-test",
    "--window-start=2026-07-20T08:00",
    "--window-end=2026-07-23T09:00",
  ]), /cannot exceed 72 hours/);
  assert.throws(() => parseHardStopOptions([
    "--profile=controlled-test",
    "--window-start=2026-07-20T08:30",
    "--window-end=2026-07-23T08:00",
  ]), /must use whole hours/);
});

test("controlled-test cumulative spend excludes hours outside the approved local window", async () => {
  const options = parseHardStopOptions([
    "--profile=controlled-test",
    "--window-start=2026-07-20T08:00",
    "--window-end=2026-07-23T08:00",
  ]);
  const api = createApi({ spendRows: [
    { customerId: ACCOUNT.id, date: "2026-07-20", hour: 7, costMicros: "100000000" },
    { customerId: ACCOUNT.id, date: "2026-07-20", hour: 8, costMicros: "10000000" },
    { customerId: ACCOUNT.id, date: "2026-07-23", hour: 7, costMicros: "10000000" },
    { customerId: ACCOUNT.id, date: "2026-07-23", hour: 8, costMicros: "100000000" },
  ] });
  const result = await runHardStopMonitor({ api, options, now: new Date("2026-07-21T18:00:00.000Z") });
  assert.equal(result.spendCad, 20);
  assert.equal(result.outcome, "BELOW_STOP");
});

test("dry-run rejects the wrong account and an incomplete or renamed campaign allowlist without mutation", async () => {
  for (const api of [
    createApi({ account: { ...ACCOUNT, id: "2200538686" } }),
    createApi({ campaigns: ACTIVE_CAMPAIGNS.slice(0, 2) }),
    createApi({ campaigns: ACTIVE_CAMPAIGNS.map((campaign, index) => index === 0 ? { ...campaign, name: "Wrong" } : campaign) }),
  ]) {
    const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "ERROR");
    assert.equal(result.action, "NONE");
    assert.equal(api.pauseCalls, 0);
  }
});

test("execute mode fail-closes on account identity or campaign validation failure", async () => {
  const wrongAccount = createApi({ account: { ...ACCOUNT, id: "2200538686" } });
  const wrongAccountResult = await runHardStopMonitor({ api: wrongAccount, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(wrongAccountResult.outcome, "ERROR");
  assert.equal(wrongAccountResult.action, "NONE");
  assert.equal(wrongAccountResult.accountVerified, false);
  assert.equal(wrongAccount.pauseCalls, 0);

  for (const api of [
    createApi({ campaigns: ACTIVE_CAMPAIGNS.slice(0, 2) }),
    createApi({ campaigns: ACTIVE_CAMPAIGNS.map((campaign, index) => index === 0 ? { ...campaign, name: "Wrong" } : campaign) }),
  ]) {
    const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
    assert.equal(result.outcome, "ERROR_PAUSE_UNVERIFIED");
    assert.equal(result.action, "PAUSE_ATTEMPTED");
    assert.equal(result.pauseVerified, false);
    assert.equal(api.pauseCalls, 1);
  }
});

test("unexpected enabled campaign spend is account-wide and every enabled campaign is paused", async () => {
  const api = createApi({
    campaigns: [...ACTIVE_CAMPAIGNS, UNEXPECTED_CAMPAIGN],
    spendRows: [{ customerId: ACCOUNT.id, date: "2026-07-21", hour: 12, costMicros: "1250000000" }],
  });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.outcome, "ERROR_FAIL_CLOSED_PAUSED");
  assert.equal(result.pauseVerified, true);
  assert.equal(api.pauseCalls, 1);
  assert.deepEqual(
    api.pauseTargets.map((campaign) => campaign.id).sort(),
    [...HARD_STOP_CAMPAIGNS.map((campaign) => campaign.id), UNEXPECTED_CAMPAIGN.id].sort(),
  );
  assert.ok(result.campaignsAfter.every((campaign) => campaign.status === "PAUSED"));
});

test("pausing is idempotent when all campaigns are already paused", async () => {
  const api = createApi({ campaigns: PAUSED_CAMPAIGNS, spendMicros: "1300000000" });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.action, "ALREADY_PAUSED");
  assert.equal(result.pauseVerified, true);
  assert.equal(api.pauseCalls, 0);
});

test("execute mode fails closed by pausing when cumulative spend cannot be read", async () => {
  const api = createApi({ readSpendError: new Error("report unavailable") });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ERROR_FAIL_CLOSED_PAUSED");
  assert.equal(result.action, "PAUSED");
  assert.equal(result.pauseVerified, true);
  assert.equal(api.pauseCalls, 1);
});

test("dry-run spend errors fail loudly without mutation", async () => {
  const api = createApi({ readSpendError: new Error("report unavailable") });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, false);
  assert.equal(result.outcome, "ERROR");
  assert.equal(result.action, "NONE");
  assert.match(result.error, /could not be verified/);
  assert.equal(api.pauseCalls, 0);
});

test("pause API and pause readback failures are loud and never reported as stopped", async () => {
  for (const api of [
    createApi({ spendMicros: "1300000000", pauseError: new Error("mutation denied") }),
    createApi({ spendMicros: "1300000000", stayEnabledAfterPause: true }),
  ]) {
    const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "ERROR_PAUSE_UNVERIFIED");
    assert.equal(result.pauseVerified, false);
  }
});

test("wrong or unreadable account identity never mutates; verified-account campaign read failure attempts fail-closed pause", async () => {
  const accountReadFailure = createApi({ readAccountError: new Error("auth denied") });
  const accountResult = await runHardStopMonitor({ api: accountReadFailure, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(accountResult.outcome, "ERROR");
  assert.equal(accountResult.action, "NONE");
  assert.equal(accountResult.accountVerified, false);
  assert.equal(accountReadFailure.pauseCalls, 0);

  const campaignReadFailure = createApi({ readCampaignsError: new Error("campaign read denied") });
  const campaignResult = await runHardStopMonitor({ api: campaignReadFailure, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(campaignResult.outcome, "ERROR_PAUSE_UNVERIFIED");
  assert.equal(campaignResult.action, "PAUSE_ATTEMPTED");
  assert.equal(campaignResult.pauseVerified, false);
  assert.equal(campaignReadFailure.pauseCalls, 1);
});

test("spend aggregation is exact-account-wide and rejects a different customer", () => {
  const spend = sumSpendMicros([
    { customerId: ACCOUNT.id, date: "2026-07-21", hour: 12, costMicros: "800000000" },
    { customerId: ACCOUNT.id, date: "2026-11-30", hour: 13, costMicros: "500000000" },
  ], { windowStart: "2026-07-20T00:00", windowEnd: "2026-12-31T00:00" });
  assert.equal(spend.cad, 1300);
  assert.throws(() => sumSpendMicros([
    { customerId: "2200538686", date: "2026-07-21", hour: 12, costMicros: "1" },
  ], { windowStart: "2026-07-20T00:00", windowEnd: "2026-12-31T00:00" }), /not for the True Color account/);
});

test("the approved public window uses inclusive Regina calendar dates in GAQL", () => {
  assert.deepEqual(gaqlDateRange("2026-07-20T00:00", "2026-12-31T00:00"), {
    startDate: "2026-07-20",
    endDate: "2026-12-30",
  });
  assert.equal(localNow(new Date("2026-07-20T06:00:00.000Z")), "2026-07-20T00:00:00");
});
