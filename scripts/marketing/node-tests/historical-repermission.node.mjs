import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_FIRST_BATCH,
  assertFirstBatchCap,
  buildCampaignHtml,
  isHistoricalCandidate,
  makePreferenceToken,
} from "../historical-repermission-lib.mjs";

test("historical audience excludes consented, opted-out, and locally suppressed customers", () => {
  const completed = new Set(["eligible", "suppressed"]);
  const localSuppressed = new Set(["suppressed"]);
  assert.equal(isHistoricalCandidate({ id: "eligible", email: "eligible@example.com", marketing_consent: null, consent_source: null, consent_withdrawn_at: null }, completed, localSuppressed), true);
  assert.equal(isHistoricalCandidate({ id: "consented", email: "yes@example.com", marketing_consent: true, consent_source: "checkout", consent_withdrawn_at: null }, new Set(["consented"]), localSuppressed), false);
  assert.equal(isHistoricalCandidate({ id: "opted-out", email: "no@example.com", marketing_consent: false, consent_source: "unsubscribe", consent_withdrawn_at: "2026-08-01T00:00:00.000Z" }, new Set(["opted-out"]), localSuppressed), false);
  assert.equal(isHistoricalCandidate({ id: "suppressed", email: "suppressed@example.com", marketing_consent: null, consent_source: null, consent_withdrawn_at: null }, completed, localSuppressed), false);
});

test("preference tokens are opaque and campaign links carry an explicit choice", () => {
  const token = makePreferenceToken();
  assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
  const html = buildCampaignHtml("https://truecolorprinting.ca");
  assert.match(html, /stay-in-touch\?token=\{\{params\.PREFERENCE_TOKEN\}\}&choice=accept/);
  assert.match(html, /stay-in-touch\?token=\{\{params\.PREFERENCE_TOKEN\}\}&choice=decline/);
  assert.doesNotMatch(html, /five stars|discount|reward/i);
});

test("real-customer historical sends cannot exceed the pilot cap", () => {
  assert.equal(MAX_FIRST_BATCH, 10);
  assert.doesNotThrow(() => assertFirstBatchCap(10));
  assert.throws(() => assertFirstBatchCap(11), /above 10/);
  assert.throws(() => assertFirstBatchCap(0), /above 10/);
});
