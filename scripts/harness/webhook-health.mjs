#!/usr/bin/env node
/**
 * webhook-health.mjs — Phase 1 harness (Domain B: inbound webhook spine)
 *
 * Answers the question Hasan can't currently see: "are the payment webhooks
 * alive and fail-CLOSED?" A single rotated/misconfigured secret silently drops
 * EVERY payment for that channel — order stuck unpaid, nothing errors.
 *
 * The three webhooks use THREE DIFFERENT auth schemes (verified against the
 * route handlers 2026-05-25):
 *   - Clover : Clover-Signature HMAC via CLOVER_SIGNING_SECRET, with legacy
 *              shared-secret QUERY PARAM ?k=<CLOVER_WEBHOOK_SECRET> during transition
 *   - Wave   : HMAC-SHA256 header         x-wave-signature: sha256=<hex over raw body>
 *   - Brevo  : Bearer token               Authorization: Bearer <BREVO_WEBHOOK_SECRET>
 *
 * SAFETY: this harness NEVER sends a valid "paid"/"captured" event that could
 * match a real order. It only:
 *   (a) checks local env var FORMAT (--env), and
 *   (b) probes each endpoint with a DELIBERATELY-INVALID credential and asserts
 *       the endpoint rejects it (401/503) — proving alive + fail-closed (--probe).
 *   (c) optional Wave VALID-signature test uses a benign body the handler ignores
 *       (resourceType != "invoice"), so no order ever changes state.
 *
 * Modes:
 *   node scripts/harness/webhook-health.mjs            # --env only (no network)
 *   node scripts/harness/webhook-health.mjs --probe    # + live fail-closed probe vs NEXT_PUBLIC_SITE_URL
 *   node scripts/harness/webhook-health.mjs --probe --base https://truecolorprinting.ca
 *   node scripts/harness/webhook-health.mjs --probe --wave-validsig   # also assert Wave accepts a real sig (benign body)
 *
 * Exit code: 0 = all green, 1 = any red. Wireable into the Stop hook / pre-push.
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", "..", ".env.local");

const args = process.argv.slice(2);
const DO_PROBE = args.includes("--probe");
const DO_WAVE_VALIDSIG = args.includes("--wave-validsig");
const baseIdx = args.indexOf("--base");
const HAS_EXPLICIT_BASE = baseIdx !== -1 && Boolean(args[baseIdx + 1]);

// ---- load .env.local (best-effort; prod-only secrets won't be here) ----
let env = {};
try {
  env = Object.fromEntries(
    readFileSync(ENV_PATH, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
} catch {
  console.warn(`[harness] no .env.local at ${ENV_PATH} — env checks limited to process.env`);
}
const get = (k) => process.env[k] ?? env[k] ?? "";

const BASE = (baseIdx !== -1 ? args[baseIdx + 1] : "") || get("NEXT_PUBLIC_SITE_URL") || "https://truecolorprinting.ca";

const results = []; // { name, status: 'PASS'|'FAIL'|'WARN'|'SKIP', detail }
const add = (name, status, detail) => results.push({ name, status, detail });

// ============================ --env: format checks ============================
// PAYMENT_TOKEN_SECRET: 64 hex chars (signs pay links — rotating invalidates ALL outstanding links)
const pts = get("PAYMENT_TOKEN_SECRET");
if (!pts) add("PAYMENT_TOKEN_SECRET present", "WARN", "not set locally (Railway-only is fine)");
else if (/^[0-9a-fA-F]{64}$/.test(pts)) add("PAYMENT_TOKEN_SECRET format", "PASS", "64 hex chars");
else add("PAYMENT_TOKEN_SECRET format", "WARN", `expected 64 hex chars, got len=${pts.length}; works, but do not rotate casually because outstanding pay links would break`);

// NEXT_PUBLIC_SITE_URL: must be the live domain, NEVER vercel/railway (stale-URL pay-link + webhook bug class)
const siteUrl = get("NEXT_PUBLIC_SITE_URL");
const siteUrlSeverity = HAS_EXPLICIT_BASE ? "WARN" : "FAIL";
if (!siteUrl) add("NEXT_PUBLIC_SITE_URL present", siteUrlSeverity, HAS_EXPLICIT_BASE ? `not set locally; probing explicit base ${BASE}` : "not set");
else if (/vercel\.app|railway\.app/i.test(siteUrl)) add("NEXT_PUBLIC_SITE_URL host", siteUrlSeverity, HAS_EXPLICIT_BASE ? `local value points at ephemeral host: ${siteUrl}; probing explicit base ${BASE}` : `points at ephemeral host: ${siteUrl} — pay links + webhook docs will be wrong`);
else if (/^https:\/\/truecolorprinting\.ca\/?$/.test(siteUrl)) add("NEXT_PUBLIC_SITE_URL host", "PASS", siteUrl);
else add("NEXT_PUBLIC_SITE_URL host", "WARN", `unexpected value: ${siteUrl}`);

// Prod-only secrets: presence is only verifiable in Railway. Flag locally-missing as INFO.
for (const k of ["CLOVER_WEBHOOK_SECRET", "CLOVER_SIGNING_SECRET", "WAVE_WEBHOOK_SECRET", "CRON_SECRET"]) {
  add(`${k} (local)`, get(k) ? "PASS" : "WARN", get(k) ? "set" : "not local (verify in Railway env)");
}
add("BREVO_WEBHOOK_SECRET (local)", get("BREVO_WEBHOOK_SECRET") ? "PASS" : "WARN", get("BREVO_WEBHOOK_SECRET") ? "set" : "not local (verify in Railway)");

// ============================ --probe: live fail-closed ============================
async function postRaw(url, { headers = {}, body = "{}" } = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body, signal: AbortSignal.timeout(10000) });
  return res.status;
}

async function probe() {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (!res.ok) add("Live health endpoint", "FAIL", `HTTP ${res.status}`);
    else if (json.has_failures) add("Live health config failures", "FAIL", `${json.fail_count ?? "unknown"} failure(s)`);
    else if (json.warn_count > 0) add("Live health config", "WARN", `${json.warn_count} warning(s), 0 failures`);
    else add("Live health config", "PASS", "0 warnings, 0 failures");
  } catch (e) {
    add("Live health endpoint", "FAIL", `request failed: ${e.name}`);
  }

  // Clover: missing ?k= must be rejected. Real secret config = ...?k=<CLOVER_WEBHOOK_SECRET>
  // No valid k is ever sent, so no payment event can be processed.
  try {
    const s = await postRaw(`${BASE}/api/webhooks/clover`, { body: JSON.stringify({ type: "PAYMENT", object: { status: "captured" } }) });
    add("Clover webhook fail-closed (no ?k=)", (s === 401 || s === 503) ? "PASS" : "FAIL", `HTTP ${s} (expect 401 invalid / 503 unconfigured)`);
  } catch (e) { add("Clover webhook reachable", "FAIL", `request failed: ${e.name}`); }

  // Wave: invalid signature must be rejected.
  try {
    const s = await postRaw(`${BASE}/api/webhooks/wave`, { headers: { "x-wave-signature": "sha256=deadbeef" }, body: JSON.stringify({ data: { resourceType: "ping" } }) });
    add("Wave webhook fail-closed (bad sig)", s === 401 ? "PASS" : "FAIL", `HTTP ${s} (expect 401)`);
  } catch (e) { add("Wave webhook reachable", "FAIL", `request failed: ${e.name}`); }

  // Wave optional: VALID signature over a benign body the handler ignores → expect 200 ok, NO state change.
  if (DO_WAVE_VALIDSIG) {
    const secret = get("WAVE_WEBHOOK_SECRET");
    if (!secret) add("Wave valid-sig accepted", "SKIP", "WAVE_WEBHOOK_SECRET not available locally");
    else {
      try {
        const body = JSON.stringify({ data: { resourceType: "ping", resource: { id: "harness-noop", status: "draft" } } });
        const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
        const s = await postRaw(`${BASE}/api/webhooks/wave`, { headers: { "x-wave-signature": sig }, body });
        add("Wave valid-sig accepted (benign body)", s === 200 ? "PASS" : "FAIL", `HTTP ${s} (expect 200; resourceType=ping → no order touched)`);
      } catch (e) { add("Wave valid-sig accepted", "FAIL", `request failed: ${e.name}`); }
    }
  }

  // Brevo: missing/invalid Bearer must be rejected.
  try {
    const s = await postRaw(`${BASE}/api/webhooks/brevo`, { headers: { Authorization: "Bearer not-the-real-token" }, body: JSON.stringify({ event: "delivered" }) });
    add("Brevo webhook fail-closed (bad bearer)", s === 401 ? "PASS" : "FAIL", `HTTP ${s} (expect 401)`);
  } catch (e) { add("Brevo webhook reachable", "FAIL", `request failed: ${e.name}`); }
}

// ============================ run ============================
const run = async () => {
  if (DO_PROBE) {
    console.log(`[harness] live probe vs ${BASE} (fail-closed checks — no valid payment events sent)\n`);
    await probe();
  } else {
    console.log("[harness] env-format checks only (pass --probe for live webhook test)\n");
  }

  const pad = Math.max(...results.map((r) => r.name.length));
  let red = 0;
  for (const r of results) {
    if (r.status === "FAIL") red++;
    const icon = { PASS: "✅", FAIL: "❌", WARN: "⚠️ ", SKIP: "⏭️ " }[r.status];
    console.log(`${icon} ${r.name.padEnd(pad)}  ${r.detail ?? ""}`);
  }
  console.log(`\n${red === 0 ? "✅ no failures" : `❌ ${red} failure(s)`}`);
  process.exit(red === 0 ? 0 : 1);
};

run();
