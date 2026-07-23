import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  buildControlledTestAttestation,
  deriveDurableMonitorProofs,
  selectLatestHeartbeatSequence,
} from "../build-controlled-test-attestation.mjs";
import {
  CONTROLLED_TEST,
  validateMonitorAttestation,
} from "../controlled-test-contract.mjs";
import { runMonitorSafetyDrill } from "../monitor-safety-drill.mjs";

const NOW = new Date("2026-07-23T19:30:00.000Z");
const SECRET = "test-only-controlled-attestation-secret-2026";

function summaryDigest(summary) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(summary))
    .digest("hex")}`;
}

function heartbeatRow(index, minute, overrides = {}) {
  const timestampUtc = `2026-07-23T19:${String(minute).padStart(2, "0")}:00.000Z`;
  const auditRunId = `monitor_${String(index).padStart(32, "a")}`;
  return {
    id: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    at: `2026-07-23T19:${String(minute).padStart(2, "0")}:00.100Z`,
    actor_type: "cron",
    actor_id: "google-ads-monitor",
    event_type: "google_ads.monitor.heartbeat",
    entity_type: "google_ads_account",
    entity_id: auditRunId,
    detail: {
      auditRunId,
      schedulerSource: "RAILWAY",
      activationEligible: true,
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
      spendMicros: "0",
      timestampUtc,
      timestampLocal: `2026-07-23T13:${String(minute).padStart(2, "0")}:00`,
      windowStartLocal: "2026-07-23T13:00",
      windowEndLocal: "2026-07-26T13:00",
      pauseVerified: false,
      campaignsBefore: CONTROLLED_TEST.campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: "PAUSED",
      })),
      campaignsAfter: [],
      ...overrides,
    },
  };
}

function proofRow(index, name, eventType) {
  const evidenceId = `drill_${name}_20260723`;
  const summary = {
    warning: {
      kind: "warning",
      ok: true,
      outcome: "WARNING",
      action: "NONE",
      pauseVerified: false,
      telegramMessageId: "42",
    },
    pause: {
      kind: "pause",
      ok: true,
      outcome: "STOPPED",
      action: "PAUSED",
      pauseVerified: true,
    },
    failclosed: {
      kind: "failclosed",
      ok: false,
      outcome: "ERROR_FAIL_CLOSED_PAUSED",
      action: "PAUSED",
      pauseVerified: true,
    },
  }[name];
  summary.campaignIds = CONTROLLED_TEST.campaigns
    .map((campaign) => campaign.id)
    .sort();
  return {
    id: `30000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    at: "2026-07-23T19:20:00.100Z",
    actor_type: "system",
    actor_id: "google-ads-monitor-safety-drill",
    event_type: eventType,
    entity_type: "google_ads_monitor_drill",
    entity_id: evidenceId,
    detail: {
      evidenceId,
      verified: true,
      source: "MONITOR_SAFETY_DRILL",
      drillVersion: 1,
      checkedAtUtc: "2026-07-23T19:20:00.000Z",
      artifactDigest: summaryDigest(summary),
      summary,
    },
  };
}

const proofRows = [
  proofRow(1, "warning", "google_ads.monitor.drill.warning_alert_verified"),
  proofRow(2, "pause", "google_ads.monitor.drill.protective_pause_verified"),
  proofRow(3, "failclosed", "google_ads.monitor.drill.fail_closed_verified"),
];

const promotion = {
  evidenceId: "promo_ui_20260723",
  verified: true,
  source: "GOOGLE_ADS_UI",
  status: "ACTIVE",
  currency: "CAD",
  requiredQualifyingSpendCad: 600,
  checkedAtUtc: "2026-07-23T19:20:00.000Z",
  eligibilityWindowStartUtc: "2026-07-20T06:00:00.000Z",
  eligibilityWindowEndUtc: "2026-09-18T06:00:00.000Z",
};

const liveVerification = {
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
    unexpectedSpendCad: 0,
  },
};

