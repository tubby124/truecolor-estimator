/**
 * Archive test orders that polluted the zombie-payment alert.
 *
 * Targets: orders whose customer email matches a known-test pattern AND that
 * still flagged the zombie check (Wave shows underpaid but DB says paid).
 *
 * Archive = NULL paid_at, wave_payment_recorded_at, wave_invoice_id,
 * wave_invoice_approved_at. Data is preserved; reconciler checks 4, 5, 6 all
 * skip rows missing these fields. The Wave invoices in Wave stay as draft/overdue
 * and need to be voided manually in Wave UI if desired.
 *
 * Usage:
 *   railway run -- node scripts/archive-test-orders.mjs            # dry run
 *   RUN=1 railway run -- node scripts/archive-test-orders.mjs      # execute
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DRY = process.env.RUN !== "1";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

// Explicit allowlist — only these test orders identified by zombie verifier 2026-05-31
const TEST_ORDERS = [
  "TC-2026-0007", // hasan.sharif@exprealty.com — etransfer $397.22
  "TC-2026-0013", // hasan.sharif@exprealty.com — etransfer $73.50
  "TC-2026-0022", // hasan.sharif@exprealty.com — etransfer $229.95
  "TC-2026-0023", // hasan.sharif@exprealty.com — clover $31.50
  "TC-2026-0024", // hasan.sharif@exprealty.com — clover $73.50
  "TC-2026-0025", // hasan.sharif@exprealty.com — etransfer $105.00
  "TC-2026-0027", // sjdklfsld@live.com (test) — etransfer $219.37
];

const AUDIT_LOG = `logs/archive-test-orders-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jsonl`;
mkdirSync(dirname(AUDIT_LOG), { recursive: true });
const audit = (event, data) =>
  appendFileSync(AUDIT_LOG, JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + "\n");

async function sb(path, init) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

console.log(`\n=== ARCHIVE TEST ORDERS (${DRY ? "DRY RUN" : "LIVE"}) ===`);
console.log(`Audit log: ${AUDIT_LOG}\n`);
audit("run_started", { dry: DRY, targets: TEST_ORDERS });

const sel = "order_number,customer_id,total,payment_method,paid_at,wave_invoice_id,wave_invoice_approved_at,wave_payment_recorded_at,customers(email,name)";
const filter = `order_number=in.(${TEST_ORDERS.join(",")})`;
const rows = await sb(`orders?select=${encodeURIComponent(sel)}&${filter}`);

console.log(`Found ${rows.length} of ${TEST_ORDERS.length} expected orders.\n`);
console.log("Pre-archive state:");
for (const r of rows) {
  console.log(`  ${r.order_number} | ${r.customers?.email ?? "?"} | $${r.total} | paid_at=${r.paid_at?.slice(0, 10) ?? "null"} | wave_inv=${r.wave_invoice_id ? "set" : "null"}`);
}

// Safety: refuse to proceed if any row has a customer email outside the test pattern
const TEST_EMAIL_PATTERN = /^(hasan\.sharif@exprealty\.com|sjdklfsld@live\.com)$/i;
const violations = rows.filter((r) => !TEST_EMAIL_PATTERN.test(r.customers?.email ?? ""));
if (violations.length) {
  console.error(`\nABORT — ${violations.length} order(s) have non-test customer emails:`);
  for (const v of violations) console.error(`  ${v.order_number} → ${v.customers?.email}`);
  process.exit(2);
}

if (DRY) {
  console.log(`\n[DRY RUN] Would null: paid_at, wave_payment_recorded_at, wave_invoice_id, wave_invoice_approved_at on ${rows.length} rows.`);
  console.log(`Re-run with: RUN=1 railway run -- node scripts/archive-test-orders.mjs`);
  process.exit(0);
}

console.log("\nArchiving...");
let archived = 0;
for (const r of rows) {
  const before = {
    paid_at: r.paid_at,
    wave_payment_recorded_at: r.wave_payment_recorded_at,
    wave_invoice_id: r.wave_invoice_id,
    wave_invoice_approved_at: r.wave_invoice_approved_at,
  };
  try {
    const patch = {
      paid_at: null,
      wave_payment_recorded_at: null,
      wave_invoice_id: null,
      wave_invoice_approved_at: null,
    };
    await sb(`orders?order_number=eq.${r.order_number}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    console.log(`  ✓ ${r.order_number} archived (was paid_at=${before.paid_at?.slice(0, 10)}, wave_inv=${before.wave_invoice_id ? "set" : "null"})`);
    audit("archived", { order: r.order_number, before });
    archived++;
  } catch (e) {
    console.log(`  ✗ ${r.order_number}: ${e.message}`);
    audit("failed", { order: r.order_number, error: e.message });
  }
}

console.log(`\n=== DONE === archived=${archived}/${rows.length}`);
console.log(`Audit log: ${AUDIT_LOG}`);
console.log(`To restore: replay the audit log's 'before' values.`);
audit("run_complete", { archived, total: rows.length });
