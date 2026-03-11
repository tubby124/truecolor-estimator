/**
 * Payment Flow Smoke Test
 *
 * Fully automated — no staff login required. Creates a test order directly
 * via Supabase service key, then exercises the two HTTP endpoints that
 * handle Clover payment confirmation.
 *
 * Tests:
 *   1. Order created with status = pending_payment ✓
 *   2. GET /order-confirmed does NOT flip status to payment_received ✓  (regression)
 *   3. POST /api/webhooks/clover (valid HMAC) → status = payment_received ✓
 *   4. Duplicate webhook is idempotent (no double-confirm) ✓
 *
 * Usage:
 *   node scripts/test-payment-flow.mjs
 *
 * Required in .env.local:
 *   NEXT_PUBLIC_SITE_URL        — e.g. http://localhost:3000
 *   NEXT_PUBLIC_SUPABASE_URL    — Supabase project URL
 *   SUPABASE_SECRET_KEY         — service role key
 *   PAYMENT_TOKEN_SECRET        — for HMAC-signing the fake webhook
 */

import { readFileSync } from "fs";
import { createHmac } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const envPath    = resolve(__dirname, "../.env.local");
try {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* fall through to process.env */ }

const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SB_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";
const SB_KEY       = process.env.SUPABASE_SECRET_KEY;
const TOKEN_SECRET = process.env.PAYMENT_TOKEN_SECRET;

// ── Pre-flight ────────────────────────────────────────────────────────────────
console.log("── Payment Flow Smoke Test ──────────────────────────────────");
console.log(`  Target : ${SITE_URL}`);
console.log(`  Supa   : ${SB_URL}`);
console.log(`  SB key : ${SB_KEY  ? SB_KEY.slice(0,12)+"…"  : "MISSING"}`);
console.log(`  Secret : ${TOKEN_SECRET ? TOKEN_SECRET.slice(0,8)+"…" : "MISSING"}`);
console.log("─────────────────────────────────────────────────────────────\n");

if (!SB_KEY)       { console.error("❌  SUPABASE_SECRET_KEY required"); process.exit(1); }
if (!TOKEN_SECRET) { console.error("❌  PAYMENT_TOKEN_SECRET required"); process.exit(1); }

