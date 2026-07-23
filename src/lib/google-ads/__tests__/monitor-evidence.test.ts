import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { persistGoogleAdsMonitorEvidence } from "../monitor-evidence";

const AUDIT_RUN_ID = `monitor_${"a".repeat(32)}`;
const RECEIPT = {
  id: "11111111-1111-4111-8111-111111111111",
  at: "2026-07-23T22:15:00.100Z",
};

function controlledResult() {
  return {
    ok: true,
    customerId: "1072816342",
    profile: "controlled-test",
    executionMode: "EXECUTE",
    timeZone: "America/Regina",
    accountVerified: true,
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: 25,
    thresholdCad: 25,
    approvedCapCad: 30,
    outcome: "BELOW_STOP",
    action: "NONE",
    spendCad: 0,
    spendMicros: "0",
    timestampUtc: "2026-07-23T22:15:00.000Z",
    timestampLocal: "2026-07-23T16:15:00",
    windowStartLocal: "2026-07-23T16:00",
    windowEndLocal: "2026-07-26T16:00",
    campaignsBefore: [
      { id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026", status: "PAUSED" },
      { id: "24048123061", name: "GOOG_Search_TC_CompetitorConquest_2026", status: "PAUSED" },
      { id: "24048123064", name: "GOOG_Search_TC_BrandDefense_2026", status: "PAUSED" },
    ],
  };
}

describe("Google Ads monitor evidence", () => {
  it("persists a sanitized, uniquely identified controlled heartbeat", async () => {
    const record = vi.fn().mockResolvedValue(RECEIPT);
    const persisted = await persistGoogleAdsMonitorEvidence(controlledResult(), {
      auditRunId: AUDIT_RUN_ID,
      schedulerSource: "RAILWAY",
      record,
    });

    expect(persisted).toMatchObject({
      auditRunId: AUDIT_RUN_ID,
      databaseEventId: RECEIPT.id,
      persistedAtUtc: RECEIPT.at,
      schedulerSource: "RAILWAY",
      evidencePersisted: true,
      activationEligible: true,
    });
    expect(record).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "google_ads.monitor.heartbeat",
      entity_id: AUDIT_RUN_ID,
      detail: expect.objectContaining({
        auditRunId: AUDIT_RUN_ID,
        schedulerSource: "RAILWAY",
        activationEligible: true,
        customerId: "1072816342",
        profile: "controlled-test",
        spendMicros: "0",
        campaignsBefore: expect.arrayContaining([
          { id: "24048123058", name: "GOOG_Search_TC_CoreProducts_2026", status: "PAUSED" },
        ]),
      }),
    }));
  });

  it("fails closed when controlled-test evidence cannot be written", async () => {
    await expect(persistGoogleAdsMonitorEvidence(controlledResult(), {
      auditRunId: AUDIT_RUN_ID,
      record: vi.fn().mockResolvedValue(null),
    })).rejects.toThrow("could not be persisted");
  });

  it("fails closed when public-pilot evidence cannot be written", async () => {
    await expect(persistGoogleAdsMonitorEvidence(
      { ...controlledResult(), profile: "public-pilot" },
      {
        auditRunId: AUDIT_RUN_ID,
        record: vi.fn().mockResolvedValue(null),
      },
    )).rejects.toThrow("could not be persisted");
  });

  it("persists non-Railway controlled runs without treating them as activation proof", async () => {
    const persisted = await persistGoogleAdsMonitorEvidence(controlledResult(), {
      auditRunId: AUDIT_RUN_ID,
      schedulerSource: "MANUAL",
      record: vi.fn().mockResolvedValue(RECEIPT),
    });
    expect(persisted.activationEligible).toBe(false);
  });

  it("fails closed on an incomplete controlled campaign inventory", async () => {
    await expect(persistGoogleAdsMonitorEvidence(
      {
        ...controlledResult(),
        campaignsBefore: controlledResult().campaignsBefore.slice(0, 2),
      },
      {
        auditRunId: AUDIT_RUN_ID,
        schedulerSource: "RAILWAY",
        record: vi.fn().mockResolvedValue(RECEIPT),
      },
    )).rejects.toThrow("campaign inventory is incomplete");
  });

  it("rejects caller-supplied evidence IDs outside the monitor namespace", async () => {
    await expect(persistGoogleAdsMonitorEvidence(controlledResult(), {
      auditRunId: "cronrun_001",
      record: vi.fn().mockResolvedValue(RECEIPT),
    })).rejects.toThrow("audit run ID is invalid");
  });

  it("persists full evidence before recording a successful route heartbeat", () => {
    const route = readFileSync(
      new URL("../../../app/api/cron/google-ads-monitor/route.ts", import.meta.url),
      "utf8",
    );
    const evidenceWrite = route.indexOf(
      "await persistGoogleAdsMonitorEvidence(monitorResult, {",
    );
    const heartbeatWrite = route.indexOf(
      'await recordCronRun("google-ads-monitor", result.ok, detail)',
    );

    expect(evidenceWrite).toBeGreaterThan(-1);
    expect(heartbeatWrite).toBeGreaterThan(evidenceWrite);
  });
});
