/**
 * Diagnose-only: for each unfixed zombie, pull DB order_items + Wave invoice
 * line items + retry Clover with wider window. Surface the discrepancy.
 *
 * Usage:  railway run -- node scripts/investigate-drift-zombies.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const WAVE_TOKEN = process.env.WAVE_API_TOKEN;
const WAVE_BIZ = process.env.WAVE_BUSINESS_ID ?? "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const CLOVER_KEY = process.env.CLOVER_API_KEY;
const CLOVER_MID = process.env.CLOVER_MERCHANT_ID;
const CLOVER_BASE = process.env.CLOVER_ENVIRONMENT === "sandbox"
  ? "https://apisandbox.dev.clover.com" : "https://api.clover.com";

const TARGETS = [
  "TC-2026-0107", // Damon Miller, partial Wave $149.85 of $202.35
  "TC-2026-0077", // Corleen, $11.10 drift
  "TC-2026-0073", // Melissa Francis, $11.10 drift
  "TC-2026-0072", // Avleen kaur, $11.10 drift
  "TC-2026-0067", // Glen Funk, Clover 429 originally
  "TC-2026-0062", // Rhonda Seidel, no Clover match
  "TC-2026-0047", // Brit Macdonald, $2 reverse drift
];

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`sb ${res.status}: ${await res.text()}`);
  return res.json();
}

async function waveQ(query, variables) {
  const res = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${WAVE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`wave: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function cloverWideSearch(amountCents, paidAtIso, windowHours = 24) {
  const paidMs = new Date(paidAtIso).getTime();
  const url = new URL(`${CLOVER_BASE}/v3/merchants/${CLOVER_MID}/payments`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("expand", "order,tender");
  url.searchParams.append("filter", `createdTime>=${paidMs - windowHours * 3600 * 1000}`);
  url.searchParams.append("filter", `createdTime<${paidMs + windowHours * 3600 * 1000}`);
  url.searchParams.append("filter", `amount=${amountCents}`);
  let res;
  for (let i = 0; i < 3; i++) {
    res = await fetch(url, { headers: { Authorization: `Bearer ${CLOVER_KEY}` } });
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  if (!res.ok) return { error: `clover ${res.status}` };
  const data = await res.json();
  return { elements: data.elements ?? [] };
}

for (const orderNum of TARGETS) {
  console.log(`\n========== ${orderNum} ==========`);

  // DB order + items
  const orders = await sb(`orders?order_number=eq.${orderNum}&select=*,customers(email,name),order_items(*)`);
  const o = orders[0];
  if (!o) { console.log("  not found"); continue; }
  console.log(`  customer: ${o.customers?.email} (${o.customers?.name})`);
  console.log(`  DB total: $${o.total}  subtotal: $${o.subtotal ?? "?"}  gst: $${o.gst ?? "?"}  pst: $${o.pst ?? "?"}  discount: $${o.discount_amount ?? 0}`);
  console.log(`  paid_at: ${o.paid_at}  method: ${o.payment_method}  status: ${o.status}`);
  console.log(`  items (${o.order_items?.length ?? 0}):`);
  for (const it of o.order_items ?? []) {
    console.log(`    - ${it.product_name ?? it.category ?? "?"} qty=${it.quantity} unit_price=$${it.unit_price ?? "?"} line_total=$${it.line_total ?? "?"}`);
  }

  // Wave invoice details
  if (o.wave_invoice_id) {
    try {
      const d = await waveQ(
        `query($b: ID!, $i: ID!) {
          business(id: $b) {
            invoice(id: $i) {
              id invoiceNumber status invoiceDate
              total { value } subtotal { value } amountPaid { value } amountDue { value }
              taxTotals { amount { value } salesTax { name rate } }
              items { description quantity unitPrice price { value } subtotal { value } total { value } }
            }
          }
        }`,
        { b: WAVE_BIZ, i: o.wave_invoice_id }
      );
      const inv = d.business?.invoice;
      if (inv) {
        console.log(`  Wave inv #${inv.invoiceNumber} (${inv.status}): total=$${inv.total?.value} subtotal=$${inv.subtotal?.value} paid=$${inv.amountPaid?.value} due=$${inv.amountDue?.value}`);
        for (const t of inv.taxTotals ?? []) console.log(`    tax: ${t.salesTax?.name} ${t.salesTax?.rate}% = $${t.amount?.value}`);
        for (const it of inv.items ?? []) {
          console.log(`    line: ${it.description?.slice(0, 60)} qty=${it.quantity} unit=${it.unitPrice} total=$${it.total?.value}`);
        }
      }
    } catch (e) {
      console.log(`  Wave query failed: ${e.message}`);
    }
  }

  // Clover wide search
  const c = await cloverWideSearch(Math.round(o.total * 100), o.paid_at, 24);
  if (c.error) {
    console.log(`  Clover ±24h ${o.total * 100}¢: ${c.error}`);
  } else {
    const successes = c.elements.filter((p) => p.result === "SUCCESS");
    console.log(`  Clover ±24h ${Math.round(o.total * 100)}¢ → ${c.elements.length} total, ${successes.length} SUCCESS`);
    for (const p of successes.slice(0, 3)) {
      console.log(`    - ${p.id} ${new Date(p.createdTime).toISOString()} amount=$${(p.amount/100).toFixed(2)} order_title="${(p.order?.title ?? "").slice(0, 50)}"`);
    }
    if (!successes.length && o.payment_method === "clover_card") {
      // Try searching for the Wave invoice total instead (in case checkout amount was different)
      console.log(`  → retrying Clover with no amount filter ±2h (any amount)...`);
      const paidMs = new Date(o.paid_at).getTime();
      const url = new URL(`${CLOVER_BASE}/v3/merchants/${CLOVER_MID}/payments`);
      url.searchParams.set("limit", "50");
      url.searchParams.append("filter", `createdTime>=${paidMs - 2 * 3600 * 1000}`);
      url.searchParams.append("filter", `createdTime<${paidMs + 2 * 3600 * 1000}`);
      const r = await fetch(url, { headers: { Authorization: `Bearer ${CLOVER_KEY}` } });
      if (r.ok) {
        const d = await r.json();
        const succ = (d.elements ?? []).filter((p) => p.result === "SUCCESS");
        console.log(`    → ${succ.length} SUCCESS payments in window, amounts: ${succ.map(p => `$${(p.amount/100).toFixed(2)}`).join(", ")}`);
      }
    }
  }
}
console.log();
