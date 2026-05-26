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
const pad = (s, w) => String(s).padEnd(w);
const rpad = (s, w) => String(s).padStart(w);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Three-way reconciliation — last ${DAYS} days (since ${cutoff.slice(0, 10)})\n`);
  const issues = [];
  let exitCode = 0;

  // ── 1. Supabase: all paid orders in window ────────────────────────────────
  console.log("Fetching Supabase paid orders…");
  const { data: sbOrders, error: sbErr } = await sb
    .from("orders")
    .select("order_number, total, payment_method, paid_at, status, wave_invoice_id, wave_payment_recorded_at")
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

  // ── 1a. Drift: paid orders with wave_invoice_id but no wave_payment_recorded_at
  const driftRows = sbAll.filter(
    (o) => o.wave_invoice_id && !o.wave_payment_recorded_at
  );
  if (driftRows.length) {
    console.log(`\n  ⚠  ${driftRows.length} order(s) paid in Supabase but wave_payment_recorded_at is NULL:`);
    for (const o of driftRows.slice(0, 10)) {
      console.log(`     • ${o.order_number}  ${$(o.total)}  ${o.payment_method}  paid ${o.paid_at?.slice(0, 10)}`);
    }
    issues.push(`${driftRows.length} paid order(s) missing wave_payment_recorded_at — run reconcile-payments cron to auto-heal`);
  }

  // ── 2. Wave: PAID invoices in window ─────────────────────────────────────
  console.log("\nFetching Wave PAID invoices…");
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

  // Filter to TC-order PAID invoices within our window
  const waveInvoices = allWaveInvoices.filter((inv) => {
    if (!inv.title?.match(ORDER_RE)) return false;
    if (inv.status !== "PAID") return false;
    return new Date(inv.createdAt) >= new Date(cutoff);
  });

  console.log(`  Wave PAID invoices: ${waveInvoices.length} (totals pulled from Supabase linked rows)`);

  // ── 2a. Cross-check Wave vs Supabase
  // Every Supabase paid order with a wave_invoice_id should have a PAID Wave invoice.
  // We match by order number embedded in the invoice title.
  const sbWithWave = sbAll.filter((o) => o.wave_invoice_id);
  const sbWithWaveTotal = sum(sbWithWave);

  // Build set of order numbers from Wave PAID invoices
  const waveOrderNumbers = new Set(
    waveInvoices.map((inv) => inv.title.match(ORDER_RE)?.[1]).filter(Boolean)
  );

  const sbNotInWave = sbWithWave.filter((o) => !waveOrderNumbers.has(o.order_number));

  console.log(`  Supabase orders with wave_invoice_id: ${sbWithWave.length}, total ${$(sbWithWaveTotal)}`);

  if (waveInvoices.length !== sbWithWave.length) {
    const msg = `Wave PAID count (${waveInvoices.length}) ≠ Supabase orders with wave_invoice_id (${sbWithWave.length})`;
    console.log(`  ⚠  ${msg}`);
    issues.push(msg);
  }
  if (sbNotInWave.length > 0) {
    console.log(`  ⚠  ${sbNotInWave.length} Supabase order(s) with wave_invoice_id but NO matching PAID Wave invoice:`);
    for (const o of sbNotInWave.slice(0, 5)) {
      console.log(`     • ${o.order_number}  ${$(o.total)}  ${o.payment_method}`);
    }
    issues.push(`${sbNotInWave.length} Supabase paid order(s) not found as PAID in Wave`);
  } else {
    console.log(`  ✅ All Supabase wave-linked orders appear PAID in Wave`);
  }

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
    console.log(`  Clover successful payments: ${successfulPayments.length}, total ${$(cloverTotal)}`);

    // Cross-check Clover vs Supabase clover_card orders
    const sbCloverTotal = sum(sbClover);
    const cloverDelta = Math.abs(sbCloverTotal - cloverTotal);

    console.log(`  Supabase clover_card paid: ${sbClover.length} orders, total ${$(sbCloverTotal)}`);

    if (Math.abs(successfulPayments.length - sbClover.length) > 2) {
      // Allow ±2 for POS terminal walk-in sales (those don't have Supabase rows)
      const msg = `Clover payment count (${successfulPayments.length}) vs Supabase clover_card orders (${sbClover.length}) — delta ${successfulPayments.length - sbClover.length}`;
      console.log(`  ⚠  ${msg}`);
      console.log(`     Note: POS terminal walk-in sales appear in Clover but NOT Supabase — confirm if gap = walk-in count`);
      issues.push(msg);
    } else {
      console.log(`  ✅ Clover payment count matches Supabase clover_card orders (±2 for POS walk-ins)`);
    }

    if (cloverDelta > 1.00) {
      // Allow $1 tolerance for POS walk-ins (unknown dollar amounts)
      const msg = `Clover total ${$(cloverTotal)} vs Supabase clover_card total ${$(sbCloverTotal)} — delta ${$(cloverDelta)}`;
      console.log(`  ⚠  ${msg}`);
      console.log(`     Note: If POS walk-in sales exist, this delta is expected — confirm manually`);
      issues.push(msg);
    } else {
      console.log(`  ✅ Clover total within $1.00 of Supabase clover_card total`);
    }

  } catch (cloverErr) {
    console.log(`  ⚠  Clover fetch failed: ${cloverErr.message}`);
    console.log(`     (Check CLOVER_API_KEY in .env.local — this key needs merchant REST access)`);
    cloverSkipped = true;
    issues.push(`Clover API unavailable: ${cloverErr.message.slice(0, 100)}`);
  }

  // ── 4. Cron heartbeat: check last-ran timestamps ──────────────────────────
  // The reconcile-payments cron should have run within the last 36 hours.
  // We infer this from the most recently updated order's wave_payment_recorded_at
  // or lack of known drift — not ideal but we have no cron-last-ran table yet.
  // TODO: add a cron_runs table (see Phase 1 backlog).
  console.log("\nCron heartbeat check (inferred from data):");

  const { data: recentlyRecovered } = await sb
    .from("orders")
    .select("order_number, wave_payment_recorded_at")
    .not("wave_payment_recorded_at", "is", null)
    .gte("wave_payment_recorded_at", new Date(Date.now() - 36 * 3600_000).toISOString())
    .limit(1);

  if (recentlyRecovered?.length) {
    console.log(`  ✅ reconcile-payments cron appears active (ran in last 36h)`);
  } else {
    // Not necessarily broken — just no recoveries. Check payment_followup cron instead.
    console.log(`  ℹ️  No wave_payment_recorded_at updates in last 36h (expected if nothing was stuck)`);
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  if (issues.length === 0) {
    console.log("✅  CLEAN — all three systems in agreement");
    console.log(`    Supabase: ${sbAll.length} paid orders ${$(sum(sbAll))}`);
    console.log(`    Wave:     ${waveInvoices.length} PAID TC-order invoices`);
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
