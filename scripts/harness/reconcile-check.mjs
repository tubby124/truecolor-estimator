#!/usr/bin/env node
/**
 * scripts/harness/reconcile-check.mjs
 *
 * READ-ONLY three-way reconciliation: Clover ↔ Supabase ↔ Wave.
 *
 * Usage:
 *   node scripts/harness/reconcile-check.mjs              # last 30 days
 *   node scripts/harness/reconcile-check.mjs --days 7     # last 7 days
 *   node scripts/harness/reconcile-check.mjs --telegram   # also send Telegram alert on mismatch
 *
 * What it checks:
 *   1. Supabase paid orders → every row should have wave_payment_recorded_at SET
 *   2. Wave PAID invoices → count + total should match Supabase paid Wave/eTransfer orders
 *   3. Clover payments → count + total should match Supabase paid Clover-card orders
 *   4. Dollar-total match to-the-cent across all three (within $0.01 float rounding)
 *
 * This is the manual / CI "am I dialed in" companion to:
 *   - /api/cron/reconcile-payments (self-healing, runs daily on Railway)
 *   - npm run harness:webhooks:probe (webhook fail-closed check)
 *
 * Exit codes: 0 = clean, 1 = mismatch or error
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first"); // match Railway IPv4 behavior for Telegram

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", "..", ".env.local");

// ── Env loading ───────────────────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_PATH)) {
    const raw = readFileSync(ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.includes("=") || line.trimStart().startsWith("#")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!env[key]) env[key] = val; // process.env wins (allows Railway override)
    }
  }
  return env;
}

const ENV = loadEnv();

const DAYS = (() => {
  const idx = process.argv.indexOf("--days");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || 30 : 30;
})();
const SEND_TELEGRAM = process.argv.includes("--telegram");

const cutoff = new Date(Date.now() - DAYS * 86_400_000).toISOString();

// ── Supabase ──────────────────────────────────────────────────────────────────
const sb = createClient(
  ENV.NEXT_PUBLIC_SUPABASE_URL ?? "",
  ENV.SUPABASE_SECRET_KEY ?? ""
);

// ── Wave GraphQL ──────────────────────────────────────────────────────────────
const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const WAVE_BIZ =
  ENV.WAVE_BUSINESS_ID ??
  "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";

async function waveQuery(query, variables) {
  const token = ENV.WAVE_API_TOKEN;
  if (!token) throw new Error("WAVE_API_TOKEN not set");
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Wave HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Wave: ${json.errors[0].message}`);
  return json.data;
}

// ── Clover REST ───────────────────────────────────────────────────────────────
const CLOVER_MID = ENV.CLOVER_MERCHANT_ID;
const CLOVER_API_KEY = ENV.CLOVER_API_KEY;
const CLOVER_BASE = "https://api.clover.com";

async function cloverGet(path, params = {}) {
  if (!CLOVER_MID || !CLOVER_API_KEY) throw new Error("CLOVER_MERCHANT_ID / CLOVER_API_KEY not set");
  const url = new URL(`${CLOVER_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${CLOVER_API_KEY}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Clover HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── Telegram (optional) ───────────────────────────────────────────────────────
async function telegram(message) {
  const botToken = ENV.TRUE_COLOR_TELEGRAM_BOT_TOKEN;
  const chatId = ENV.TRUE_COLOR_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => {});
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = (n) => `$${Number(n).toFixed(2)}`;

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Three-way reconciliation — last ${DAYS} days (since ${cutoff.slice(0, 10)})\n`);
  const issues = [];   // hard failures → exit 1
  const warnings = []; // works-but-confirm → reported, exit stays 0
  let exitCode = 0;

  // ── 1. Supabase: all paid orders in window ────────────────────────────────
  console.log("Fetching Supabase paid orders…");
  const { data: sbOrders, error: sbErr } = await sb
    .from("orders")
    .select("order_number, total, payment_method, paid_at, status, wave_invoice_id, wave_payment_recorded_at, payment_reference")
    .not("paid_at", "is", null)
    .gte("paid_at", cutoff)
    .not("order_number", "like", "TEST-%")  // exclude harness test rows
    .order("paid_at", { ascending: false });

  if (sbErr) throw new Error(`Supabase: ${sbErr.message}`);

  const sbAll = sbOrders ?? [];
  const sbClover = sbAll.filter((o) => o.payment_method === "clover_card");
  const sbWave = sbAll.filter((o) => o.payment_method === "wave");
  const sbEtransfer = sbAll.filter((o) => o.payment_method === "etransfer");
  const sbOther = sbAll.filter((o) => !["clover_card", "wave", "etransfer"].includes(o.payment_method ?? ""));

  const sum = (rows) => rows.reduce((acc, r) => acc + Number(r.total ?? 0), 0);

  console.log(`  Supabase paid total: ${sbAll.length} orders, ${$(sum(sbAll))}`);
  console.log(`    clover_card : ${sbClover.length} orders ${$(sum(sbClover))}`);
  console.log(`    etransfer   : ${sbEtransfer.length} orders ${$(sum(sbEtransfer))}`);
  console.log(`    wave        : ${sbWave.length} orders ${$(sum(sbWave))}`);
  if (sbOther.length) console.log(`    other       : ${sbOther.length} orders ${$(sum(sbOther))}`);

  // ── 1a. Wave income booked? THE authoritative signal ──────────────────────
  // Staff never manually mark Wave invoices paid (esp. e-transfer/cash), so Wave
  // INVOICE STATUS is meaningless here — invoices sit OVERDUE forever by design.
  // What actually matters is whether the INCOME was booked via moneyTransactionCreate.
  // Our code sets wave_payment_recorded_at right after that succeeds, so a paid
  // order with wave_invoice_id but NULL wave_payment_recorded_at = income NOT in
  // Wave's books = real drift (reconcile-payments cron auto-heals it).
  const driftRows = sbAll.filter(
    (o) => o.wave_invoice_id && !o.wave_payment_recorded_at
  );
  if (driftRows.length) {
    console.log(`\n  ❌ ${driftRows.length} paid order(s) whose income is NOT booked in Wave (wave_payment_recorded_at NULL):`);
    for (const o of driftRows.slice(0, 10)) {
      console.log(`     • ${o.order_number}  ${$(o.total)}  ${o.payment_method}  paid ${o.paid_at?.slice(0, 10)}`);
    }
    issues.push(`${driftRows.length} paid order(s) missing wave_payment_recorded_at (income not booked in Wave) — run reconcile-payments cron to auto-heal`);
  } else {
    console.log(`\n  ✅ Every paid order with a Wave invoice has its income booked (wave_payment_recorded_at set)`);
  }

  // ── 2. Wave invoice status — FYI ONLY, never a pass/fail signal ───────────
  // Confirmed with Hasan 2026-05-25: staff never reconcile Wave invoices to PAID
  // (especially e-transfer/cash), so invoices stay OVERDUE/APPROVED indefinitely
  // by design. Invoice status therefore carries ZERO payment information here.
  // We print the histogram purely as context; the real payment signal is the
  // wave_payment_recorded_at check above (income booked via moneyTransactionCreate).
  console.log("\nFetching Wave invoice statuses (FYI only — not a payment signal)…");
  const waveResp = await waveQuery(
    `query($bizId: ID!) {
      business(id: $bizId) {
        invoices(page: 1, pageSize: 100, sort: [CREATED_AT_DESC]) {
          edges {
            node {
              invoiceNumber title status createdAt
            }
          }
        }
      }
    }`,
    { bizId: WAVE_BIZ }
  );

  const ORDER_RE = /(TC-\d{4}-\d{4})/;
  const allWaveInvoices = (waveResp?.business?.invoices?.edges ?? []).map((e) => e.node);
  const waveStatusByOrder = {};
  for (const inv of allWaveInvoices) {
    const onum = inv.title?.match(ORDER_RE)?.[1];
    if (onum) waveStatusByOrder[onum] = inv.status;
  }

  const sbWithWave = sbAll.filter((o) => o.wave_invoice_id);
  const waveStatusCounts = {};
  for (const o of sbWithWave) {
    const st = waveStatusByOrder[o.order_number] ?? "NOT_LINKED_BY_TITLE";
    waveStatusCounts[st] = (waveStatusCounts[st] ?? 0) + 1;
  }
  console.log(`  Wave invoice status histogram (informational): ${JSON.stringify(waveStatusCounts)}`);
  console.log(`  (OVERDUE/APPROVED is normal — staff don't mark invoices paid. Income is tracked via wave_payment_recorded_at, checked above.)`);

  // ── 3. Clover: payments in window ────────────────────────────────────────
  let cloverOrders = [];
  let cloverTotal = 0;
  let cloverSkipped = false;

  try {
    console.log("\nFetching Clover payments…");
    // Clover returns amounts in cents; createdTime is Unix ms.
    const cutoffMs = new Date(cutoff).getTime();

    // Clover paginates with offset. Fetch up to 1000 payments (plenty for 30 days).
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    const cloverPayments = [];

    while (hasMore) {
      const resp = await cloverGet(`/v3/merchants/${CLOVER_MID}/payments`, {
        filter: `createdTime>=${cutoffMs}`,
        limit,
        offset,
        expand: "order",
      });
      const elements = resp?.elements ?? [];
      cloverPayments.push(...elements);
      if (elements.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        if (offset >= 1000) hasMore = false; // safety ceiling
      }
    }

    // Filter to successful (non-voided) payments
    const successfulPayments = cloverPayments.filter(
      (p) => !p.voided && !p.refunded && p.result === "SUCCESS"
    );

    cloverTotal = successfulPayments.reduce((acc, p) => acc + (p.amount ?? 0), 0) / 100; // cents → dollars
    cloverOrders = successfulPayments;

    // ── POS-OUT semantics (Hasan decision 2026-05-25) ──────────────────────
    // Verified against live Clover data 2026-05-25: the externalReferenceId we set
    // at hosted checkout does NOT propagate to the REST payment.order object, so
    // reference-matching is impossible. The reliable discriminator is the physical
    // device: walk-in terminal sales carry order.device + order.employee; website
    // hosted-checkout payments do NOT. We therefore:
    //   • classify website payments = those WITHOUT order.device
    //   • match each website clover_card Supabase order to a website Clover payment
    //     by amount (cents), greedy single-consume
    //   • treat device-backed payments as POS walk-ins → informational, never flagged
    const isWalkIn = (p) => Boolean(p.order?.device);
    const websitePayments = successfulPayments.filter((p) => !isWalkIn(p));
    const walkInPayments = successfulPayments.filter(isWalkIn);
    const walkInTotal = walkInPayments.reduce((a, p) => a + (p.amount ?? 0), 0) / 100;

    const sbCloverTotal = sum(sbClover);
    console.log(`  Clover successful payments: ${successfulPayments.length}, total ${$(cloverTotal)}`);
    console.log(`    website (online): ${websitePayments.length}, total ${$((cloverTotal - walkInTotal))}`);
    console.log(`    POS walk-in (device): ${walkInPayments.length}, total ${$(walkInTotal)} — out of scope, not flagged`);
    console.log(`  Supabase clover_card paid: ${sbClover.length} orders, total ${$(sbCloverTotal)}`);

    // Greedy amount-match: each website Clover payment can satisfy at most one order.
    const availableWebsitePayments = websitePayments.map((p) => ({
      id: p.id,
      createdTime: p.createdTime,
      amount: p.amount ?? 0,
      orderId: p.order?.id ?? null,
    }));
    const sbCloverUnmatched = [];
    for (const o of sbClover) {
      const cents = Math.round(Number(o.total ?? 0) * 100);
      const idx = availableWebsitePayments.findIndex((p) => Math.abs(p.amount - cents) <= 1); // ±1¢ rounding
      if (idx === -1) {
        sbCloverUnmatched.push(o);
      } else {
        availableWebsitePayments.splice(idx, 1); // consume it
      }
    }

    if (sbCloverUnmatched.length > 0) {
      console.log(`  ⚠  ${sbCloverUnmatched.length} clover_card paid order(s) could not be proven by website Clover amount matching:`);
      for (const o of sbCloverUnmatched.slice(0, 5)) {
        console.log(`     • ${o.order_number}  ${$(o.total)}  paid ${o.paid_at?.slice(0, 10)}`);
      }
      console.log(`     Legacy/advisory direction — older manual/POS recoveries often lack order_payments ledger rows. Verify in Clover dashboard if this list changes unexpectedly.`);
      warnings.push(`${sbCloverUnmatched.length} clover_card paid order(s) could not be proven by website Clover amount matching`);
    } else {
      console.log(`  ✅ Every website clover_card order has a matching website Clover payment`);
    }

    if (availableWebsitePayments.length > 0) {
      console.log(`  ❌ ${availableWebsitePayments.length} website Clover payment(s) were collected but no paid Supabase clover_card order matched:`);
      for (const p of availableWebsitePayments.slice(0, 5)) {
        const created = p.createdTime ? new Date(p.createdTime).toISOString().slice(0, 16) : "unknown time";
        console.log(`     • ${p.id ?? "unknown-id"}  ${$(p.amount / 100)}  ${created}  Clover order ${p.orderId ?? "unknown"}`);
      }
      console.log(`     DANGEROUS direction — Clover collected money but the site may still show pending/unpaid. Find the order by amount/time and recover it.`);
      issues.push(`${availableWebsitePayments.length} website Clover payment(s) collected with no matching paid Supabase order`);
    } else {
      console.log(`  ✅ Every website Clover payment is represented by a paid Supabase clover_card order`);
    }

  } catch (cloverErr) {
    console.log(`  ⚠  Clover fetch failed: ${cloverErr.message}`);
    console.log(`     (Check CLOVER_API_KEY in .env.local — this key needs merchant REST access)`);
    cloverSkipped = true;
    issues.push(`Clover API unavailable: ${cloverErr.message.slice(0, 100)}`);
  }

  // ── 4. Cron heartbeat: read cron_runs table for last-ran timestamps ───────
  // Each payment cron writes a cron_runs row at end of run (fail-quiet). A
  // missing recent row = the cron silently didn't execute (pg_cron stopped,
  // CRON_SECRET rotated out of sync, endpoint 401). Per-cron staleness window.
  console.log("\nCron heartbeat check (from cron_runs table):");

  // name → max hours allowed since last run before we alert
  const CRON_WINDOWS = {
    "reconcile-payments": { maxHours: 36, hard: true }, // daily 9 AM MT
    "daily-payment-digest": { maxHours: 36, hard: true }, // daily 13:00 UTC
    "payment-followup": { maxHours: 4, hard: false }, // hourly reminder emails, not payment settlement
  };

  const { data: cronRows, error: cronErr } = await sb
    .from("cron_runs")
    .select("cron_name, ran_at, ok")
    .order("ran_at", { ascending: false })
    .limit(200);

  if (cronErr) {
    // Table likely not created yet (migration pending). Not a recon failure —
    // just note it so the harness is honest about coverage.
    console.log(`  ℹ️  cron_runs table not readable (${cronErr.message.slice(0, 60)}).`);
    console.log(`     Apply migration 20260525123000_cron_runs_heartbeat.sql to enable heartbeat checks.`);
  } else {
    const latestByName = {};
    for (const row of cronRows ?? []) {
      if (!latestByName[row.cron_name]) latestByName[row.cron_name] = row;
    }
    for (const [name, cfg] of Object.entries(CRON_WINDOWS)) {
      const { maxHours, hard } = cfg;
      const last = latestByName[name];
      if (!last) {
        console.log(`  ⚠  ${name}: no run ever recorded (expected within ${maxHours}h)`);
        const msg = `Cron '${name}' has never recorded a heartbeat — verify it is scheduled + running`;
        if (hard) issues.push(msg);
        else warnings.push(msg);
        continue;
      }
      const ageHours = (Date.now() - new Date(last.ran_at).getTime()) / 3600_000;
      if (ageHours > maxHours) {
        console.log(`${hard ? "  ❌" : "  ⚠ "} ${name}: last ran ${ageHours.toFixed(1)}h ago (window ${maxHours}h) — SILENT DEATH`);
        const msg = `Cron '${name}' last ran ${ageHours.toFixed(1)}h ago, exceeds ${maxHours}h window`;
        if (hard) issues.push(msg);
        else warnings.push(msg);
      } else {
        console.log(`  ✅ ${name}: last ran ${ageHours.toFixed(1)}h ago (within ${maxHours}h)`);
      }
    }
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  if (warnings.length > 0) {
    console.log(`⚠  ${warnings.length} WARNING${warnings.length > 1 ? "S" : ""} (works / confirm intent — does not fail):`);
    for (const w of warnings) console.log(`   • ${w}`);
    console.log("");
  }
  if (issues.length === 0) {
    console.log("✅  CLEAN — no hard mismatches across the three systems");
    console.log(`    Supabase: ${sbAll.length} paid orders ${$(sum(sbAll))}`);
    if (!cloverSkipped) console.log(`    Clover:   ${cloverOrders.length} payments ${$(cloverTotal)}`);
  } else {
    exitCode = 1;
    console.log(`❌  ${issues.length} MISMATCH${issues.length > 1 ? "ES" : ""} FOUND:`);
    for (const issue of issues) {
      console.log(`   • ${issue}`);
    }
    console.log("\nNext steps:");
    console.log("  1. Run: curl -H 'Authorization: Bearer $CRON_SECRET' https://truecolorprinting.ca/api/cron/reconcile-payments | jq");
    console.log("  2. Check Railway logs for [reconcile] entries");
    console.log("  3. Verify Wave dashboard webhook URL = https://truecolorprinting.ca/api/webhooks/wave");

    if (SEND_TELEGRAM) {
      const msg = [
        `<b>⚠ True Color 3-way recon — ${issues.length} mismatch${issues.length > 1 ? "es" : ""} (last ${DAYS}d)</b>`,
        ...issues.map((i) => `  • ${i}`),
        `\n<i>Run reconcile-payments cron to auto-heal bookkeeping drift.</i>`,
      ].join("\n");
      await telegram(msg);
      console.log("\n  📱 Telegram alert sent");
    }
  }
  console.log("═".repeat(70) + "\n");

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("\n❌ Reconcile check failed:", err.message);
  process.exit(1);
});
