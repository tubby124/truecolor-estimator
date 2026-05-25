#!/usr/bin/env node
/**
 * test-stuck-wave-order.mjs
 *
 * Creates a deliberately-stuck Wave order matching the exact bug pattern that
 * left 27 production orders unpaid in Wave (TC-2026-0108 et al.):
 *   - real Supabase order row
 *   - real Wave invoice (small amount, ~$1.05)
 *   - Wave invoice APPROVED (auto-approve at order creation, as production does)
 *   - paid_at set, status=payment_received
 *   - wave_payment_recorded_at LEFT NULL  ← the symptom
 *
 * Then prints a curl command you can fire to trigger the self-healing
 * reconcile-payments cron on Railway. The cron should auto-recover the order
 * (set wave_payment_recorded_at + actually record the payment in Wave).
 *
 * Verification checklist printed at the end. No real money moves.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", ".env.local");

const env = Object.fromEntries(
  readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY;
const WAVE_TOKEN = env.WAVE_API_TOKEN;
const WAVE_BIZ = env.WAVE_BUSINESS_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
if (!WAVE_TOKEN || !WAVE_BIZ) {
  console.error("Missing WAVE_API_TOKEN / WAVE_BUSINESS_ID in .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Wave GraphQL ────────────────────────────────────────────────────────────
async function waveQuery(query, variables) {
  const res = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WAVE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Wave: ${json.errors[0].message}`);
  }
  return json.data;
}

// Look up sales tax IDs + product ID from the Wave business
async function fetchWaveIds() {
  const data = await waveQuery(
    `query($bizId: ID!) {
      business(id: $bizId) {
        salesTaxes(page: 1, pageSize: 20) {
          edges { node { id name rate abbreviation } }
        }
        products(page: 1, pageSize: 50) {
          edges { node { id name isSold } }
        }
      }
    }`,
    { bizId: WAVE_BIZ }
  );
  const taxes = data.business?.salesTaxes?.edges?.map((e) => e.node) ?? [];
  const products = data.business?.products?.edges?.map((e) => e.node) ?? [];
  const gst = taxes.find((t) => /gst/i.test(t.name) && Number(t.rate) === 0.05);
  // Any active sold product works — we just need a valid productId reference.
  // Prefer "Sticker" since the test order item is a sticker.
  const product =
    products.find((p) => p.isSold && /^stickers?$/i.test(p.name)) ??
    products.find((p) => p.isSold);
  return { gstId: gst?.id, productId: product?.id };
}

async function createWaveCustomer(email, name) {
  // Try find by email first
  const found = await waveQuery(
    `query($bizId: ID!, $email: String!) {
      business(id: $bizId) {
        customers(email: $email) {
          edges { node { id } }
        }
      }
    }`,
    { bizId: WAVE_BIZ, email }
  );
  const existing = found.business?.customers?.edges?.[0]?.node?.id;
  if (existing) return existing;

  const data = await waveQuery(
    `mutation($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed
        inputErrors { message }
        customer { id }
      }
    }`,
    { input: { businessId: WAVE_BIZ, name, email } }
  );
  if (!data.customerCreate.didSucceed) {
    throw new Error(`customerCreate failed: ${data.customerCreate.inputErrors?.map((e) => e.message).join(", ")}`);
  }
  return data.customerCreate.customer.id;
}

async function createWaveInvoice(customerId, productId, gstId, orderNumber) {
  const data = await waveQuery(
    `mutation($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        inputErrors { message }
        invoice { id invoiceNumber viewUrl }
      }
    }`,
    {
      input: {
        businessId: WAVE_BIZ,
        customerId,
        status: "DRAFT",
        title: `True Color Order ${orderNumber}`,
        memo: `🧪 TEST ORDER — Wave payment-recording fix verification (2026-05-22). Safe to void.`,
        items: [
          {
            productId,
            description: "Test sticker — 1¢ verification line item",
            quantity: "1",
            unitPrice: "1.00",
            taxes: gstId ? [{ salesTaxId: gstId }] : [],
          },
        ],
      },
    }
  );
  if (!data.invoiceCreate.didSucceed) {
    throw new Error(`invoiceCreate failed: ${data.invoiceCreate.inputErrors?.map((e) => e.message).join(", ")}`);
  }
  return data.invoiceCreate.invoice;
}

async function approveWaveInvoice(invoiceId) {
  const data = await waveQuery(
    `mutation($input: InvoiceApproveInput!) {
      invoiceApprove(input: $input) {
        didSucceed
        inputErrors { message }
      }
    }`,
    { input: { invoiceId } }
  );
  if (!data.invoiceApprove.didSucceed) {
    throw new Error(`invoiceApprove failed: ${data.invoiceApprove.inputErrors?.map((e) => e.message).join(", ")}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧪 Setting up stuck-Wave-order test scenario…\n");

  // 1. Resolve Wave reference IDs
  const { gstId, productId } = await fetchWaveIds();
  if (!productId) {
    console.error("No 'Print Services' product found in Wave. Aborting.");
    process.exit(1);
  }
  console.log(`✓ Wave IDs resolved (productId, gstId)`);

  // 2. Create or find test customer in Supabase
  const TEST_EMAIL = "hasan.sharif.realtor@gmail.com";
  const TEST_NAME = "Hasan Sharif (TEST)";
  let { data: existingCust } = await sb
    .from("customers")
    .select("id")
    .eq("email", TEST_EMAIL)
    .maybeSingle();

  let customerId = existingCust?.id;
  if (!customerId) {
    const { data: newCust, error } = await sb
      .from("customers")
      .insert({ email: TEST_EMAIL, name: TEST_NAME, marketing_consent: false })
      .select("id")
      .single();
    if (error) throw error;
    customerId = newCust.id;
  }
  console.log(`✓ Supabase customer: ${customerId.slice(0, 8)}…`);

  // 3. Generate test order number — use a prefix so it's never confused with real
  const orderNumber = `TEST-${Date.now().toString().slice(-8)}`;

  // 4. Create Wave invoice in DRAFT, then approve (mimicking /api/orders/route.ts)
  const waveCustomerId = await createWaveCustomer(TEST_EMAIL, TEST_NAME);
  console.log(`✓ Wave customer: ${waveCustomerId.slice(0, 12)}…`);

  const invoice = await createWaveInvoice(waveCustomerId, productId, gstId, orderNumber);
  console.log(`✓ Wave invoice created: ${invoice.invoiceNumber ?? "(no number yet)"} — id ${invoice.id.slice(0, 24)}…`);

  await approveWaveInvoice(invoice.id);
  console.log(`✓ Wave invoice approved (matching production auto-approve-at-creation behavior)`);

  // 5. Insert Supabase order in the EXACT stuck state — payment_received,
  //    paid_at set, wave_invoice approved, wave_payment_recorded_at NULL.
  const nowIso = new Date().toISOString();
  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "payment_received",
      payment_method: "etransfer",
      payment_reference: `test-stuck-${Date.now()}`,
      subtotal: 1.0,
      gst: 0.05,
      pst: 0.0,
      total: 1.05,
      is_rush: false,
      paid_at: nowIso,
      wave_invoice_id: invoice.id,
      wave_invoice_number: invoice.invoiceNumber,
      wave_invoice_approved_at: nowIso,
      wave_payment_recorded_at: null, // ← the bug symptom
    })
    .select("id, order_number, total, wave_invoice_id, wave_invoice_approved_at, wave_payment_recorded_at")
    .single();
  if (orderErr) throw orderErr;
  console.log(`\n✓ Stuck order created: ${order.order_number} (id ${order.id.slice(0, 8)}…)`);

  // 6. Insert a single order_item so the receipt has something to render
  await sb.from("order_items").insert({
    order_id: order.id,
    product_name: "Test Sticker (1¢ verification)",
    category: "STICKER",
    qty: 1,
    width_in: 3,
    height_in: 3,
    sides: 1,
    line_total: 1.0,
    design_status: "PRINT_READY",
  });
  console.log(`✓ Order item attached`);

  // 7. Print verification + next-step instructions
  console.log("\n" + "─".repeat(70));
  console.log("📋 TEST SCENARIO READY");
  console.log("─".repeat(70));
  console.log(`Order number:           ${order.order_number}`);
  console.log(`Order UUID:             ${order.id}`);
  console.log(`Total:                  $${order.total} CAD`);
  console.log(`Wave invoice ID:        ${invoice.id}`);
  console.log(`Wave invoice number:    ${invoice.invoiceNumber ?? "(N/A)"}`);
  console.log(`Wave view URL:          ${invoice.viewUrl ?? "(check Wave dashboard)"}`);
  console.log(`Symptom:                wave_payment_recorded_at = NULL (matches TC-2026-0108)`);
  console.log("─".repeat(70));

  console.log(`
NEXT STEP — fire the reconcile cron from your shell (needs CRON_SECRET):

  curl -sS -H "Authorization: Bearer $CRON_SECRET" \\
    https://truecolorprinting.ca/api/cron/reconcile-payments | jq

Expected response:
  {
    "ok": true,
    "issues_total": 0,                ← or low (any unrelated drift)
    "auto_recovered": 1 (or more),    ← the test order got recovered
    "by_kind": { ..., "wave_recovery_failed": 0 }
  }

VERIFY (3 things):

  1. Supabase — wave_payment_recorded_at should now be set:
     SELECT order_number, wave_payment_recorded_at FROM orders
     WHERE order_number = '${order.order_number}';

  2. Wave dashboard — invoice ${invoice.invoiceNumber ?? invoice.id.slice(0, 12)}
     should show PAID status (Wave's money-transaction auto-reconciles to
     the open invoice with matching customer + amount).

  3. Telegram — should be SILENT (no 🚨 alerts because recovery succeeded).

CLEANUP (after verifying):

  -- void the Wave invoice (manually in Wave UI, or via voidWaveInvoice mutation)
  -- delete the test order:
  DELETE FROM order_items WHERE order_id = '${order.id}';
  DELETE FROM orders WHERE id = '${order.id}';
`);
}

main().catch((err) => {
  console.error("\n❌ Test setup failed:", err.message);
  process.exit(1);
});
