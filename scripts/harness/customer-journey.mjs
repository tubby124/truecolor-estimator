#!/usr/bin/env node
/**
 * scripts/harness/customer-journey.mjs
 *
 * READ-ONLY. Walks a single customer order end-to-end and prints the timeline:
 *   account created → first quote/touch → order placed → discount redeemed
 *   → payment received → emails sent (who, when, status) → traffic source (utm/referrer)
 *
 * Usage:
 *   node scripts/harness/customer-journey.mjs                    # most recent paid order
 *   node scripts/harness/customer-journey.mjs --order TC-2026-0123
 *   node scripts/harness/customer-journey.mjs --email foo@bar.ca
 *   node scripts/harness/customer-journey.mjs --last 5           # last 5 paid orders, compact view
 *
 * Why this exists: when a real conversion happens we want to know what worked
 * (source, copy, code, email cadence) so we can replicate it. This is the
 * "replay one customer" tool — pair with /tc-seo-opportunities for the
 * SEO-side replay.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", "..", ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(ENV_PATH)) {
    const raw = readFileSync(ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.includes("=") || line.trimStart().startsWith("#")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!env[key]) env[key] = val;
    }
  }
  return env;
}

const ENV = loadEnv();
const sb = createClient(
  ENV.NEXT_PUBLIC_SUPABASE_URL ?? "",
  ENV.SUPABASE_SECRET_KEY ?? "",
);

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const ORDER_NUM = flag("--order");
const EMAIL = flag("--email");
const LAST_N = parseInt(flag("--last") ?? "1", 10);

const PAID_STATUSES = new Set(["payment_received", "in_production", "ready_for_pickup", "complete"]);

const fmt = (iso) => (iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + "Z" : "—");
const dollars = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const minutes = (a, b) => {
  if (!a || !b) return "—";
  const diff = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  const m = diff / 60_000;
  if (m < 60) return `${m.toFixed(1)} min`;
  const h = m / 60;
  if (h < 48) return `${h.toFixed(1)} hr`;
  return `${(h / 24).toFixed(1)} day`;
};

async function pickOrder() {
  if (ORDER_NUM) {
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("order_number", ORDER_NUM)
      .single();
    if (error) throw new Error(`Order ${ORDER_NUM} lookup failed: ${error.message}`);
    return [data];
  }
  if (EMAIL) {
    const { data, error } = await sb
      .from("orders")
      .select("*")
      .eq("customer_email", EMAIL.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(LAST_N);
    if (error) throw new Error(`Email ${EMAIL} lookup failed: ${error.message}`);
    return data ?? [];
  }
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .not("paid_at", "is", null)
    .not("order_number", "like", "TEST-%")
    .order("paid_at", { ascending: false })
    .limit(LAST_N);
  if (error) throw new Error(`Recent paid orders lookup failed: ${error.message}`);
  return data ?? [];
}

async function customerProfile(customerId, email) {
  let auth = null;
  let firstSeen = null;
  if (customerId) {
    const { data } = await sb
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();
    auth = data ?? null;
  }
  const lookupEmail = email || auth?.email;
  if (!auth && lookupEmail) {
    const { data } = await sb
      .from("customers")
      .select("*")
      .eq("email", lookupEmail.toLowerCase())
      .maybeSingle();
    auth = data ?? null;
  }
  if (lookupEmail) {
    const { data: q } = await sb
      .from("quote_requests")
      .select("created_at")
      .eq("contact_email", lookupEmail.toLowerCase())
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    firstSeen = q?.created_at ?? null;
  }
  return { auth, firstSeen };
}

async function discountForOrder(orderId, customerId) {
  let rows = [];
  if (orderId) {
    const { data } = await sb
      .from("discount_redemptions")
      .select("id, code_id, amount_saved, redeemed_at, order_id, customer_id, discount_codes(code)")
      .eq("order_id", orderId);
    rows = data ?? [];
  }
  if (!rows.length && customerId) {
    const { data } = await sb
      .from("discount_redemptions")
      .select("id, code_id, amount_saved, redeemed_at, order_id, customer_id, discount_codes(code)")
      .eq("customer_id", customerId)
      .order("redeemed_at", { ascending: false })
      .limit(3);
    rows = data ?? [];
  }
  return rows;
}

async function emailsForOrder(orderId, customerId, email) {
  const filters = [];
  if (orderId) filters.push(`order_id.eq.${orderId}`);
  if (customerId) filters.push(`customer_id.eq.${customerId}`);
  if (email) filters.push(`to_address.eq.${email.toLowerCase()}`);
  if (!filters.length) return [];
  const { data, error } = await sb
    .from("email_log")
    .select("sent_at, to_address, email_type, subject, status, provider_message_id, opened_at, clicked_at, bounced_at, delivered_at, order_id")
    .or(filters.join(","))
    .order("sent_at", { ascending: true })
    .limit(50);
  if (error) {
    console.error(`[email_log] ${error.message}`);
    return [];
  }
  return data ?? [];
}

async function itemsForOrder(orderId) {
  const { data } = await sb
    .from("order_items")
    .select("category, product_name, material_code, width_in, height_in, sides, qty, unit_price, line_total, is_rush, design_status")
    .eq("order_id", orderId);
  return data ?? [];
}

function printJourney({ order, profile, discounts, emails, items }) {
  const bar = "═".repeat(76);
  console.log("\n" + bar);
  console.log(`🧾 ${order.order_number}   ${dollars(order.total)}   ${order.payment_method ?? "—"}   ${order.status}`);
  console.log(bar);

  const displayName = order.customer_name_at_order ?? profile.auth?.name ?? "—";
  const displayEmail = profile.auth?.email ?? "—";
  const displayPhone = order.customer_phone_at_order ?? profile.auth?.phone ?? "";
  console.log(`\nCustomer: ${displayName}  <${displayEmail}>  ${displayPhone}`);
  if (order.customer_company_at_order) console.log(`  Company at order:            ${order.customer_company_at_order}`);
  if (profile.auth) {
    console.log(`  Account in customers table:  created ${fmt(profile.auth.created_at)}  (id ${profile.auth.id})`);
  } else {
    console.log(`  Account in customers table:  none found — guest checkout`);
  }
  if (profile.firstSeen) {
    console.log(`  First quote_request:         ${fmt(profile.firstSeen)}`);
  }

  console.log(`\nTraffic source (stored on order row):`);
  const src = {
    utm_source: order.utm_source,
    utm_campaign: order.utm_campaign,
    referrer_source: order.referrer_source,
    referrer_medium: order.referrer_medium,
    raw_referrer: order.raw_referrer,
  };
  const hasSrc = Object.values(src).some(Boolean);
  if (hasSrc) {
    for (const [k, v] of Object.entries(src)) if (v) console.log(`  ${k.padEnd(16)} ${v}`);
  } else {
    console.log(`  (none recorded — likely direct, or UtmCapture cookie missed the first hit)`);
  }
  if (order.discount_code) console.log(`  discount_code    ${order.discount_code}  (saved ${dollars(order.discount_amount ?? 0)})`);

  console.log(`\nTimeline:`);
  const row = (label, ts, prev) => console.log(`  ${label.padEnd(28)} ${fmt(ts).padEnd(22)} ${prev ? `Δ ${minutes(prev, ts)}` : ""}`);
  const tFirst = profile.firstSeen;
  const tAccount = profile.auth?.created_at ?? null;
  const tOrder = order.created_at;
  const tPaid = order.paid_at;
  const tWaveBooked = order.wave_payment_recorded_at;
  row("first quote_request", tFirst, null);
  row("customers row created", tAccount, tFirst);
  row("order created", tOrder, tAccount || tFirst);
  row("paid_at", tPaid, tOrder);
  row("wave_payment_recorded_at", tWaveBooked, tPaid);

  console.log(`\nItems (${items.length}):`);
  for (const it of items) {
    const rush = it.is_rush ? "  RUSH" : "";
    const dims = (it.width_in && it.height_in) ? `${it.width_in}×${it.height_in}"` : "";
    const name = it.product_name ?? it.category ?? "—";
    console.log(`  • ${name}  ${it.material_code ?? ""} ${dims}  qty ${it.qty ?? "?"}  ${dollars(it.line_total)}${rush}  design=${it.design_status ?? "—"}`);
  }

  console.log(`\nDiscounts redeemed (${discounts.length}):`);
  if (!discounts.length) console.log(`  (none)`);
  for (const d of discounts) {
    const code = d.discount_codes?.code ?? d.code_id ?? "—";
    console.log(`  • ${code}  −${dollars(d.amount_saved)}  ${fmt(d.redeemed_at)}  order=${d.order_id ?? "—"}`);
  }

  console.log(`\nEmails sent for this customer / order (${emails.length}):`);
  if (!emails.length) console.log(`  (none in email_log — pre-2026-05 emails predate the table)`);
  for (const e of emails) {
    const opened = e.opened_at ? "  📭 opened" : "";
    const clicked = e.clicked_at ? "  🖱  clicked" : "";
    const delivered = e.delivered_at ? "" : (e.bounced_at ? "  ❌ bounced" : "");
    const matchOrder = e.order_id && order.id && e.order_id === order.id ? "✓" : " ";
    console.log(`  ${matchOrder} ${fmt(e.sent_at)}  ${e.status?.padEnd(10) ?? "—"}  → ${e.to_address}  «${(e.subject ?? "—").slice(0, 60)}»${delivered}${opened}${clicked}`);
  }

  console.log(`\nKey timings:`);
  console.log(`  account → order placed:    ${minutes(tAccount, tOrder)}`);
  console.log(`  order placed → paid:       ${minutes(tOrder, tPaid)}`);
  console.log(`  first touch → paid:        ${minutes(tFirst || tAccount, tPaid)}`);
  console.log("");
}

async function main() {
  const orders = await pickOrder();
  if (!orders.length) {
    console.log("No matching order found.");
    process.exit(1);
  }
  for (const order of orders) {
    const profile = await customerProfile(order.customer_id, null);
    const customerId = order.customer_id ?? profile.auth?.id ?? null;
    const email = profile.auth?.email ?? null;
    const [discounts, emails, items] = await Promise.all([
      discountForOrder(order.id, customerId),
      emailsForOrder(order.id, customerId, email),
      itemsForOrder(order.id),
    ]);
    printJourney({ order, profile, discounts, emails, items });
  }
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
