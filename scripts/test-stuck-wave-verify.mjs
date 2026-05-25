#!/usr/bin/env node
/**
 * test-stuck-wave-verify.mjs
 *
 * Run AFTER firing the reconcile cron. Checks:
 *   1. wave_payment_recorded_at is now SET on the test order
 *   2. Wave invoice status (queries Wave API directly — should be PAID)
 *   3. Optional cleanup with --cleanup flag
 *
 * Usage:
 *   node scripts/test-stuck-wave-verify.mjs                 # verify only
 *   node scripts/test-stuck-wave-verify.mjs --cleanup        # verify + delete test order + void invoice
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
const cleanup = process.argv.includes("--cleanup");

async function waveQuery(query, variables) {
  const res = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WAVE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await res.json();
  if (j.errors?.length) throw new Error(`Wave: ${j.errors[0].message}`);
  return j.data;
}

async function main() {
  // Find the most recent TEST order (or look for TC-2026-0109 specifically)
  const { data: orders, error } = await sb
    .from("orders")
    .select("id, order_number, status, payment_method, total, paid_at, wave_invoice_id, wave_invoice_number, wave_invoice_approved_at, wave_payment_recorded_at, created_at")
    .or("order_number.like.TEST-%,order_number.eq.TC-2026-0109")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  if (!orders || orders.length === 0) {
    console.log("No test order found. Run test-stuck-wave-order.mjs first.");
    return;
  }

  const order = orders[0];
  console.log("📋 TEST ORDER STATE\n" + "─".repeat(70));
  console.log(`Order:                  ${order.order_number} (id ${order.id.slice(0, 8)}…)`);
  console.log(`Status:                 ${order.status}`);
  console.log(`Total:                  $${order.total}`);
  console.log(`paid_at:                ${order.paid_at ?? "NULL"}`);
  console.log(`wave_invoice_number:    ${order.wave_invoice_number ?? "NULL"}`);
  console.log(`wave_invoice_approved:  ${order.wave_invoice_approved_at ?? "NULL"}`);
  console.log(`wave_payment_recorded:  ${order.wave_payment_recorded_at ?? "NULL"}`);
  console.log("─".repeat(70));

  if (order.wave_payment_recorded_at) {
    console.log("✅ RECOVERY SUCCEEDED — wave_payment_recorded_at is set.");
  } else {
    console.log("❌ STILL STUCK — wave_payment_recorded_at is NULL.");
    console.log("   Did you fire the cron?  Did CRON_SECRET match Railway env var?");
    console.log("   Check Railway logs for [reconcile] entries.\n");
    return;
  }

  // Verify Wave-side state
  console.log("\n🌊 WAVE INVOICE STATE\n" + "─".repeat(70));
  const waveData = await waveQuery(
    `query($bizId: ID!, $invId: ID!) {
      business(id: $bizId) {
        invoice(id: $invId) {
          id invoiceNumber status amountDue { value } amountPaid { value }
          total { value } customer { name email }
        }
      }
    }`,
    { bizId: env.WAVE_BUSINESS_ID, invId: order.wave_invoice_id }
  );
  const inv = waveData.business?.invoice;
  if (inv) {
    console.log(`Invoice #${inv.invoiceNumber}: status=${inv.status}`);
    console.log(`Total:                  $${inv.total.value}`);
    console.log(`Paid:                   $${inv.amountPaid.value}`);
    console.log(`Due:                    $${inv.amountDue.value}`);
    console.log(`Customer:               ${inv.customer.name} <${inv.customer.email}>`);
    if (inv.status === "PAID" || Number(inv.amountDue.value) === 0) {
      console.log("✅ Wave shows the invoice as PAID.");
    } else {
      console.log("⚠️  Wave invoice is not yet marked PAID — check after a few seconds.");
      console.log("   (recordWavePayment creates a money transaction that Wave auto-reconciles)");
    }
  }
  console.log("─".repeat(70));

  // Cleanup
  if (cleanup) {
    console.log("\n🧹 Cleaning up test order…");
    await sb.from("order_items").delete().eq("order_id", order.id);
    await sb.from("orders").delete().eq("id", order.id);
    console.log("✓ Supabase order + items deleted");

    // Wave invoice: void it (only works if not paid)
    try {
      const voidRes = await waveQuery(
        `mutation($input: InvoiceVoidInput!) {
          invoiceVoid(input: $input) {
            didSucceed
            inputErrors { message }
          }
        }`,
        { input: { invoiceId: order.wave_invoice_id } }
      );
      if (voidRes.invoiceVoid?.didSucceed) {
        console.log("✓ Wave invoice voided");
      } else {
        console.log(
          "⚠ Wave invoice could not be voided (likely already PAID — that's fine, just delete manually in Wave UI):",
          voidRes.invoiceVoid?.inputErrors?.map((e) => e.message).join(", ")
        );
      }
    } catch (e) {
      console.log("⚠ Wave void error (manual cleanup needed):", e.message);
    }
  } else {
    console.log("\nTo clean up: re-run with --cleanup flag.");
  }
}

main().catch((err) => {
  console.error("\n❌ Verify failed:", err.message);
  process.exit(1);
});
