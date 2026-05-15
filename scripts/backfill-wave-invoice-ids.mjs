/**
 * One-off backfill: link orphaned Wave invoices to True Color orders.
 *
 * Wave has all the invoices. The DB has wave_invoice_id = NULL for ~30 days
 * worth of orders because `void supabase.update()` never fired the HTTP request.
 * This script:
 *   1. Pulls all True Color Wave invoices with titles "True Color Order TC-YYYY-NNNN"
 *   2. Matches each to a Supabase order by order_number
 *   3. Populates wave_invoice_id (and wave_invoice_approved_at if Wave status != DRAFT)
 *
 * Usage:
 *   railway run -- node scripts/backfill-wave-invoice-ids.mjs --dry-run   (default: dry)
 *   railway run -- node scripts/backfill-wave-invoice-ids.mjs --apply     (writes)
 */

const APPLY = process.argv.includes("--apply");
const WAVE_GQL = "https://gql.waveapps.com/graphql/public";
const TOKEN = process.env.WAVE_API_TOKEN;
const BIZ = "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dczbgraekmzirxknjvwe.supabase.co";
const SB_KEY = process.env.SUPABASE_SECRET_KEY;

if (!TOKEN) { console.error("WAVE_API_TOKEN missing"); process.exit(1); }
if (!SB_KEY) { console.error("SUPABASE_SECRET_KEY missing"); process.exit(1); }

console.log(`── Wave Invoice Backfill ${APPLY ? "(APPLY)" : "(dry-run)"} ──`);
console.log(`  Target : ${SB_URL}`);
console.log("─────────────────────────────────────────────────────");

async function waveQuery(query, variables) {
  const res = await fetch(WAVE_GQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  return res.json();
}

async function sbGet(table, filter, select = "*") {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}&select=${select}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  return res.json();
}

async function sbPatch(table, filter, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`PATCH ${table} ${res.status}: ${t}`);
  }
}

// 1. Pull every True Color Wave invoice (paginated)
console.log("\n[1] Pulling all Wave invoices (paginated)...");
const allInvoices = [];
let page = 1;
const PAGE_SIZE = 50;

while (true) {
  const resp = await waveQuery(
    `query($bizId: ID!, $page: Int!, $size: Int!) {
      business(id: $bizId) {
        invoices(page: $page, pageSize: $size, sort: [CREATED_AT_DESC]) {
          pageInfo { currentPage totalPages totalCount }
          edges { node { id invoiceNumber title status createdAt } }
        }
      }
    }`,
    { bizId: BIZ, page, size: PAGE_SIZE }
  );
  const inv = resp?.data?.business?.invoices;
  if (!inv) break;
  const edges = inv.edges ?? [];
  allInvoices.push(...edges.map((e) => e.node));
  console.log(`    page ${page}/${inv.pageInfo.totalPages} (${allInvoices.length}/${inv.pageInfo.totalCount})`);
  if (page >= inv.pageInfo.totalPages) break;
  page++;
}
console.log(`    pulled ${allInvoices.length} invoices total`);

// 2. Filter to those tied to True Color order numbers
const TC_TITLE = /^True Color Order (TC-\d{4}-\d{4})$/;
const tcInvoices = allInvoices
  .map((inv) => {
    const m = inv.title?.match(TC_TITLE);
    return m ? { ...inv, orderNumber: m[1] } : null;
  })
  .filter(Boolean);
console.log(`\n[2] ${tcInvoices.length} invoices have a matching "True Color Order TC-YYYY-NNNN" title`);

// 3. Pull all orders missing wave_invoice_id
console.log("\n[3] Pulling Supabase orders with NULL wave_invoice_id...");
const orphans = await sbGet(
  "orders",
  `wave_invoice_id=is.null&payment_method=eq.wave`,
  "id,order_number,status,wave_invoice_id,wave_invoice_approved_at"
);
console.log(`    ${orphans.length} Wave-method orders with NULL wave_invoice_id`);

// 4. Match + plan updates
const updates = [];
for (const order of orphans) {
  const inv = tcInvoices.find((i) => i.orderNumber === order.order_number);
  if (!inv) continue;
  const plan = {
    order_number: order.order_number,
    orderId: order.id,
    waveInvoiceId: inv.id,
    waveStatus: inv.status,
    setApprovedAt: inv.status !== "DRAFT" ? inv.createdAt : null,
  };
  updates.push(plan);
}
console.log(`\n[4] ${updates.length} orders can be backfilled:`);
updates.forEach((u) => {
  console.log(`    ${u.order_number} → Wave inv ${u.waveInvoiceId.slice(-12)} (${u.waveStatus})${u.setApprovedAt ? " + approved_at" : ""}`);
});

// 5. Apply or dry-run
if (!APPLY) {
  console.log(`\n[5] DRY-RUN — no writes. Re-run with --apply to commit.`);
  process.exit(0);
}

console.log(`\n[5] APPLYING ${updates.length} updates...`);
let okCount = 0, failCount = 0;
for (const u of updates) {
  try {
    const body = { wave_invoice_id: u.waveInvoiceId };
    if (u.setApprovedAt) body.wave_invoice_approved_at = u.setApprovedAt;
    await sbPatch("orders", `id=eq.${u.orderId}`, body);
    console.log(`    ✓ ${u.order_number}`);
    okCount++;
  } catch (err) {
    console.error(`    ✗ ${u.order_number}: ${err.message}`);
    failCount++;
  }
}
console.log(`\n${okCount} updated, ${failCount} failed.`);
