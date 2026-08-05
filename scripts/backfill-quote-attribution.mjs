#!/usr/bin/env node
/**
 * One-time historical backfill for quote conversion attribution.
 *
 * Dry run (default):  node scripts/backfill-quote-attribution.mjs
 * Apply:              node scripts/backfill-quote-attribution.mjs --apply
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnv();
const apply = process.argv.includes("--apply");

// The matcher is greedy: one order per quote and one quote per order per pass.
// A customer with several quotes and several orders therefore needs one pass
// per pair. Loop until a pass yields nothing.
const MAX_PASSES = 10;

async function pass(dryRun) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/attribute_quote_conversions`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_window_days: 60, p_dry_run: dryRun }),
  });
  if (!res.ok) {
    console.error(`FAILED ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

console.log(apply ? "APPLIED" : "DRY RUN — no writes");

let total = 0;
for (let i = 1; i <= MAX_PASSES; i++) {
  const rows = await pass(!apply);
  for (const r of rows) {
    console.log(
      `  quote ${r.quote_created_at.slice(0, 10)} ${r.quote_email} -> order paid ${r.order_paid_at.slice(0, 10)}`,
    );
  }
  total += rows.length;
  // A dry run never writes, so a second pass would repeat pass 1 forever.
  if (!apply || rows.length === 0) break;
  if (i === MAX_PASSES) console.warn(`WARNING: still matching after ${MAX_PASSES} passes`);
}

console.log(`matches: ${total}`);
