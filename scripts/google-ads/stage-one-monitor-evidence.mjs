import {
  HARD_STOP_CUSTOMER_ID,
  HARD_STOP_PROFILES,
} from "./hard-stop-contract.mjs";

const EXPECTED_MONITOR = HARD_STOP_PROFILES["public-pilot"];
export const MONITOR_EVIDENCE_MAX_AGE_MS = 10 * 60 * 1000;

export function validateProductionMonitorEvidence(receipt, { nowMs = Date.now() } = {}) {
  if (!receipt?.id || !receipt?.at || !receipt?.detail) {
    throw new Error("No production Google Ads monitor heartbeat is available");
  }

  const detail = receipt.detail;
  const expectedFields = {
    schedulerSource: "RAILWAY",
    ok: true,
    customerId: HARD_STOP_CUSTOMER_ID,
    profile: "public-pilot",
    executionMode: "EXECUTE",
    timeZone: "America/Regina",
    accountVerified: true,
    spendScope: "EXACT_ACCOUNT_TOTAL",
    warningCad: EXPECTED_MONITOR.warningCad,
    thresholdCad: EXPECTED_MONITOR.thresholdCad,
    approvedCapCad: EXPECTED_MONITOR.approvedCapCad,
    action: "NONE",
  };
  const mismatches = Object.entries(expectedFields)
    .filter(([field, expected]) => detail[field] !== expected)
    .map(([field, expected]) => `${field}=${JSON.stringify(detail[field])} (expected ${JSON.stringify(expected)})`);
  if (!["BELOW_STOP", "WARNING"].includes(detail.outcome)) {
    mismatches.push(`outcome=${JSON.stringify(detail.outcome)} (expected BELOW_STOP or WARNING)`);
  }

  const recordedAt = new Date(receipt.at);
  const ageMs = nowMs - recordedAt.getTime();
  if (!Number.isFinite(recordedAt.getTime()) || ageMs < 0 || ageMs > MONITOR_EVIDENCE_MAX_AGE_MS) {
    mismatches.push(`heartbeat age must be 0-${MONITOR_EVIDENCE_MAX_AGE_MS / 60_000} minutes`);
  }
  if (mismatches.length > 0) {
    throw new Error(`Core resume blocked by production monitor evidence: ${mismatches.join("; ")}`);
  }
  return { id: String(receipt.id), at: recordedAt.toISOString() };
}

export async function readFreshProductionMonitorEvidence({
  env = process.env,
  fetchImpl = fetch,
  nowMs = Date.now(),
} = {}) {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !serviceKey) {
    throw new Error("Supabase service credentials are required for production monitor evidence");
  }
  const query = new URLSearchParams({
    select: "id,at,detail",
    event_type: "eq.google_ads.monitor.heartbeat",
    actor_id: "eq.google-ads-monitor",
    order: "at.desc",
    limit: "1",
  });
  const response = await fetchImpl(`${baseUrl}/rest/v1/audit_events?${query}`, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Production monitor evidence read failed with HTTP ${response.status}`);
  }
  const [receipt] = await response.json();
  return validateProductionMonitorEvidence(receipt, { nowMs });
}
