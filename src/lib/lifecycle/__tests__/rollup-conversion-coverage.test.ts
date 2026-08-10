import { describe, expect, it } from "vitest";

import { buildRollup, type RollupInputs } from "../rollup";

/**
 * Coverage for the blind spot underneath the measurement-outbox checks: those
 * only summarize outbox rows that EXIST, so a paid order that never produced a
 * row is invisible to all of them. 95 of 98 paid orders leaked through that gap
 * over 90 days while the dashboard stayed green.
 */
const baseInputs = (overrides: Partial<RollupInputs> = {}): RollupInputs => ({
  bookkeepingRisks: [],
  webhookGroups: [],
  heartbeats: [],
  waveDrafts: [],
  orphans: [],
  reconcileDetail: null,
  cloverOrders24h: 0,
  stuckCloverAttempts: 0,
  seoProtectedPagesStaleDays: null,
  gscVsGa4DivergencePct: null,
  googleAdsMonitorDetail: null,
  googleAdsEnabledFor48h: false,
  measurementOutboxes: {
    revenue: { queryFailed: 0, dead: 0, staleProcessing: 0, overdueRetry: 0 },
    quote: { queryFailed: 0, dead: 0, staleProcessing: 0, overdueRetry: 0 },
  },
  paidOrdersMissingConversionType7d: 0,
  paidOrdersMissingOutboxRow7d: 0,
  wavePaymentEffects: { queryFailed: 0, dead: 0, staleProcessing: 0, overdueRetry: 0 },
  waveProvisioning: { staleCreating: 0, ambiguous: 0, failed: 0 },
  quoteDeliveries: {
    publicStale: 0,
    publicFailedUnresolved: 0,
    pricedStale: 0,
    pricedFailedUnresolved: 0,
    publicQueryError: 0,
    pricedQueryError: 0,
  },
  paidSearchWeekly: { rows: [], queryFailed: false },
  ...overrides,
});

describe("paid revenue that never reached the conversion outbox", () => {
  it("is silent when every paid order is classified and enqueued", () => {
    const rollup = buildRollup(baseInputs());
    expect(rollup.reds.map((i) => i.key)).not.toContain("conversion:missing-type");
    expect(rollup.yellows.map((i) => i.key)).not.toContain("conversion:missing-outbox-row");
  });

  it("is RED when a paid order carries no conversion_type", () => {
    const rollup = buildRollup(baseInputs({ paidOrdersMissingConversionType7d: 95 }));
    expect(rollup.reds).toContainEqual(expect.objectContaining({
      key: "conversion:missing-type",
      panel: "panel-cron-heartbeats",
      label: expect.stringContaining("95 paid order(s)"),
    }));
    // Unclassified orders are RED only — they must not also raise the yellow.
    expect(rollup.yellows.map((i) => i.key)).not.toContain("conversion:missing-outbox-row");
  });

  it("is YELLOW when a classified paid order has no outbox row", () => {
    const rollup = buildRollup(baseInputs({ paidOrdersMissingOutboxRow7d: 3 }));
    expect(rollup.yellows).toContainEqual(expect.objectContaining({
      key: "conversion:missing-outbox-row",
      panel: "panel-cron-heartbeats",
      label: expect.stringContaining("3 classified paid order(s)"),
    }));
    expect(rollup.reds).toHaveLength(0);
  });

  it("reports both classes independently", () => {
    const rollup = buildRollup(baseInputs({
      paidOrdersMissingConversionType7d: 2,
      paidOrdersMissingOutboxRow7d: 4,
    }));
    expect(rollup.reds.map((i) => i.key)).toContain("conversion:missing-type");
    expect(rollup.yellows.map((i) => i.key)).toContain("conversion:missing-outbox-row");
  });

  it("stays quiet while the existing outbox checks are the only thing failing", () => {
    // Guards against the reverse regression: a dead outbox row must not be
    // double-reported as a missing one.
    const rollup = buildRollup(baseInputs({
      measurementOutboxes: {
        revenue: { queryFailed: 0, dead: 1, staleProcessing: 0, overdueRetry: 0 },
        quote: { queryFailed: 0, dead: 0, staleProcessing: 0, overdueRetry: 0 },
      },
    }));
    expect(rollup.reds.map((i) => i.key)).toEqual(["measurement-outbox:revenue:dead"]);
  });
});
