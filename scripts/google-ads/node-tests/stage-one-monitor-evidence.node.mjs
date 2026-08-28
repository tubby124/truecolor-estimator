import assert from "node:assert/strict";
import test from "node:test";
import {
  MONITOR_EVIDENCE_MAX_AGE_MS,
  readFreshProductionMonitorEvidence,
  validateProductionMonitorEvidence,
} from "../stage-one-monitor-evidence.mjs";

const NOW = Date.parse("2026-08-28T18:00:00.000Z");

function receipt(overrides = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    at: "2026-08-28T17:55:00.000Z",
    detail: {
      schedulerSource: "RAILWAY",
      ok: true,
      customerId: "1072816342",
      profile: "public-pilot",
      executionMode: "EXECUTE",
      timeZone: "America/Regina",
      accountVerified: true,
      spendScope: "EXACT_ACCOUNT_TOTAL",
      warningCad: 450,
      thresholdCad: 600,
      approvedCapCad: 650,
      action: "NONE",
      outcome: "WARNING",
      ...overrides,
    },
  };
}

test("accepts only a fresh exact Railway public-pilot heartbeat", () => {
  assert.equal(MONITOR_EVIDENCE_MAX_AGE_MS, 10 * 60 * 1000);
  assert.deepEqual(validateProductionMonitorEvidence(receipt(), { nowMs: NOW }), {
    id: "00000000-0000-4000-8000-000000000001",
    at: "2026-08-28T17:55:00.000Z",
  });
});

test("rejects stale, wrong-source, wrong-threshold, unsafe, and mutating evidence", () => {
  const cases = [
    { value: { ...receipt(), at: "2026-08-28T17:49:59.999Z" }, pattern: /heartbeat age/ },
    { value: receipt({ schedulerSource: "MANUAL" }), pattern: /schedulerSource/ },
    { value: receipt({ thresholdCad: 650 }), pattern: /thresholdCad/ },
    { value: receipt({ approvedCapCad: 600 }), pattern: /approvedCapCad/ },
    { value: receipt({ outcome: "STOPPED" }), pattern: /outcome/ },
    { value: receipt({ action: "PAUSED" }), pattern: /action/ },
  ];
  for (const { value, pattern } of cases) {
    assert.throws(() => validateProductionMonitorEvidence(value, { nowMs: NOW }), pattern);
  }
});

test("reads the latest persisted heartbeat without exposing the service credential", async () => {
  let request;
  const result = await readFreshProductionMonitorEvidence({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      SUPABASE_SECRET_KEY: "secret-key",
    },
    nowMs: NOW,
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return { ok: true, json: async () => [receipt()] };
    },
  });
  assert.equal(result.id, receipt().id);
  assert.match(request.url, /event_type=eq\.google_ads\.monitor\.heartbeat/);
  assert.equal(request.init.headers.authorization, "Bearer secret-key");
  assert.doesNotMatch(request.url, /secret-key/);
});
