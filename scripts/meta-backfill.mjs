#!/usr/bin/env node
/**
 * Meta Conversions API backfill — replays paid orders as Purchase events.
 * Deduped on event_id = order_number, so re-runs within 24h are idempotent.
 *
 * Usage: source ~/.secrets && node scripts/meta-backfill.mjs --days=30 [--dry-run]
 */

import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const DAYS = parseInt(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "30", 10);
const DRY = args.includes("--dry-run");

const SUPABASE_PROJECT_REF = "dczbgraekmzirxknjvwe";
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

if (!SUPABASE_ACCESS_TOKEN) { console.error("SUPABASE_ACCESS_TOKEN missing"); process.exit(1); }
if (!DRY && (!PIXEL_ID || !CAPI_TOKEN)) {
  console.error("NEXT_PUBLIC_META_PIXEL_ID or META_CAPI_ACCESS_TOKEN missing. Use --dry-run.");
  process.exit(1);
}

const sha = (s) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) throw new Error(`SQL ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendEvent(event) {
  if (DRY) {
    console.log(`[dry-run] ${event.event_name} id=${event.event_id} value=${event.custom_data.value}`);
    return true;
  }
  const payload = { data: [event] };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;
  const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`[meta-capi] ${res.status} ${await res.text()}`);
    return false;
  }
  const j = await res.json();
  return (j.events_received ?? 0) > 0;
}

console.log(`Backfilling Meta CAPI last ${DAYS}d ${DRY ? "(DRY)" : TEST_CODE ? `(test_code=${TEST_CODE})` : "(LIVE)"}...`);

const orders = await runSql(`
  SELECT o.id, o.order_number, o.customer_id, o.total, o.paid_at, o.payment_method,
         c.email, c.phone
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  WHERE o.paid_at IS NOT NULL
    AND o.paid_at >= NOW() - INTERVAL '${DAYS} days'
    AND c.email IS NOT NULL
  ORDER BY o.paid_at ASC
`);

console.log(`Found ${orders.length} paid orders with customer email in window`);

let success = 0;
let failed = 0;

for (const o of orders) {
  const items = await runSql(`
    SELECT product_name, qty, line_total FROM order_items WHERE order_id = '${o.id}'
  `);

  const userData = {};
  if (o.email) userData.em = [sha(o.email)];
  if (o.phone) userData.ph = [sha(String(o.phone).replace(/\D/g, ""))];
  if (o.customer_id) userData.external_id = [sha(`tc-customer:${o.customer_id}`)];

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(new Date(o.paid_at).getTime() / 1000),
    event_id: o.order_number,
    action_source: "website",
    event_source_url: "https://truecolorprinting.ca/order-confirmed",
    user_data: userData,
    custom_data: {
      currency: "CAD",
      value: Number(o.total),
      content_type: "product",
      content_ids: items.map((i) => (i.product_name ?? "").slice(0, 100)),
      num_items: items.reduce((s, i) => s + Number(i.qty ?? 1), 0),
      contents: items.map((i) => ({
        id: (i.product_name ?? "").slice(0, 100),
        quantity: Number(i.qty ?? 1),
        item_price: Number(i.qty) > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
      })),
    },
  };

  const ok = await sendEvent(event);
  if (ok) {
    success++;
    console.log(`✓ ${o.order_number} $${o.total} (${items.length} items) paid ${o.paid_at}`);
  } else {
    failed++;
  }
}

console.log("");
console.log(`Done — ${success} sent, ${failed} failed${DRY ? " (dry)" : ""}`);
if (TEST_CODE && !DRY) console.log(`Events routed to Test Events tab (test_code=${TEST_CODE}) — they will NOT appear in production reports.`);
