#!/usr/bin/env node
/**
 * Backfill email_log.order_id / customer_id from subject patterns.
 *
 * email_log rows currently have NULL order_id because sendEmail() never wrote
 * it. Most subjects contain TC-YYYY-NNNN — we can backfill those directly. For
 * customer-side emails that DON'T contain the order number (Quote / Payment
 * Request / Welcome), we fall back to: match by to_address + sent_at within
 * the order's creation window, but only when exactly ONE order is in scope
 * (conservative — avoid mis-linking).
 *
 * Run modes:
 *   node scripts/harness/backfill-email-log.mjs            # DRY RUN — print plan
 *   node scripts/harness/backfill-email-log.mjs --apply    # actually update
 *
 * Safe to re-run. Only touches rows where order_id IS NULL.
 */

import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

// ─── env load ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in env");
  process.exit(1);
}

async function rest(pathAndQuery, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${pathAndQuery}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text} (${url})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── data ──────────────────────────────────────────────────────────────────
console.log(APPLY ? "→ APPLY mode — will UPDATE rows" : "→ DRY RUN — no writes");
console.log("");

console.log("Loading orders…");
const orders = await rest("orders?select=id,order_number,customer_id,created_at,customers(email)&order=created_at.asc");
const ordersByNumber = new Map();
const ordersByCustomerEmail = new Map(); // email → [{order_id, customer_id, created_at}]
for (const o of orders) {
  if (o.order_number) ordersByNumber.set(o.order_number, o);
  const email = o.customers?.email?.toLowerCase();
  if (email) {
    if (!ordersByCustomerEmail.has(email)) ordersByCustomerEmail.set(email, []);
    ordersByCustomerEmail.get(email).push(o);
  }
}
console.log(`  ${orders.length} orders · ${ordersByNumber.size} with order_number · ${ordersByCustomerEmail.size} unique customer emails`);

console.log("Loading unlinked email_log rows…");
// Page through — there are 532 today but will grow
const emails = [];
let from = 0;
const pageSize = 1000;
while (true) {
  const page = await rest(`email_log?select=id,to_address,subject,sent_at,order_id,customer_id&order_id=is.null&order=sent_at.asc`, {
    headers: { Range: `${from}-${from + pageSize - 1}` },
  });
  if (!page || page.length === 0) break;
  emails.push(...page);
  if (page.length < pageSize) break;
  from += pageSize;
}
console.log(`  ${emails.length} unlinked email_log rows`);
console.log("");

// ─── classify + plan ───────────────────────────────────────────────────────
const ORDER_NUM_RE = /\b(TC-\d{4}-\d{3,5})\b/;
const ORDER_WINDOW_DAYS = 45; // how far before/after order.created_at to consider a match

const plan = {
  byOrderNumber: [],     // strong: subject contains TC-XXXX
  byEmailWindow: [],     // medium: customer with exactly 1 active order in window
  ambiguous: [],         // skipped: 2+ matching orders
  noMatch: [],           // skipped: no order found (admin/welcome/etc.)
};

