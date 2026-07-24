import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { evidenceDigest } from "./evidence-digest.mjs";
import {
  CONTROLLED_TEST,
  signMonitorAttestation,
  validateMonitorAttestation,
  validateMonitorHeartbeatSequence,
} from "./controlled-test-contract.mjs";

const HEARTBEAT_EVENT = "google_ads.monitor.heartbeat";
const PROOF_EVENTS = Object.freeze({
  warningAlert: "google_ads.monitor.drill.warning_alert_verified",
  protectivePause: "google_ads.monitor.drill.protective_pause_verified",
  failClosed: "google_ads.monitor.drill.fail_closed_verified",
});
const EXPECTED_CAMPAIGN_IDS = CONTROLLED_TEST.campaigns
  .map((campaign) => campaign.id)
  .sort();

function validProofSummary(summary, expectedEventType) {
  if (!summary
    || !Array.isArray(summary.campaignIds)
    || JSON.stringify([...summary.campaignIds].sort()) !== JSON.stringify(EXPECTED_CAMPAIGN_IDS)) {
    return false;
  }
  const expected = {
    "google_ads.monitor.drill.warning_alert_verified": {
      kind: "warning",
      ok: true,
      outcome: "WARNING",
      action: "NONE",
      pauseVerified: false,
    },
    "google_ads.monitor.drill.protective_pause_verified": {
      kind: "pause",
      ok: true,
      outcome: "STOPPED",
      action: "PAUSED",
      pauseVerified: true,
    },
    "google_ads.monitor.drill.fail_closed_verified": {
      kind: "failclosed",
      ok: false,
      outcome: "ERROR_FAIL_CLOSED_PAUSED",
      action: "PAUSED",
      pauseVerified: true,
    },
  }[expectedEventType];
  if (!expected
    || Object.entries(expected).some(([field, value]) => summary[field] !== value)) {
    return false;
  }
  return expectedEventType !== PROOF_EVENTS.warningAlert
    || (typeof summary.telegramMessageId === "string"
      && summary.telegramMessageId.length > 0);
}

export function heartbeatFromAuditRow(row) {
  const detail = row?.detail;
  if (!detail
    || row.event_type !== HEARTBEAT_EVENT
    || row.actor_type !== "cron"
    || row.actor_id !== "google-ads-monitor"
    || row.entity_id !== detail.auditRunId
    || detail.schedulerSource !== "RAILWAY"
    || detail.activationEligible !== true
    || typeof row.id !== "string"
    || typeof row.at !== "string") {
    return null;
  }
  return {
    ...detail,
    databaseEventId: row.id,
    persistedAtUtc: row.at,
  };
}

export function selectLatestHeartbeatSequence(rows, { now = new Date() } = {}) {
  const candidates = rows
    .map(heartbeatFromAuditRow)
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.timestampUtc) - Date.parse(b.timestampUtc));

  for (let end = candidates.length; end >= 3; end -= 1) {
    const sequence = candidates.slice(end - 3, end);
    try {
      validateMonitorHeartbeatSequence(sequence, { now });
      return sequence;
    } catch {
      // Keep searching older adjacent persisted rows for the latest valid run.
    }
  }
  throw new Error("No valid three-heartbeat Railway sequence exists in durable audit evidence");
}

function durableProofFromAuditRow(row, expectedEventType, now) {
  const detail = row?.detail;
  const checkedAt = new Date(detail?.checkedAtUtc);
  const persistedAt = new Date(row?.at);
  const ageMs = now.getTime() - checkedAt.getTime();
  const persistenceSkewMs = Math.abs(
    persistedAt.getTime() - checkedAt.getTime(),
  );
  if (!detail
    || row.event_type !== expectedEventType
    || row.actor_type !== "system"
    || row.actor_id !== "google-ads-monitor-safety-drill"
    || row.entity_type !== "google_ads_monitor_drill"
    || row.entity_id !== detail.evidenceId
    || detail.verified !== true
    || detail.source !== "MONITOR_SAFETY_DRILL"
    || detail.drillVersion !== 1
    || typeof detail.artifactDigest !== "string"
    || !/^sha256:[a-f0-9]{64}$/.test(detail.artifactDigest)
    || detail.artifactDigest !== evidenceDigest(detail.summary)
    || !validProofSummary(detail.summary, expectedEventType)
    || typeof row.id !== "string"
    || !Number.isFinite(checkedAt.getTime())
    || !Number.isFinite(persistedAt.getTime())
    || persistenceSkewMs > CONTROLLED_TEST.monitor.maximumPersistenceSkewSeconds * 1_000
    || ageMs > CONTROLLED_TEST.monitor.maximumDrillAgeHours * 3_600_000
    || ageMs < -CONTROLLED_TEST.monitor.maximumFutureSkewMinutes * 60_000) {
    return null;
  }
  return {
    eventType: expectedEventType,
    evidenceId: detail.evidenceId,
    databaseEventId: row.id,
    checkedAtUtc: checkedAt.toISOString(),
    persistedAtUtc: persistedAt.toISOString(),
    source: detail.source,
    artifactDigest: detail.artifactDigest,
    campaignIds: [...detail.summary.campaignIds].sort(),
    outcome: detail.summary.outcome,
    action: detail.summary.action,
    pauseVerified: detail.summary.pauseVerified,
    ...(expectedEventType === PROOF_EVENTS.warningAlert
      ? { telegramMessageId: detail.summary.telegramMessageId }
      : {}),
  };
}

