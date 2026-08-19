/**
 * Backfill TC-2026-0322 — paid via Clover 2026-08-10 but webhook could not match
 * the order (checkout session e6406d84 never persisted to the order row), so the
 * PAYMENT webhook logged "no order found" and the order stayed pending_payment.
 *
 * Evidence chain (audited 2026-08-19):
 *   - Clover web payment VVJXBFBZPYG8A captured 2026-08-10 20:43 UTC, $127.65
 *   - webhook_events id=40: clover PAYMENT, resource VVJXBFBZPYG8A, ok=false,
 *     "no order found for payment_reference/session=e6406d84-..."
 *   - Order TC-2026-0322 (same customer) created 2026-08-10 20:43 UTC, $127.65,
 *     status pending_payment, no payment_attempts rows
 *   - NEW ORDER email subject says "Card (Clover)" not "(Pending)"
 *
 * Wave: left to reconcile-payments cron (paid_at + wave_invoice_id + null
 * wave_payment_recorded_at → auto-records). Verified in route line ~588.
 *
 * Usage:
 *   node scripts/backfill-tc2026-0322.mjs            # dry-run
 *   node scripts/backfill-tc2026-0322.mjs --apply
 */

const APPLY = process.argv.includes("--apply");

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.TRUECOLOR_SUPABASE_URL ??
  "https://dczbgraekmzirxknjvwe.supabase.co";
const SB_KEY =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.TRUECOLOR_SUPABASE_SECRET_KEY;

if (!SB_KEY) {
  console.error("SUPABASE_SECRET_KEY missing");
  process.exit(1);
}

const TARGET = {
  order_number: "TC-2026-0322",
  amount: 127.65,
  clover_payment_id: "VVJXBFBZPYG8A",
  paid_at: "2026-08-10T20:43:34.000Z",
  reason:
    "Clover web payment captured 2026-08-10 20:43 UTC; webhook unmatched (session e6406d84 not stored). Same-minute order creation + exact amount + same customer.",
};

async function sb(method, path, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

console.log(`── Backfill TC-2026-0322 ${APPLY ? "(APPLY)" : "(dry-run)"} ──`);

// [1] Verify current state — never overwrite a already-fixed row
const rows = await sb(
  "GET",
  `orders?select=id,order_number,status,total,paid_at,wave_invoice_id,payment_reference&order_number=eq.${TARGET.order_number}`,
);

if (rows.length === 0) {
  console.error(`✗ ${TARGET.order_number} not found — aborting`);
  process.exit(1);
}

const order = rows[0];
if (order.status !== "pending_payment") {
  console.log(`✓ ${TARGET.order_number} already status="${order.status}" — nothing to do`);
  process.exit(0);
}
if (Math.abs(Number(order.total) - TARGET.amount) > 0.01) {
  console.error(
    `✗ amount mismatch: DB $${order.total} vs Clover $${TARGET.amount} — manual review required`,
  );
  process.exit(1);
}
if (order.paid_at) {
  console.error(`✗ paid_at already set (${order.paid_at}) — manual review required`);
  process.exit(1);
}

console.log(
  `→ ready: ${TARGET.order_number} $${order.total} wave_invoice_id=${order.wave_invoice_id ? "present" : "MISSING"}`,
);
if (!order.wave_invoice_id) {
  console.log("  ⚠️ no wave_invoice_id — reconcile cron cannot auto-record Wave; staff must record manually");
}

if (!APPLY) {
  console.log(`\nDRY-RUN — would patch id=${order.id}:`);
  console.log(`  status:            pending_payment → payment_received`);
  console.log(`  paid_at:           null → ${TARGET.paid_at}`);
  console.log(`  payment_reference: null → ${TARGET.clover_payment_id}`);
  console.log(`  staff_notes:       + reconciliation evidence`);
  console.log("\nRe-run with --apply to commit.");
  process.exit(0);
}

// [2] Apply — guarded to flip only if still pending (idempotent vs concurrent webhook)
const patched = await sb(
  "PATCH",
  `orders?id=eq.${order.id}&status=eq.pending_payment`,
  {
    status: "payment_received",
    paid_at: TARGET.paid_at,
    payment_reference: TARGET.clover_payment_id,
    staff_notes: `[2026-08-19 backfill] Clover payment ${TARGET.clover_payment_id} ($${TARGET.amount}) captured 2026-08-10 but webhook could not match order (checkout session not persisted). Reconciled from Clover REST + webhook_events id=40. ${TARGET.reason}`,
  },
);

if (patched.length === 0) {
  console.error("✗ guard matched 0 rows — order changed concurrently; re-verify before retrying");
  process.exit(1);
}

console.log(`✓ ${TARGET.order_number} → payment_received, paid_at=${TARGET.paid_at}`);
console.log("Next: reconcile-payments cron records the Wave payment automatically (verified pattern).");