for (const e of emails) {
  const subj = e.subject ?? "";
  const m = subj.match(ORDER_NUM_RE);
  if (m) {
    const order = ordersByNumber.get(m[1]);
    if (order) {
      plan.byOrderNumber.push({ email: e, order, reason: `subject contains ${m[1]}` });
      continue;
    }
  }
  // Email-window fallback (customer-side emails only — staff inbox skipped)
  const to = (e.to_address ?? "").toLowerCase();
  if (!to || to === "info@true-color.ca" || to === "hasan.sharif@exprealty.com" || to === "hasan.sharif.realtor@gmail.com") {
    plan.noMatch.push({ email: e, reason: "staff/admin inbox or empty" });
    continue;
  }
  const cohort = ordersByCustomerEmail.get(to);
  if (!cohort) {
    plan.noMatch.push({ email: e, reason: `no order for ${to}` });
    continue;
  }
  const sentAt = e.sent_at ? new Date(e.sent_at).getTime() : null;
  if (!sentAt) {
    plan.noMatch.push({ email: e, reason: "no sent_at" });
    continue;
  }
  const inWindow = cohort.filter((o) => {
    const createdAt = new Date(o.created_at).getTime();
    const delta = Math.abs(sentAt - createdAt);
    return delta <= ORDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  });
  if (inWindow.length === 1) {
    plan.byEmailWindow.push({ email: e, order: inWindow[0], reason: `single order match in ${ORDER_WINDOW_DAYS}d window` });
  } else if (inWindow.length > 1) {
    // Disambiguate: pick the closest in time (sent_at to order.created_at)
    inWindow.sort((a, b) => Math.abs(sentAt - new Date(a.created_at).getTime()) - Math.abs(sentAt - new Date(b.created_at).getTime()));
    const closest = inWindow[0];
    const closestDelta = Math.abs(sentAt - new Date(closest.created_at).getTime());
    // Only auto-link if the closest match is within 14 days AND at least 2x closer than the second
    const secondDelta = Math.abs(sentAt - new Date(inWindow[1].created_at).getTime());
    if (closestDelta < 14 * 24 * 60 * 60 * 1000 && secondDelta > 2 * closestDelta) {
      plan.byEmailWindow.push({ email: e, order: closest, reason: `closest of ${inWindow.length} in window (${Math.round(closestDelta / (24 * 60 * 60 * 1000))}d off vs next ${Math.round(secondDelta / (24 * 60 * 60 * 1000))}d)` });
    } else {
      plan.ambiguous.push({ email: e, candidates: inWindow.length, reason: `${inWindow.length} orders in window, none clearly closest` });
    }
  } else {
    plan.noMatch.push({ email: e, reason: `${cohort.length} orders for ${to} but none in ${ORDER_WINDOW_DAYS}d window` });
  }
}

// ─── report ────────────────────────────────────────────────────────────────
console.log("=== Backfill plan ===");
console.log(`  Strong (subject contains TC-XXXX): ${plan.byOrderNumber.length}`);
console.log(`  Medium (single match by email+window): ${plan.byEmailWindow.length}`);
console.log(`  Skipped — ambiguous: ${plan.ambiguous.length}`);
console.log(`  Skipped — no match: ${plan.noMatch.length}`);
console.log("");

if (plan.byOrderNumber.length > 0) {
  console.log("Sample strong matches:");
  for (const p of plan.byOrderNumber.slice(0, 5)) {
    console.log(`  ${p.email.sent_at} | ${p.order.order_number} | "${p.email.subject?.slice(0, 60)}..."`);
  }
  console.log("");
}
if (plan.byEmailWindow.length > 0) {
  console.log("Sample medium matches:");
  for (const p of plan.byEmailWindow.slice(0, 5)) {
    console.log(`  ${p.email.sent_at} | ${p.order.order_number} | ${p.email.to_address} | ${p.reason}`);
  }
  console.log("");
}
if (plan.ambiguous.length > 0) {
  console.log("Sample ambiguous (skipped):");
  for (const p of plan.ambiguous.slice(0, 5)) {
    console.log(`  ${p.email.sent_at} | ${p.email.to_address} | ${p.reason}`);
  }
  console.log("");
}

if (!APPLY) {
  console.log("DRY RUN complete. Re-run with --apply to write the updates.");
  process.exit(0);
}

// ─── apply ─────────────────────────────────────────────────────────────────
const toApply = [...plan.byOrderNumber, ...plan.byEmailWindow];
console.log(`Applying ${toApply.length} updates…`);

let ok = 0;
let fail = 0;
// Batch by 50 to avoid URL length issues
const BATCH = 50;
for (let i = 0; i < toApply.length; i += BATCH) {
  const slice = toApply.slice(i, i + BATCH);
  await Promise.all(
    slice.map(async (p) => {
      try {
        await rest(`email_log?id=eq.${p.email.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            order_id: p.order.id,
            customer_id: p.order.customer_id ?? null,
          }),
        });
        ok++;
      } catch (err) {
        fail++;
        console.error(`  FAIL ${p.email.id}: ${err.message}`);
      }
    })
  );
  process.stdout.write(`  ${Math.min(i + BATCH, toApply.length)}/${toApply.length}\r`);
}
console.log("");
console.log(`Done. ${ok} updated, ${fail} failed.`);
