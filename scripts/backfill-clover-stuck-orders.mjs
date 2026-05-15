/**
 * Backfill 3 historically-stuck Clover orders (cross-referenced against Clover
 * payments via MCP audit on 2026-05-15).
 *
 * Each order:
 *   - was paid via Clover hosted checkout (money is in Clover)
 *   - had payment_reference = NULL in Supabase (bug fixed in commit 9e383a3)
 *   - never received the auto webhook flip from pending_payment → payment_received
 *   - sat as pending_payment in Supabase for weeks/months
 *
 * Skipped: TC-2026-0057 (Muthu / prairiedonair) — genuinely unpaid.
 *
 * Usage:
 *   railway run -- node scripts/backfill-clover-stuck-orders.mjs        # dry-run
 *   railway run -- node scripts/backfill-clover-stuck-orders.mjs --apply
 */

const APPLY = process.argv.includes("--apply");
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";
const SB_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SB_KEY) { console.error("SUPABASE_SECRET_KEY missing"); process.exit(1); }

console.log(`── Backfill stuck Clover orders ${APPLY ? "(APPLY)" : "(dry-run)"} ──`);

// Cross-referenced against Clover ledger via MCP — see vault audit doc
// "Projects/true-color/2026-05-15-void-supabase-bug-audit.md"
const STUCK_ORDERS = [
  {
    order_number: "TC-2026-0075",
    customer: "Amos / tridahmedia.com",
    amount: 134.31,
    clover_payment_id: "853Z4ZBN0H1XC",
    clover_order_id: "2FE2PVXYEXFF2",
    paid_at: "2026-05-12T17:36:00.000Z",
    reason: "Clover paid 2026-05-12 (+1d after order). Exact amount match.",
  },
  {
    order_number: "TC-2026-0063",
    customer: "Joshua Bagchi / prairiedonair.com",
    amount: 566.10,
    clover_payment_id: "KYF7VFJ0W7QEY",
    clover_order_id: "DZR8F238007TE",
    paid_at: "2026-04-08T18:30:45.000Z",
    reason: "Clover paid 2026-04-08. Description 'Window Decals — 4 windows decals with installation' matches DB item verbatim. (Different from Muthu's 0057 which was '38.5\" x 64\"'.)",
  },
  {
    order_number: "TC-2026-0031",
    customer: "Eduardo / Magnus Insulation",
    amount: 976.80,
    clover_payment_id: "X1HMA63DR2A92",
    clover_order_id: "FX5VZ3A36939A",
    paid_at: "2026-03-30T18:11:57.000Z",
    reason: "Clover paid 2026-03-30 (+20d after order — staff likely sent a manual Clover link, customer paid days later).",
  },
];

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

// 1. Verify each order is still pending_payment (don't overwrite if already fixed)
console.log("\n[1] Verifying current state...");
for (const o of STUCK_ORDERS) {
  const rows = await sb("GET", `orders?select=id,order_number,status,total,payment_reference&order_number=eq.${o.order_number}`);
  if (rows.length === 0) {
    console.log(`    ⚠️  ${o.order_number} not found — skipping`);
    o._skip = "not_found";
  } else if (rows[0].status !== "pending_payment") {
    console.log(`    ✓ ${o.order_number} already at status="${rows[0].status}" — no change needed`);
    o._skip = `already_${rows[0].status}`;
  } else if (Math.abs(Number(rows[0].total) - o.amount) > 0.01) {
    console.log(`    ⚠️  ${o.order_number} amount mismatch: DB $${rows[0].total} vs Clover $${o.amount} — manual review`);
    o._skip = "amount_mismatch";
  } else {
    o._id = rows[0].id;
    console.log(`    → ${o.order_number} ready to backfill (${o.customer}, $${o.amount})`);
  }
}

const toApply = STUCK_ORDERS.filter((o) => o._id);
console.log(`\n[2] ${toApply.length} of ${STUCK_ORDERS.length} orders ready to backfill`);

if (toApply.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

if (!APPLY) {
  console.log("\n[3] DRY-RUN — would patch:");
  toApply.forEach((o) => {
    console.log(`    ${o.order_number}: status → payment_received, paid_at → ${o.paid_at}, payment_reference → ${o._id}`);
    console.log(`       evidence: ${o.reason}`);
  });
  console.log("\nRe-run with --apply to commit.");
  process.exit(0);
}

console.log("\n[3] Applying patches...");
let okCount = 0, failCount = 0;
for (const o of toApply) {
  try {
    await sb("PATCH", `orders?id=eq.${o._id}&status=eq.pending_payment`, {
      status: "payment_received",
      paid_at: o.paid_at,
      payment_reference: o._id,  // backfill the missing payment_reference too
      staff_notes: `[2026-05-15 backfill] Clover payment ${o.clover_payment_id} reconciled — order was paid ${o.paid_at} but webhook missed due to void-supabase bug (commit 9e383a3).`,
    });
    console.log(`    ✓ ${o.order_number} — status=payment_received, paid_at=${o.paid_at.slice(0,10)}`);
    okCount++;
  } catch (err) {
    console.error(`    ✗ ${o.order_number}: ${err.message}`);
    failCount++;
  }
}
console.log(`\n${okCount} backfilled, ${failCount} failed.`);
console.log("Note: TC-2026-0057 (Muthu) intentionally NOT backfilled — genuinely unpaid.");
