/**
 * Interactive zombie reconciler — Wave underpaid invoices where DB says paid.
 *
 * Pipeline per candidate:
 *   1. Query Wave amountPaid       → drop if Wave already shows full payment
 *   2. Verify customer DID pay:
 *      - clover_card → Clover /payments around paid_at, match by amount
 *      - etransfer   → Gmail info@true-color.ca, Interac subject with $X.XX
 *      - wave        → Wave amountPaid IS truth; if 0 the customer never paid
 *                       through Wave's hosted page (this isn't a zombie, it's
 *                       a missing payment — flag don't fix)
 *   3. Print table with verification status
 *   4. Interactive y/n per row → recordWavePayment + re-verify Wave closed
 *
 * Mutations are gated behind RUN=1. Default is DRY (verify-only).
 *
 * Usage:
 *   railway run -- node scripts/zombie-reconcile-interactive.mjs            # dry run
 *   RUN=1 railway run -- node scripts/zombie-reconcile-interactive.mjs      # interactive fix
 */

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DRY = process.env.RUN !== "1";
const AUTO_YES = process.env.AUTO_YES; // "verified-weak" → auto-approve verified+weak, never unverified
const SKIP_MANUAL = process.env.SKIP_MANUAL === "1"; // auto-answer "no" to non-auto-approved prompts
const MAX_SAFETY = 40; // hard stop if more than this many — filter is wrong

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const WAVE_TOKEN = process.env.WAVE_API_TOKEN;
// Default from src/lib/wave/client.ts (Railway env var is optional)
const WAVE_BUSINESS_ID = process.env.WAVE_BUSINESS_ID ?? "QnVzaW5lc3M6MGZlYTg0NzQtYjQ2Ny00YTEyLWI1NTgtZWZhNGM3NGM3ZTNj";
const WAVE_BANK = process.env.WAVE_BANK_ACCOUNT_ID;
const CLOVER_KEY = process.env.CLOVER_API_KEY;
const CLOVER_MID = process.env.CLOVER_MERCHANT_ID;
const CLOVER_BASE =
  process.env.CLOVER_ENVIRONMENT === "sandbox"
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SECRET_KEY: SUPABASE_KEY,
  WAVE_API_TOKEN: WAVE_TOKEN,
  WAVE_BUSINESS_ID: WAVE_BUSINESS_ID,
  CLOVER_API_KEY: CLOVER_KEY,
  CLOVER_MERCHANT_ID: CLOVER_MID,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  console.error("Hint: run via `railway run --` and ensure CLOVER_API_KEY is in ~/.secrets");
  process.exit(1);
}
if (!DRY && !WAVE_BANK) {
  console.error("RUN=1 set but WAVE_BANK_ACCOUNT_ID missing — cannot mutate");
  process.exit(1);
}

const AUDIT_LOG = `logs/zombie-reconcile-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jsonl`;
mkdirSync(dirname(AUDIT_LOG), { recursive: true });

function audit(event, data) {
  appendFileSync(AUDIT_LOG, JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + "\n");
}

