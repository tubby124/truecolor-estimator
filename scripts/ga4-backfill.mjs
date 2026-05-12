#!/usr/bin/env node
/**
 * GA4 Measurement Protocol backfill — replays the last N days of paid orders
 * through GA4 MP so historical revenue shows up in Ecommerce reports.
 *
 * Notes:
 *  - GA4 MP rejects events older than 72h unless event_timestamp_micros is set.
 *    This script always sets event_timestamp_micros from orders.paid_at.
 *  - GA4 deduplicates on transaction_id within 24h, so re-running within a day
 *    is safe. Sustained dedupe across days is NOT guaranteed — don't run blind.
 *
 * Usage:
 *   source ~/.secrets && node scripts/ga4-backfill.mjs --days=30 [--dry-run]
 */

import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const DAYS = parseInt(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "30", 10);
const DRY = args.includes("--dry-run");

const SUPABASE_PROJECT_REF = "dczbgraekmzirxknjvwe";
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const GA4_SECRET = process.env.GA4_API_SECRET;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN not set. Run: source ~/.secrets && node scripts/ga4-backfill.mjs");
  process.exit(1);
}
if (!DRY && (!GA4_ID || !GA4_SECRET)) {
  console.error("NEXT_PUBLIC_GA4_MEASUREMENT_ID or GA4_API_SECRET missing in env. Use --dry-run to preview without sending.");
  process.exit(1);
}

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) throw new Error(`Supabase SQL failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function clientIdFromCustomer(customerId) {
  const h = createHash("sha256").update(`tc-customer:${customerId}`).digest("hex");
  return `${h.slice(0, 10)}.${h.slice(10, 20)}`;
}

async function sendEvent(clientId, eventName, params, timestampMicros) {
  if (DRY) {
    console.log(`[dry-run] ${eventName} tx=${params.transaction_id} value=$${params.value} items=${params.items?.length ?? 0}`);
    return true;
  }
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA4_ID)}&api_secret=${encodeURIComponent(GA4_SECRET)}`;
  const body = {
    client_id: clientId,
    events: [{ name: eventName, params, timestamp_micros: timestampMicros }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`[ga4-mp] ${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}

console.log(`Backfilling last ${DAYS}d ${DRY ? "(DRY RUN)" : ""}...`);

const orders = await runSql(`
  SELECT o.id, o.order_number, o.customer_id, o.total, o.gst, o.pst, o.paid_at,
         o.payment_method, o.utm_source, o.utm_campaign
  FROM orders o
  WHERE o.paid_at IS NOT NULL
    AND o.paid_at >= NOW() - INTERVAL '${DAYS} days'
  ORDER BY o.paid_at ASC
`);

console.log(`Found ${orders.length} paid orders in window`);

let success = 0;
let failed = 0;

for (const order of orders) {
  const items = await runSql(`
    SELECT product_name, category, qty, line_total
    FROM order_items
    WHERE order_id = '${order.id}'
  `);

  const ga4Items = items.map((i) => ({
    item_id: (i.product_name ?? "").slice(0, 100),
    item_name: i.product_name ?? "Unknown",
    item_category: i.category ?? undefined,
    price: i.qty > 0 ? Number(i.line_total) / Number(i.qty) : Number(i.line_total),
    quantity: Number(i.qty ?? 1),
  }));

  const clientId = clientIdFromCustomer(order.customer_id ?? order.id);
  const tax = Number(order.gst ?? 0) + Number(order.pst ?? 0);
  const tsMicros = new Date(order.paid_at).getTime() * 1000;

  const params = {
    transaction_id: order.order_number,
    value: Number(order.total),
    currency: "CAD",
    tax,
    payment_type: order.payment_method ?? "unknown",
    items: ga4Items,
  };
  if (order.utm_source) params.source = order.utm_source;
  if (order.utm_campaign) params.campaign = order.utm_campaign;

  const ok = await sendEvent(clientId, "purchase", params, tsMicros);
  if (ok) {
    success++;
    console.log(`✓ ${order.order_number} $${order.total} (${ga4Items.length} items) paid ${order.paid_at}`);
  } else {
    failed++;
  }
}

console.log("");
console.log(`Done — ${success} sent, ${failed} failed${DRY ? " (no events actually sent)" : ""}`);
console.log(DRY ? "Re-run without --dry-run to actually send events." : "Verify in GA4 → Reports → Realtime + Ecommerce → Item Sales (24h lag).");
