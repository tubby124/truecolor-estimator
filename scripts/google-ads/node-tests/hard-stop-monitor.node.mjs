import assert from "node:assert/strict";
import test from "node:test";
import {
  HARD_STOP_CAMPAIGNS,
  gaqlDateRange,
  localNow,
  parseHardStopOptions,
} from "../hard-stop-contract.mjs";
import { runHardStopMonitor } from "../hard-stop-monitor.mjs";

const ACCOUNT = { id: "1072816342", currencyCode: "CAD", timeZone: "America/Regina" };
const ACTIVE_CAMPAIGNS = HARD_STOP_CAMPAIGNS.map((campaign) => ({ ...campaign, status: "ENABLED" }));
const PAUSED_CAMPAIGNS = HARD_STOP_CAMPAIGNS.map((campaign) => ({ ...campaign, status: "PAUSED" }));
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
  let paused = campaigns.every((campaign) => campaign.status === "PAUSED");
  let pauseCalls = 0;
  return {
    get pauseCalls() { return pauseCalls; },
    async readAccount() {
      if (readAccountError) throw readAccountError;
      return account;
    },
    async readCampaigns() {
      if (readCampaignsError) throw readCampaignsError;
      return campaigns.map((campaign) => ({ ...campaign, status: paused && !stayEnabledAfterPause ? "PAUSED" : campaign.status }));
    },
    async readSpend() {
      if (readSpendError) throw readSpendError;
      return spendRows ?? [{ id: HARD_STOP_CAMPAIGNS[0].id, date: "2026-07-21", hour: 12, costMicros: spendMicros }];
    },
    async pauseCampaigns(targets) {
      pauseCalls += 1;
      assert.deepEqual(targets, HARD_STOP_CAMPAIGNS);
      if (pauseError) throw pauseError;
      paused = true;
    },
  };
}

test("defaults to read-only below the public-pilot threshold", async () => {
  const api = createApi({ spendMicros: "1399999999" });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.executionMode, "DRY_RUN");
  assert.equal(result.outcome, "BELOW_STOP");
  assert.equal(result.action, "NONE");
  assert.equal(api.pauseCalls, 0);
});

test("dry-run reports a pause at the protective threshold without mutating", async () => {
  const api = createApi({ spendMicros: "1400000000" });
  const result = await runHardStopMonitor({ api, options: PUBLIC_OPTIONS, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "STOP_REQUIRED");
  assert.equal(result.action, "WOULD_PAUSE");
  assert.equal(result.thresholdCad, 1400);
  assert.equal(result.approvedCapCad, 1500);
  assert.equal(api.pauseCalls, 0);
});

test("explicit execute pauses every allowlisted campaign above threshold and verifies readback", async () => {
  const api = createApi({ spendMicros: "1450000000" });
  const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "STOPPED");
  assert.equal(result.action, "PAUSED");
  assert.equal(result.pauseVerified, true);
  assert.ok(result.campaignsAfter.every((campaign) => campaign.status === "PAUSED"));
  assert.equal(api.pauseCalls, 1);
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
    { id: HARD_STOP_CAMPAIGNS[0].id, date: "2026-07-20", hour: 7, costMicros: "100000000" },
    { id: HARD_STOP_CAMPAIGNS[0].id, date: "2026-07-20", hour: 8, costMicros: "10000000" },
    { id: HARD_STOP_CAMPAIGNS[1].id, date: "2026-07-23", hour: 7, costMicros: "10000000" },
    { id: HARD_STOP_CAMPAIGNS[1].id, date: "2026-07-23", hour: 8, costMicros: "100000000" },
  ] });
  const result = await runHardStopMonitor({ api, options, now: new Date("2026-07-21T18:00:00.000Z") });
  assert.equal(result.spendCad, 20);
  assert.equal(result.outcome, "BELOW_STOP");
});

test("rejects the wrong account and an incomplete or renamed campaign allowlist", async () => {
  for (const api of [
    createApi({ account: { ...ACCOUNT, id: "2200538686" } }),
    createApi({ campaigns: ACTIVE_CAMPAIGNS.slice(0, 2) }),
    createApi({ campaigns: ACTIVE_CAMPAIGNS.map((campaign, index) => index === 0 ? { ...campaign, name: "Wrong" } : campaign) }),
  ]) {
    const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "ERROR");
    assert.equal(result.action, "NONE");
    assert.equal(api.pauseCalls, 0);
  }
});

test("pausing is idempotent when all campaigns are already paused", async () => {
  const api = createApi({ campaigns: PAUSED_CAMPAIGNS, spendMicros: "1500000000" });
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
    createApi({ spendMicros: "1500000000", pauseError: new Error("mutation denied") }),
    createApi({ spendMicros: "1500000000", stayEnabledAfterPause: true }),
  ]) {
    const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "ERROR_PAUSE_UNVERIFIED");
    assert.equal(result.pauseVerified, false);
  }
});

test("account and campaign read errors fail loudly without an unsafe mutation", async () => {
  for (const api of [
    createApi({ readAccountError: new Error("auth denied") }),
    createApi({ readCampaignsError: new Error("campaign read denied") }),
  ]) {
    const result = await runHardStopMonitor({ api, options: { ...PUBLIC_OPTIONS, execute: true }, now: PUBLIC_NOW });
    assert.equal(result.ok, false);
    assert.equal(result.outcome, "ERROR");
    assert.equal(api.pauseCalls, 0);
  }
});

test("the approved public window uses inclusive Regina calendar dates in GAQL", () => {
  assert.deepEqual(gaqlDateRange("2026-07-20T00:00", "2026-08-19T00:00"), {
    startDate: "2026-07-20",
    endDate: "2026-08-18",
  });
  assert.equal(localNow(new Date("2026-07-20T06:00:00.000Z")), "2026-07-20T00:00:00");
});