// ── Supabase REST helpers ─────────────────────────────────────────────────────
const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbInsert(table, row) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: SB_HEADERS,
    body: JSON.stringify(row),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`INSERT ${table} failed ${res.status}: ${text}`);
  const rows = JSON.parse(text);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function sbUpsert(table, row, onConflict) {
  const url = `${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...SB_HEADERS, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`UPSERT ${table} failed ${res.status}: ${text}`);
  const rows = JSON.parse(text);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function sbGet(table, id) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}&select=*`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

async function sbDelete(table, filter) {
  const url = `${SB_URL}/rest/v1/${table}?${filter}`;
  await fetch(url, { method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
}

// ── Assertion helpers ─────────────────────────────────────────────────────────
let pass = 0, fail = 0;

function ok(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅  ${label}`);
    pass++;
  } else {
    console.log(`  ❌  ${label}${detail ? `  (${detail})` : ""}`);
    fail++;
  }
}

// ── Setup: create test customer + order ───────────────────────────────────────
const TEST_EMAIL  = `smoke-test-payment-${Date.now()}@test.truecolorprinting.ca`;
const ORDER_YEAR  = new Date().getFullYear();
const ORDER_NUM   = `TC-${ORDER_YEAR}-TEST-${Date.now()}`;

let customerId, orderId;

console.log("── Setup ────────────────────────────────────────────────────");
try {
  const customer = await sbUpsert("customers", {
    email: TEST_EMAIL,
    name: "Smoke Test Customer",
    company: "Automated Test",
    phone: null,
  }, "email");
  customerId = customer.id;
  console.log(`  Customer : ${TEST_EMAIL} (${customerId})`);

  // payment_reference = our UUID (simulating what /pay/[token] now stores)
  // We'll update it to orderId once we have it
  const order = await sbInsert("orders", {
    order_number: ORDER_NUM,
    customer_id: customerId,
    status: "pending_payment",
    is_rush: false,
    subtotal: 45.00,
    gst: 2.25,
    pst: 2.70,
    total: 49.95,
    payment_method: "clover_card",
    notes: "Automated smoke test — safe to delete",
    staff_notes: "SMOKE TEST",
  });
  orderId = order.id;

  // Set payment_reference = our UUID (this is what the fixed /pay/[token] now does)
  await fetch(`${SB_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: SB_HEADERS,
    body: JSON.stringify({ payment_reference: orderId }),
  });

  console.log(`  Order    : ${ORDER_NUM} (${orderId})`);
  console.log(`  Status   : pending_payment\n`);
} catch (err) {
  console.error(`❌  Setup failed: ${err.message}`);
  process.exit(1);
}

// ── Test 1: Initial status ────────────────────────────────────────────────────
console.log("── Test 1: Order starts as pending_payment ──────────────────");
const fresh = await sbGet("orders", orderId);
ok("status = pending_payment",         fresh?.status === "pending_payment", `got: ${fresh?.status}`);
ok("payment_method = clover_card",     fresh?.payment_method === "clover_card");
ok("payment_reference = order UUID",   fresh?.payment_reference === orderId);

// ── Test 2: /order-confirmed does NOT auto-confirm ────────────────────────────
console.log("\n── Test 2: /order-confirmed redirect (regression) ───────────");
try {
  const res = await fetch(`${SITE_URL}/order-confirmed?oid=${orderId}`, {
    redirect: "follow",
    headers: { "User-Agent": "TC-smoke-test" },
  });
  console.log(`  HTTP ${res.status} from /order-confirmed`);
  ok("Page returned 200",              res.status === 200, `got: ${res.status}`);

  const afterRedirect = await sbGet("orders", orderId);
  ok(
    "Status STILL pending_payment after redirect",
    afterRedirect?.status === "pending_payment",
    `got: ${afterRedirect?.status} — auto-confirm bug would show 'payment_received'`
  );
} catch (err) {
  console.log(`  ⚠️  Could not reach ${SITE_URL} — ${err.message}`);
  console.log("     Start the dev server (npm run dev) to test HTTP endpoints.\n");
  ok("order-confirmed page reachable", false, err.message);
}

// ── Test 3: Clover webhook confirms payment ───────────────────────────────────
console.log("\n── Test 3: Webhook confirms payment ─────────────────────────");
const webhookBody = JSON.stringify({
  type: "PAYMENT",
  object: {
    status: "captured",
    externalReferenceId: orderId,           // our UUID — the fixed flow sets this
    orderId: `clover-internal-${Date.now()}`, // Clover's own ID (different)
    amount: 4995,
  },
});
const sig = createHmac("sha256", TOKEN_SECRET).update(webhookBody).digest("base64");

try {
  const wRes = await fetch(`${SITE_URL}/api/webhooks/clover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clover-signature": sig },
    body: webhookBody,
  });
  const wData = await wRes.json();
  ok("Webhook returns 200",            wRes.status === 200, `got: ${wRes.status} — ${JSON.stringify(wData)}`);

  await new Promise(r => setTimeout(r, 600)); // let DB write propagate

  const afterWebhook = await sbGet("orders", orderId);
  ok("Status = payment_received",      afterWebhook?.status === "payment_received", `got: ${afterWebhook?.status}`);
  ok("paid_at is set",                 !!afterWebhook?.paid_at,                     `got: ${afterWebhook?.paid_at}`);
} catch (err) {
  console.log(`  ⚠️  Webhook unreachable — ${err.message}`);
  ok("Webhook endpoint reachable",     false, err.message);
}

// ── Test 4: Duplicate webhook is idempotent ───────────────────────────────────
console.log("\n── Test 4: Duplicate webhook is idempotent ──────────────────");
try {
  const wRes2 = await fetch(`${SITE_URL}/api/webhooks/clover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clover-signature": sig },
    body: webhookBody,
  });
  ok("Duplicate webhook returns 200",  wRes2.status === 200, `got: ${wRes2.status}`);

  await new Promise(r => setTimeout(r, 300));

  const afterDupe = await sbGet("orders", orderId);
  ok("Status still payment_received",  afterDupe?.status === "payment_received", `got: ${afterDupe?.status}`);
} catch (err) {
  ok("Duplicate webhook reachable",    false, err.message);
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
console.log("\n── Cleanup ──────────────────────────────────────────────────");
try {
  await sbDelete("order_items", `order_id=eq.${orderId}`);
  await sbDelete("orders",      `id=eq.${orderId}`);
  await sbDelete("customers",   `id=eq.${customerId}`);
  console.log(`  Deleted order ${ORDER_NUM} + customer ${TEST_EMAIL}`);
} catch (err) {
  console.log(`  ⚠️  Cleanup failed: ${err.message}`);
  console.log(`     Manually delete order id=${orderId} from Supabase`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n── Results ──────────────────────────────────────────────────");
console.log(`  Passed: ${pass} | Failed: ${fail}`);
if (fail > 0) {
  console.log("\n❌  FAILED — see above.\n");
  process.exit(1);
} else {
  console.log("\n✅  All tests passed — payment flow is correctly gated.\n");
}