export function deriveDurableMonitorProofs(rows, { now = new Date() } = {}) {
  const proofs = {};
  for (const [name, eventType] of Object.entries(PROOF_EVENTS)) {
    const proof = rows
      .map((row) => durableProofFromAuditRow(row, eventType, now))
      .filter(Boolean)
      .sort((a, b) => Date.parse(b.checkedAtUtc) - Date.parse(a.checkedAtUtc))[0];
    if (!proof) throw new Error(`Durable ${name} monitor drill evidence is missing or stale`);
    proofs[name] = proof;
  }
  return proofs;
}

export function buildControlledTestAttestation({
  heartbeatRows,
  proofRows,
  promotion,
  liveVerification,
  signingSecret,
  now = new Date(),
}) {
  const heartbeats = selectLatestHeartbeatSequence(heartbeatRows, { now });
  const proofs = deriveDurableMonitorProofs(proofRows, { now });
  const unsigned = {
    attestationVersion: CONTROLLED_TEST.monitor.attestationVersion,
    evidence: {
      schedulerCadenceMinutes: CONTROLLED_TEST.monitor.cadenceMinutes,
      heartbeatPersisted: true,
      warningAlertVerified: true,
      protectivePauseVerified: true,
      failClosedVerified: true,
      proofs,
    },
    promotion,
    liveVerification,
    heartbeats,
  };
  const signed = signMonitorAttestation(unsigned, signingSecret);
  validateMonitorAttestation(signed, { now, signingSecret });
  return signed;
}

async function fetchAuditRows({ supabaseUrl, serviceKey, eventType, limit = 100 }) {
  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/audit_events`);
  url.searchParams.set(
    "select",
    "id,at,actor_type,actor_id,event_type,entity_type,entity_id,detail",
  );
  url.searchParams.set("event_type", `eq.${eventType}`);
  url.searchParams.set("order", "at.desc");
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Audit evidence query failed with HTTP ${response.status}`);
  }
  return response.json();
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.+)$/.exec(arg);
    if (!match) throw new Error(`Unsupported argument: ${arg}`);
    parsed[match[1]] = match[2];
  }
  for (const required of ["promotion-proof", "live-verification", "output"]) {
    if (!parsed[required]) throw new Error(`--${required}=<path> is required`);
  }
  return parsed;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const signingSecret = process.env.GOOGLE_ADS_CONTROLLED_TEST_ATTESTATION_SECRET;
  if (!supabaseUrl || !serviceKey || !signingSecret) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and GOOGLE_ADS_CONTROLLED_TEST_ATTESTATION_SECRET are required",
    );
  }
  const [heartbeatRows, proofRowGroups, promotionDocument, liveDocument] = await Promise.all([
    fetchAuditRows({ supabaseUrl, serviceKey, eventType: HEARTBEAT_EVENT }),
    Promise.all(
      Object.values(PROOF_EVENTS).map((eventType) => fetchAuditRows({
        supabaseUrl,
        serviceKey,
        eventType,
        limit: 10,
      })),
    ),
    readJson(args["promotion-proof"]),
    readJson(args["live-verification"]),
  ]);
  const promotion = promotionDocument.promotion ?? promotionDocument;
  const liveVerification = liveDocument.activationClearance
    ?? liveDocument.liveVerification
    ?? liveDocument;
  const attestation = buildControlledTestAttestation({
    heartbeatRows,
    proofRows: proofRowGroups.flat(),
    promotion,
    liveVerification,
    signingSecret,
  });
  await writeFile(args.output, `${JSON.stringify(attestation, null, 2)}\n`, {
    mode: 0o600,
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      output: args.output,
      heartbeatAuditRunIds: attestation.heartbeats.map((item) => item.auditRunId),
      proofEvidenceIds: Object.values(attestation.evidence.proofs).map((item) => item.evidenceId),
    }, null, 2)}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
