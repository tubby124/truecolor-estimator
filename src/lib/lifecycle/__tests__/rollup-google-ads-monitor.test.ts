import { describe, expect, it } from "vitest";

import { buildRollup, type RollupInputs } from "../rollup";

const inputs = (heartbeat: RollupInputs["heartbeats"][number]): RollupInputs => ({
  bookkeepingRisks: [],
  webhookGroups: [],
  heartbeats: [heartbeat],
  waveDrafts: [],
  orphans: [],
  reconcileDetail: null,
  cloverOrders24h: 0,
  stuckCloverAttempts: 0,
  seoProtectedPagesStaleDays: null,
  gscVsGa4DivergencePct: null,
  googleAdsMonitorDetail: null,
  measurementOutboxes: {
    revenue: { dead: 0, staleProcessing: 0, overdueRetry: 0 },
    quote: { dead: 0, staleProcessing: 0, overdueRetry: 0 },
  },
  waveProvisioning: { staleCreating: 0, ambiguous: 0, failed: 0 },
});

const heartbeat = (
  hoursAgo: number | null,
  name = "google-ads-monitor",
): RollupInputs["heartbeats"][number] => ({
  name,
  last_ran_at: hoursAgo === null ? null : "2026-07-20T12:00:00.000Z",
  hours_ago: hoursAgo,
  max_age_hours: 0.5,
  ok: hoursAgo !== null,
  stale: hoursAgo === null || hoursAgo > 0.5,
  detail: hoursAgo === null ? "never ran" : "outcome=BELOW_STOP",
  runs_24h: hoursAgo === null ? 0 : 1,
  errored_runs_24h: 0,
  error_rate_24h: hoursAgo === null ? null : 0,
});

describe("Google Ads monitor heartbeat rollup", () => {
  it("is red immediately when the monitor has never run", () => {
    const rollup = buildRollup(inputs(heartbeat(null)));
    expect(rollup.reds).toContainEqual(expect.objectContaining({
      key: "cron:google-ads-monitor:stale",
      label: expect.stringContaining("never ran"),
    }));
  });

  it("is red as soon as the declared 30-minute maximum age is exceeded", () => {
    const rollup = buildRollup(inputs(heartbeat(0.51)));
    expect(rollup.reds).toContainEqual(expect.objectContaining({
      key: "cron:google-ads-monitor:stale",
      label: expect.stringContaining("max 30m"),
    }));
  });
});

describe("Google Ads conversion delivery rollup", () => {
  it("treats the conversion worker as a critical 30-minute cron", () => {
    const rollup = buildRollup(inputs(heartbeat(null, "google-ads-conversions")));
    expect(rollup.reds).toContainEqual(expect.objectContaining({
      key: "cron:google-ads-conversions:stale",
      label: expect.stringContaining("never ran"),
    }));
  });

  it("escalates persistent conversion delivery failures to red", () => {
    const failingHeartbeat = heartbeat(0.1, "google-ads-conversions");
    failingHeartbeat.runs_24h = 2;
    failingHeartbeat.errored_runs_24h = 1;
    failingHeartbeat.error_rate_24h = 0.5;

    const rollup = buildRollup(inputs(failingHeartbeat));
    expect(rollup.reds).toContainEqual(expect.objectContaining({
      key: "cron:google-ads-conversions:persistent-fail",
    }));
  });

  it("surfaces every revenue and quote outbox failure class with stable keys", () => {
    const rollupInputs = inputs(heartbeat(0.1, "google-ads-conversions"));
    rollupInputs.measurementOutboxes = {
      revenue: { dead: 1, staleProcessing: 2, overdueRetry: 3 },
      quote: { dead: 4, staleProcessing: 5, overdueRetry: 6 },
    };

    const keys = buildRollup(rollupInputs).reds.map((issue) => issue.key);
    expect(keys).toEqual(expect.arrayContaining([
      "measurement-outbox:revenue:dead",
      "measurement-outbox:revenue:stale-processing",
      "measurement-outbox:revenue:overdue-retry",
      "measurement-outbox:quote:dead",
      "measurement-outbox:quote:stale-processing",
      "measurement-outbox:quote:overdue-retry",
    ]));
  });
});

describe("Wave-before-Clover provisioning rollup", () => {
  it("surfaces every durable checkout-blocking state with stable red keys", () => {
    const rollupInputs = inputs(heartbeat(0.1));
    rollupInputs.waveProvisioning = { staleCreating: 1, ambiguous: 2, failed: 3 };

    expect(buildRollup(rollupInputs).reds.map((issue) => issue.key)).toEqual(expect.arrayContaining([
      "wave-provisioning:stale-creating",
      "wave-provisioning:ambiguous",
      "wave-provisioning:failed",
    ]));
  });
});