// ── Wave GraphQL ──────────────────────────────────────────────────────────────
async function waveQuery(query, variables) {
  const res = await fetch("https://gql.waveapps.com/graphql/public", {
    method: "POST",
    headers: { Authorization: `Bearer ${WAVE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`Wave GQL: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function waveAmountPaid(invoiceId) {
  const d = await waveQuery(
    `query($b: ID!, $i: ID!) {
      business(id: $b) {
        invoice(id: $i) {
          id invoiceNumber status
          total { value } amountPaid { value } amountDue { value }
        }
      }
    }`,
    { b: WAVE_BUSINESS_ID, i: invoiceId },
  );
  const inv = d.business?.invoice;
  if (!inv) return null;
  return {
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    total: Number(inv.total?.value ?? 0),
    amountPaid: Number(inv.amountPaid?.value ?? 0),
    amountDue: Number(inv.amountDue?.value ?? 0),
  };
}

const WAVE_METHOD_MAP = {
  clover_card: "CREDIT_CARD",
  etransfer: "BANK_TRANSFER",
  wave: "OTHER", // shouldn't get here — wave method needs different handling
};

async function waveRecordPayment(invoiceId, amount, method, memo) {
  const input = {
    invoiceId,
    paymentAccountId: WAVE_BANK,
    amount: amount.toFixed(2),
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: WAVE_METHOD_MAP[method] ?? "OTHER",
    exchangeRate: "1",
    memo,
  };
  const d = await waveQuery(
    `mutation R($input: InvoicePaymentCreateManualInput!) {
      invoicePaymentCreateManual(input: $input) {
        didSucceed
        inputErrors { path message code }
        invoicePayment { id amount paymentDate paymentMethod }
      }
    }`,
    { input },
  );
  const r = d.invoicePaymentCreateManual;
  if (!r.didSucceed) {
    const errs = r.inputErrors?.map((e) => `${e.path}: ${e.message}`).join(", ");
    throw new Error(`invoicePaymentCreateManual failed: ${errs}`);
  }
  return r.invoicePayment;
}

// ── Clover ────────────────────────────────────────────────────────────────────
async function cloverFindPayment(amountCents, paidAtIso, orderNumber) {
  const paidMs = new Date(paidAtIso).getTime();
  // ±2hr window around paid_at — Clover capture and our paid_at write may drift
  const after = paidMs - 2 * 3600 * 1000;
  const before = paidMs + 2 * 3600 * 1000;
  const url = new URL(`${CLOVER_BASE}/v3/merchants/${CLOVER_MID}/payments`);
  url.searchParams.set("limit", "100");
  url.searchParams.set("expand", "order,tender");
  url.searchParams.append("filter", `createdTime>=${after}`);
  url.searchParams.append("filter", `createdTime<${before}`);
  url.searchParams.append("filter", `amount=${amountCents}`);
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { headers: { Authorization: `Bearer ${CLOVER_KEY}` } });
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); // backoff
  }
  if (!res.ok) return { matched: false, reason: `clover ${res.status}` };
  const data = await res.json();
  const elements = data.elements ?? [];
  // Look for our order_number in the order title (createCloverCheckout sets it as description)
  const exact = elements.find((p) =>
    [p.order?.title, p.order?.note, p.externalReferenceId].some((s) =>
      typeof s === "string" && s.includes(orderNumber),
    ),
  );
  if (exact) return { matched: true, paymentId: exact.id, result: exact.result };
  // Fallback: any successful payment with the exact amount in window — likely ours
  const any = elements.find((p) => p.result === "SUCCESS");
  if (any) {
    return {
      matched: true,
      paymentId: any.id,
      result: any.result,
      weak: true,
      note: `amount+window match (no order_number tag) — ${elements.length} candidate(s)`,
    };
  }
  return { matched: false, reason: `0 SUCCESS payments at ${amountCents}¢ in ±2hr window` };
}

// ── Gmail (e-transfer verification via gmail.py CLI) ──────────────────────────
function gmailSearchInterac(amount, paidAtIso) {
  const day = paidAtIso.slice(0, 10);
  const prev = new Date(new Date(day).getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const next = new Date(new Date(day).getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const amountStr = amount.toFixed(2);
  // Interac subject includes the dollar amount
  const query = `from:notify@payments.interac.ca "$${amountStr}" after:${prev} before:${next}`;
  const r = spawnSync(
    "python3",
    [`${process.env.HOME}/.claude/scripts/gworkspace/gmail.py`, "--account", "truecolor", "search", query, "--limit", "5"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return { matched: false, reason: `gmail.py exit ${r.status}` };
  const lines = r.stdout.trim().split("\n").filter(Boolean);
  if (!lines.length || /^no messages/i.test(lines[0])) {
    return { matched: false, reason: `0 Interac emails matching $${amountStr} in ±7d` };
  }
  let first;
  try { first = JSON.parse(lines[0]); } catch { return { matched: false, reason: `gmail.py non-JSON: ${lines[0].slice(0, 80)}` }; }
  return { matched: true, messageId: first.id, subject: first.subject, date: first.date };
}

// ── Supabase ──────────────────────────────────────────────────────────────────
async function sb(path) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

async function pullCandidates() {
  const cutoff = new Date(Date.now() - 90 * 86400_000).toISOString();
  const sel = "order_number,total,payment_method,paid_at,wave_invoice_id,wave_invoice_number,wave_payment_recorded_at,customers(email,name)";
  const path = `orders?select=${encodeURIComponent(sel)}&wave_invoice_id=not.is.null&wave_payment_recorded_at=not.is.null&paid_at=not.is.null&wave_payment_recorded_at=gt.${cutoff}&order=paid_at.desc&limit=100`;
  return sb(path);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n=== ZOMBIE RECONCILER (${DRY ? "DRY RUN" : "LIVE — mutations enabled"}) ===`);
console.log(`Audit log: ${AUDIT_LOG}\n`);
audit("run_started", { dry: DRY });

console.log("→ Pulling candidates from Supabase...");
const candidates = await pullCandidates();
console.log(`  ${candidates.length} candidates where DB says wave_payment_recorded_at IS NOT NULL\n`);

if (candidates.length > MAX_SAFETY) {
  console.error(`ABORT — ${candidates.length} > MAX_SAFETY ${MAX_SAFETY}. Filter looks wrong.`);
  process.exit(2);
}

console.log("→ Verifying against Wave (amountPaid check)...");
const zombies = [];
for (const o of candidates) {
  process.stdout.write(`  ${o.order_number}... `);
  try {
    const w = await waveAmountPaid(o.wave_invoice_id);
    if (!w) { console.log("Wave 404 — skip"); continue; }
    const delta = w.total - w.amountPaid;
    if (delta < 0.01) {
      console.log(`OK (Wave shows $${w.amountPaid.toFixed(2)} of $${w.total.toFixed(2)})`);
      continue;
    }
    console.log(`ZOMBIE — Wave $${w.amountPaid.toFixed(2)} of $${w.total.toFixed(2)} (status=${w.status})`);
    zombies.push({ ...o, wave: w });
  } catch (e) {
    console.log(`ERR ${e.message}`);
  }
}

console.log(`\n→ ${zombies.length} confirmed zombies of ${candidates.length} candidates\n`);
audit("scan_complete", { candidates: candidates.length, zombies: zombies.length });

if (!zombies.length) { console.log("Nothing to do."); process.exit(0); }

console.log("→ Verifying each zombie against external payment source...\n");
for (const z of zombies) {
  console.log(`--- ${z.order_number} | ${z.payment_method} | $${z.total.toFixed(2)} | paid ${z.paid_at.slice(0, 16)} ---`);
  console.log(`    customer: ${z.customers?.email ?? "?"} (${z.customers?.name ?? "?"})`);
  console.log(`    wave inv: #${z.wave_invoice_number ?? "?"} — shows $${z.wave.amountPaid.toFixed(2)} of $${z.wave.total.toFixed(2)} (${z.wave.status})`);

  if (z.payment_method === "clover_card") {
    await new Promise((r) => setTimeout(r, 500)); // gentle pacing for Clover
    const v = await cloverFindPayment(Math.round(z.total * 100), z.paid_at, z.order_number);
    z.verification = v;
    console.log(`    clover : ${v.matched ? `✓ ${v.paymentId} (${v.result})${v.weak ? " [WEAK MATCH]" : ""}` : `✗ ${v.reason}`}`);
    if (v.weak) console.log(`             ${v.note}`);
  } else if (z.payment_method === "etransfer") {
    const v = gmailSearchInterac(z.total, z.paid_at);
    z.verification = v;
    console.log(`    gmail  : ${v.matched ? `✓ ${v.subject?.slice(0, 80)} (${v.date?.slice(0, 16)})` : `✗ ${v.reason}`}`);
  } else if (z.payment_method === "wave") {
    z.verification = {
      matched: false,
      reason: "Wave-method customer should pay via Wave hosted page. amountPaid=0 means they never paid — NOT a zombie",
      noFix: true,
    };
    console.log(`    wave   : ⚠ NOT A ZOMBIE — Wave-method order with amountPaid=0 means customer never paid`);
  } else {
    z.verification = { matched: false, reason: `unknown payment_method ${z.payment_method}` };
    console.log(`    ???   : unknown method`);
  }
  audit("verify", { order: z.order_number, method: z.payment_method, verification: z.verification });
  console.log();
}

const fixable = zombies.filter((z) => !z.verification?.noFix);
const verified = fixable.filter((z) => z.verification?.matched && !z.verification?.weak);
const weak = fixable.filter((z) => z.verification?.weak);
const unverified = fixable.filter((z) => !z.verification?.matched);

console.log("=== SUMMARY ===");
console.log(`  ${verified.length} verified  (external proof of payment found)`);
console.log(`  ${weak.length} weak       (amount+window match, no order_number tag)`);
console.log(`  ${unverified.length} unverified (no external proof — DO NOT auto-fix)`);
console.log(`  ${zombies.length - fixable.length} not-zombies (Wave-method, no payment)`);

if (DRY) {
  console.log(`\n[DRY RUN] No mutations performed. Re-run with: RUN=1 railway run -- node ${process.argv[1].split("/").pop()}`);
  process.exit(0);
}

const rl = createInterface({ input: stdin, output: stdout });

console.log(`\n=== LIVE MODE — INTERACTIVE FIX ===`);
console.log(`For each verified zombie, you'll be prompted y/n.\n`);

let fixed = 0;
let skipped = 0;
let failed = 0;

for (const z of [...verified, ...weak, ...unverified]) {
  console.log(`\n→ ${z.order_number} | $${z.total.toFixed(2)} | ${z.payment_method}`);
  console.log(`  customer: ${z.customers?.email ?? "?"}`);
  console.log(`  wave inv #${z.wave_invoice_number} — Wave shows $${z.wave.amountPaid.toFixed(2)} of $${z.wave.total.toFixed(2)}`);
  console.log(`  verification: ${z.verification?.matched ? (z.verification?.weak ? "WEAK" : "VERIFIED") : "UNVERIFIED"} — ${z.verification?.matched ? (z.verification.paymentId || z.verification.messageId) : z.verification?.reason}`);

  // Pre-flight: DB total must equal Wave invoice total. Mismatch = data drift, not a payment recording issue.
  const totalMatches = Math.abs(z.total - z.wave.total) < 0.01;
  if (!totalMatches) {
    console.log(`  ⚠ TOTAL MISMATCH: DB $${z.total.toFixed(2)} vs Wave $${z.wave.total.toFixed(2)} — skipping auto-approve, needs manual review`);
  }

  const autoApprove =
    AUTO_YES === "verified-weak" && z.verification?.matched && totalMatches;

  let ans, proceed;
  if (autoApprove) {
    ans = "auto-yes";
    proceed = true;
    console.log(`  → AUTO-APPROVED (${z.verification?.weak ? "weak" : "verified"})`);
  } else if (SKIP_MANUAL) {
    ans = "auto-no";
    proceed = false;
    console.log(`  → SKIPPED (SKIP_MANUAL=1, needs human review)`);
  } else {
    const prompt = z.verification?.matched && !z.verification?.weak
      ? "  → Record payment in Wave? [y/N]: "
      : `  ⚠ ${z.verification?.weak ? "WEAK match" : "NO verification"} — type 'yes' (full word) to proceed, else skip: `;
    ans = (await rl.question(prompt)).trim().toLowerCase();
    proceed = z.verification?.matched && !z.verification?.weak ? ans === "y" || ans === "yes" : ans === "yes";
  }

  if (!proceed) {
    console.log("  skipped");
    skipped++;
    audit("skip", { order: z.order_number, ans });
    continue;
  }

  try {
    const memo = `Zombie reconcile — ${z.payment_method} — ref ${z.order_number}${z.verification?.paymentId ? ` clover:${z.verification.paymentId}` : ""}${z.verification?.messageId ? ` gmail:${z.verification.messageId}` : ""}`;
    const amount = z.total - z.wave.amountPaid; // only the unpaid portion
    console.log(`  → invoicePaymentCreateManual amount=$${amount.toFixed(2)} method=${WAVE_METHOD_MAP[z.payment_method]}...`);
    const payment = await waveRecordPayment(z.wave_invoice_id, amount, z.payment_method, memo);
    console.log(`  ✓ payment created: ${payment.id}`);
    // Re-verify Wave actually closed
    const after = await waveAmountPaid(z.wave_invoice_id);
    if (after.total - after.amountPaid > 0.01) {
      console.log(`  ✗ post-mutation re-check: Wave still shows $${after.amountPaid} of $${after.total} — ABORTING REMAINING FIXES`);
      audit("post_check_fail", { order: z.order_number, after });
      failed++;
      break;
    }
    console.log(`  ✓ Wave invoice closed: $${after.amountPaid.toFixed(2)} of $${after.total.toFixed(2)} (status=${after.status})`);
    audit("fixed", { order: z.order_number, paymentId: payment.id, after });
    fixed++;
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
    audit("fix_failed", { order: z.order_number, error: e.message });
    failed++;
  }
}

rl.close();
console.log(`\n=== DONE ===  fixed=${fixed}  skipped=${skipped}  failed=${failed}  not-zombies=${zombies.length - fixable.length}`);
console.log(`Audit log: ${AUDIT_LOG}`);
audit("run_complete", { fixed, skipped, failed, notZombies: zombies.length - fixable.length });
