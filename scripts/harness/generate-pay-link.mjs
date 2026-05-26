#!/usr/bin/env node
/**
 * Generate a Clover Pay Now link for an existing order.
 *
 * Use when an order was created via a code path that didn't email a Pay Now
 * link (e.g. the old Wave quote-only flow before 2026-05-26). Run, paste the
 * URL to the customer via the staff email tool.
 *
 *   node scripts/harness/generate-pay-link.mjs TC-2026-0113
 */

import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

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
const PAYMENT_TOKEN_SECRET = process.env.PAYMENT_TOKEN_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";

if (!SUPABASE_URL || !SUPABASE_KEY || !PAYMENT_TOKEN_SECRET) {
  console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY / PAYMENT_TOKEN_SECRET");
  process.exit(1);
}

const orderNumber = process.argv[2];
if (!orderNumber) {
  console.error("Usage: node scripts/harness/generate-pay-link.mjs TC-2026-NNNN");
  process.exit(1);
}

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/orders?order_number=eq.${orderNumber}&select=id,order_number,total,customers(name,email)`,
  { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
);
const orders = await res.json();
if (!orders || orders.length === 0) {
  console.error(`No order found for ${orderNumber}`);
  process.exit(1);
}
const o = orders[0];
const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;

const TOKEN_VERSION = 1;
const TTL_DAYS = 30;
const expiry = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000;
const payload = {
  v: TOKEN_VERSION,
  a: Math.round(Number(o.total) * 100),
  d: `Order ${o.order_number}`,
  e: expiry,
  em: customer?.email?.toLowerCase(),
  r: `${SITE_URL}/order-confirmed?oid=${o.id}`,
};
const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
const sig = createHmac("sha256", PAYMENT_TOKEN_SECRET).update(encoded).digest("base64url");
const token = `${encoded}.${sig}`;
const url = `${SITE_URL}/pay/${token}`;

console.log("");
console.log(`Order:    ${o.order_number}`);
console.log(`Customer: ${customer?.name ?? "—"} <${customer?.email ?? "—"}>`);
console.log(`Total:    $${Number(o.total).toFixed(2)} CAD`);
console.log(`Expires:  ${new Date(expiry).toISOString().slice(0, 10)} (30d)`);
console.log("");
console.log(`Pay Now URL:`);
console.log(`  ${url}`);
console.log("");