test("durable rows build and sign an attestation accepted by the controller", () => {
  const heartbeatRows = [
    heartbeatRow(1, 0),
    heartbeatRow(2, 15),
    heartbeatRow(3, 30),
  ];
  const attestation = buildControlledTestAttestation({
    heartbeatRows,
    proofRows,
    promotion,
    liveVerification,
    signingSecret: SECRET,
    now: NOW,
  });
  const validated = validateMonitorAttestation(attestation, {
    now: NOW,
    signingSecret: SECRET,
  });
  assert.equal(validated.heartbeatCount, 3);
  assert.deepEqual(
    attestation.heartbeats.map((heartbeat) => heartbeat.databaseEventId),
    heartbeatRows.map((row) => row.id),
  );
});

test("rapid, mixed-source, replayed, and timestamp-drift evidence is rejected", () => {
  const valid = [heartbeatRow(1, 0), heartbeatRow(2, 15), heartbeatRow(3, 30)];
  const cases = [
    [
      heartbeatRow(1, 0),
      heartbeatRow(2, 0, {
        timestampUtc: "2026-07-23T19:00:10.000Z",
        timestampLocal: "2026-07-23T13:00:10",
      }),
      heartbeatRow(3, 0, {
        timestampUtc: "2026-07-23T19:00:20.000Z",
        timestampLocal: "2026-07-23T13:00:20",
      }),
    ],
    valid.map((row, index) => index === 1
      ? { ...row, detail: { ...row.detail, schedulerSource: "GITHUB_BACKUP" } }
      : row),
    valid.map((row, index) => index === 2 ? { ...row, id: valid[1].id } : row),
    valid.map((row, index) => index === 2
      ? { ...row, at: "2026-07-23T19:31:00.000Z" }
      : row),
  ];
  for (const rows of cases) {
    assert.throws(() => selectLatestHeartbeatSequence(rows, { now: NOW }));
  }
});

test("durable proof flags cannot be derived without all three fresh rows", () => {
  assert.throws(
    () => deriveDurableMonitorProofs(proofRows.slice(0, 2), { now: NOW }),
    /missing or stale/,
  );
});

test("tampered safety summaries, digests, Telegram IDs, and persistence times are rejected", () => {
  const cases = [
    (rows) => {
      rows[0].detail.summary.outcome = "BELOW_STOP";
      rows[0].detail.artifactDigest = summaryDigest(rows[0].detail.summary);
    },
    (rows) => {
      rows[1].detail.summary.pauseVerified = false;
      rows[1].detail.artifactDigest = summaryDigest(rows[1].detail.summary);
    },
    (rows) => {
      rows[2].detail.artifactDigest = `sha256:${"f".repeat(64)}`;
    },
    (rows) => {
      delete rows[0].detail.summary.telegramMessageId;
      rows[0].detail.artifactDigest = summaryDigest(rows[0].detail.summary);
    },
    (rows) => {
      rows[1].at = "2026-07-23T19:21:00.000Z";
    },
  ];
  for (const mutate of cases) {
    const rows = structuredClone(proofRows);
    mutate(rows);
    assert.throws(
      () => deriveDurableMonitorProofs(rows, { now: NOW }),
      /missing or stale/,
    );
  }
});

test("safety drill exercises warning, protective pause, fail closed, Telegram, and persistence", async () => {
  const messages = [];
  const recorded = [];
  const result = await runMonitorSafetyDrill({
    now: NOW,
    notify: async (message) => {
      messages.push(message);
      return 42;
    },
    record: async (events) => {
      recorded.push(...events);
      return events.map((event, index) => ({
        id: `40000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        at: NOW.toISOString(),
        entity_id: event.entity_id,
      }));
    },
  });
  assert.equal(result.ok, true);
  assert.equal(messages.length, 1);
  assert.deepEqual(
    recorded.map((event) => event.event_type),
    [
      "google_ads.monitor.drill.warning_alert_verified",
      "google_ads.monitor.drill.protective_pause_verified",
      "google_ads.monitor.drill.fail_closed_verified",
    ],
  );
  assert.ok(recorded.every((event) => /^sha256:[a-f0-9]{64}$/.test(event.detail.artifactDigest)));
});
