/**
 * scripts/test-email-flow.mjs
 *
 * End-to-end smoke test for the post-cut email pipeline.
 *
 * Creates a fake order in prod Supabase, fires a signed Clover webhook,
 * then queries email_log to verify which emails actually went out and
 * whether subjects use the new product-anchored format.
 *
 * Usage:
 *   railway run -- node scripts/test-email-flow.mjs
 *
 * Required env (from Railway):
 *   NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SECRET_KEY · PAYMENT_TOKEN_SECRET
 *   NEXT_PUBLIC_SITE_URL (default: https://truecolorprinting.ca)
 *
 * The test customer email is hasan.sharif.realtor@gmail.com so Hasan can
 * SEE the new subject + preheader + line items in his inbox.
 * Cleanup runs at the end (delete order_items, order, customer) so prod
 * data isn't polluted.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
const CLOVER_WEBHOOK_SECRET = process.env.CLOVER_WEBHOOK_SECRET;
const HASAN_EMAIL = "hasan.sharif.realtor@gmail.com";

console.log("── Email-flow smoke test ────────────────────────────────────");
console.log(`  Target : ${SITE_URL}`);
console.log(`  Supa   : ${SB_URL}`);
console.log(`  Inbox  : ${HASAN_EMAIL}`);
console.log("─────────────────────────────────────────────────────────────\n");

if (!SB_KEY) { console.error("❌  SUPABASE_SECRET_KEY required (railway run -- ...)"); process.exit(1); }
if (!CLOVER_WEBHOOK_SECRET) { console.error("❌  CLOVER_WEBHOOK_SECRET required"); process.exit(1); }

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
  if (!res.ok) throw new Error(`INSERT ${table} ${res.status}: ${text}`);
  const rows = JSON.parse(text);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function sbUpsert(table, row, onConflict) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...SB_HEADERS, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`UPSERT ${table} ${res.status}: ${text}`);
  const rows = JSON.parse(text);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function sbDelete(table, filter) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
}

async function sbQuery(table, filter, select = "*", order = "") {
  const orderQs = order ? `&order=${order}` : "";
  const res = await fetch(
    `${SB_URL}/rest/v1/${table}?${filter}&select=${select}${orderQs}`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  return res.json();
}

// ── 1. Setup test order ──────────────────────────────────────────────────────
const ORDER_NUM = `TC-EMAIL-TEST-${Date.now()}`;
console.log(`\n[1] Creating fake order ${ORDER_NUM}...`);

const customer = await sbUpsert(
  "customers",
  { email: HASAN_EMAIL, name: "Hasan (Email Smoke Test)", phone: "+13069548688" },
  "email"
);
console.log(`    customer: ${customer.id}`);

const order = await sbInsert("orders", {
  order_number: ORDER_NUM,
  customer_id: customer.id,
  status: "pending_payment",
  is_rush: false,
  subtotal: 65.00,
  gst: 3.25,
  pst: 3.90,
  total: 72.15,
  payment_method: "clover_card",
  payment_reference: null,  // will be set below
  notes: "EMAIL SMOKE TEST — safe to delete",
  staff_notes: "EMAIL SMOKE TEST",
});
console.log(`    order   : ${order.id}`);

await fetch(`${SB_URL}/rest/v1/orders?id=eq.${order.id}`, {
  method: "PATCH",
  headers: SB_HEADERS,
  body: JSON.stringify({ payment_reference: order.id }),
});

await sbInsert("order_items", {
  order_id: order.id,
  category: "BUSINESS_CARD",
  product_name: "Business Cards",
  qty: 50,
  width_in: 3.5,
  height_in: 2,
  sides: 2,
  unit_price: 1.30,
  line_total: 65.00,
  is_rush: false,
  design_status: "PRINT_READY",
});
console.log(`    items   : 50 Business Cards @ $65`);

// ── 2. Fire Clover webhook ───────────────────────────────────────────────────
console.log(`\n[2] Firing Clover webhook (?k= secret)...`);
const webhookBody = JSON.stringify({
  type: "PAYMENT",
  object: {
    status: "captured",
    externalReferenceId: order.id,
    orderId: `clover-test-${Date.now()}`,
    amount: 7215,
  },
});

const webhookStartedAt = new Date().toISOString();
const wRes = await fetch(
  `${SITE_URL}/api/webhooks/clover?k=${encodeURIComponent(CLOVER_WEBHOOK_SECRET)}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: webhookBody,
  }
);
const wText = await wRes.text();
console.log(`    HTTP ${wRes.status} — ${wText.slice(0, 200)}`);

// ── 3. Wait for async email send, then check email_log ──────────────────────
console.log(`\n[3] Waiting 8s for async emails to land in email_log...`);
await new Promise((r) => setTimeout(r, 8000));

const logs = await sbQuery(
  "email_log",
  `to_address=eq.${encodeURIComponent(HASAN_EMAIL)}&sent_at=gte.${encodeURIComponent(webhookStartedAt)}`,
  "sent_at,subject,status,email_type",
  "sent_at.asc"
);

console.log(`\n[4] Emails fired since webhook (${logs.length}):`);
if (logs.length === 0) {
  console.log("    ⚠️  No rows. Email send may have failed or email_log write lagged.");
} else {
  logs.forEach((l, i) => {
    console.log(`    ${i + 1}. ${l.sent_at}`);
    console.log(`       subject : ${l.subject}`);
    console.log(`       status  : ${l.status}`);
  });
}

// ── 5. Assertions ────────────────────────────────────────────────────────────
console.log(`\n[5] Verifying post-cut email behaviour:`);

const subjects = logs.map((l) => l.subject ?? "");

const hasReceipt = subjects.some((s) => s.startsWith("Receipt"));
const hasOldStatusEmail = subjects.some((s) => s.includes("is in the queue") || s.includes("payment received"));
const usesProductAnchor = subjects.some((s) => s.toLowerCase().includes("business cards"));

console.log(`    ${hasReceipt ? "✅" : "❌"} paymentReceipt fired`);
console.log(`    ${!hasOldStatusEmail ? "✅" : "❌"} statusUpdate(payment_received) was NOT sent (was duplicate)`);
console.log(`    ${usesProductAnchor ? "✅" : "❌"} subject uses product anchor ("business cards")`);

// ── 6. Cleanup ───────────────────────────────────────────────────────────────
// Keep the customer record (it may already have legit prior orders).
// Only delete what this test created: order_items + order.
console.log(`\n[6] Cleaning up test order...`);
await sbDelete("order_items", `order_id=eq.${order.id}`);
await sbDelete("orders", `id=eq.${order.id}`);
console.log(`    ✓ Test order + items deleted (customer kept — may have prior orders).`);

const allPass = hasReceipt && !hasOldStatusEmail && usesProductAnchor;
console.log(`\n${allPass ? "✅  ALL CHECKS PASSED" : "❌  SOMETHING'S OFF — review above"}`);
console.log(`📬  Check your inbox for the test receipt email.\n`);
process.exit(allPass ? 0 : 1);
