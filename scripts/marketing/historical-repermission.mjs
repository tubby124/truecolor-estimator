#!/usr/bin/env node
/**
 * Historical True Color re-introduction campaign.
 *
 * Default is a read-only production audit. It never prints customer addresses,
 * creates contacts, or sends email unless an explicit, separately gated mode is
 * selected. The real-send mode is hard-capped at 10 recipients.
 *
 * Usage (from Railway runtime so this uses the True Color project):
 *   railway run --service truecolor-estimator -- node scripts/marketing/historical-repermission.mjs
 *   railway run --service truecolor-estimator -- node scripts/marketing/historical-repermission.mjs --prepare --max=10
 *   railway run --service truecolor-estimator -- node scripts/marketing/historical-repermission.mjs --create-draft --max=10
 *   railway run --service truecolor-estimator -- node scripts/marketing/historical-repermission.mjs --send --max=10 --confirm-real-customer-send
 */
import { pathToFileURL } from "node:url";
import {
  assertFirstBatchCap,
  buildCampaignHtml,
  isHistoricalCandidate,
  makePreferenceToken,
} from "./historical-repermission-lib.mjs";

const TWO_YEARS_AGO = "2024-08-21T00:00:00.000Z";
const TOKEN_EXPIRY_DAYS = 30;
const CAMPAIGN_NAME = "True Color Customers — Stay in touch (pilot)";

function parseArgs(argv) {
  const modes = ["--prepare", "--create-draft", "--send"].filter((flag) => argv.includes(flag));
  if (modes.length > 1) throw new Error("Choose one mode: --prepare, --create-draft, or --send.");
  const rawCap = argv.find((arg) => arg.startsWith("--max="));
  const cap = rawCap ? Number.parseInt(rawCap.slice(6), 10) : 10;
  return { mode: modes[0] ?? "--dry-run", cap, confirmed: argv.includes("--confirm-real-customer-send") };
}

function requireEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://truecolorprinting.ca";
  if (!supabaseUrl || !serviceKey || !brevoKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, and BREVO_API_KEY are required.");
  }
  return { supabaseUrl, serviceKey, brevoKey, siteUrl: siteUrl.replace(/\/$/, "") };
}

async function supabaseJson(env, path, init = {}) {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status} for ${path}`);
  return response.status === 204 ? null : response.json();
}

async function fetchAudience(env) {
  const [customers, orders, localSuppressed] = await Promise.all([
    supabaseJson(env, "customers?select=id,email,marketing_consent,consent_source,consent_withdrawn_at&limit=1000"),
    supabaseJson(env, `orders?select=customer_id&status=eq.complete&completed_at=gte.${encodeURIComponent(TWO_YEARS_AGO)}&limit=1000`),
    supabaseJson(env, "email_log?select=customer_id,status,bounced_at,complained_at&or=(status.in.(bounced,spam,failed),bounced_at.not.is.null,complained_at.not.is.null)&customer_id=not.is.null&limit=1000"),
  ]);
  const completedCustomerIds = new Set(orders.filter((order) => order.customer_id).map((order) => order.customer_id));
  const localSuppressedCustomerIds = new Set(localSuppressed.map((row) => row.customer_id));
  return customers.filter((customer) => isHistoricalCandidate(customer, completedCustomerIds, localSuppressedCustomerIds));
}

async function inspectBrevoContact(env, email) {
  const response = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { "api-key": env.brevoKey },
  });
  if (response.status === 404) return { status: "missing" };
  if (!response.ok) return { status: "error" };
  const contact = await response.json();
  return contact.emailBlacklisted === true ? { status: "blacklisted" } : { status: "clear" };
}

async function eligibleAudience(env) {
  const localCandidates = await fetchAudience(env);
  const counts = { localCandidates: localCandidates.length, brevoBlacklisted: 0, brevoMissing: 0, brevoLookupErrors: 0 };
  const eligible = [];
  for (const customer of localCandidates) {
    const result = await inspectBrevoContact(env, customer.email);
    if (result.status === "blacklisted") { counts.brevoBlacklisted++; continue; }
    if (result.status === "error") { counts.brevoLookupErrors++; continue; }
    if (result.status === "missing") counts.brevoMissing++;
    eligible.push(customer);
  }
  return { counts, eligible };
}

function expiryIso() {
  return new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

async function prepareTokens(env, audience) {
  const existing = await supabaseJson(env, `marketing_preference_tokens?select=customer_id&purpose=eq.historical_repermission&used_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1000`);
  const alreadyTokenized = new Set(existing.map((row) => row.customer_id));
  const selected = audience.filter((customer) => !alreadyTokenized.has(customer.id));
  const rows = selected.map((customer) => ({
    customer_id: customer.id,
    token: makePreferenceToken(),
    purpose: "historical_repermission",
    expires_at: expiryIso(),
  }));
  if (rows.length) {
    await supabaseJson(env, "marketing_preference_tokens", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
  }
  return { created: rows.length, existing: audience.length - rows.length };
}

async function createBrevoDraft(env, audience) {
  const tokens = await supabaseJson(env, `marketing_preference_tokens?select=customer_id,token&purpose=eq.historical_repermission&used_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1000`);
  const tokenByCustomer = new Map(tokens.map((row) => [row.customer_id, row.token]));
  const selected = audience.filter((customer) => tokenByCustomer.has(customer.id));
  if (selected.length !== audience.length) throw new Error("Every pilot contact needs an active preference token before a draft is created.");

  const headers = { "api-key": env.brevoKey, "content-type": "application/json" };
  const listResponse = await fetch("https://api.brevo.com/v3/contacts/lists", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: `${CAMPAIGN_NAME} — ${new Date().toISOString().slice(0, 10)}`, folderId: 1 }),
  });
  if (!listResponse.ok) throw new Error(`Brevo list creation failed: HTTP ${listResponse.status}`);
  const list = await listResponse.json();
  for (const customer of selected) {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: customer.email, attributes: { PREFERENCE_TOKEN: tokenByCustomer.get(customer.id) }, listIds: [list.id], updateEnabled: true }),
    });
    if (!response.ok && response.status !== 204) throw new Error(`Brevo contact preparation failed: HTTP ${response.status}`);
  }
  const campaignResponse = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: CAMPAIGN_NAME,
      subject: "A quick hello from the print shop",
      sender: { name: "True Color Display Printing", email: "info@true-color.ca" },
      replyTo: "info@true-color.ca",
      htmlContent: buildCampaignHtml(env.siteUrl),
      recipients: { listIds: [list.id] },
    }),
  });
  if (!campaignResponse.ok) throw new Error(`Brevo draft creation failed: HTTP ${campaignResponse.status}`);
  const campaign = await campaignResponse.json();
  return { listId: list.id, campaignId: campaign.id, recipientCount: selected.length };
}

async function sendDraft(env, campaignId) {
  const response = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
    method: "POST",
    headers: { "api-key": env.brevoKey, "content-type": "application/json" },
  });
  if (!response.ok) throw new Error(`Brevo send failed: HTTP ${response.status}`);
}

export async function main(argv = process.argv.slice(2)) {
  const { mode, cap, confirmed } = parseArgs(argv);
  assertFirstBatchCap(cap);
  const env = requireEnvironment();
  const { counts, eligible } = await eligibleAudience(env);
  const audience = eligible.slice(0, cap);
  const summary = {
    projectHost: new URL(env.supabaseUrl).host,
    mode,
    cap,
    ...counts,
    eligibleAfterAllSuppressions: eligible.length,
    pilotAudience: audience.length,
  };
  if (mode === "--dry-run") {
    console.log(JSON.stringify({ ...summary, writes: false, sends: false }, null, 2));
    return;
  }
  if (mode === "--prepare") {
    const tokens = await prepareTokens(env, audience);
    console.log(JSON.stringify({ ...summary, tokens, sends: false }, null, 2));
    return;
  }
  if (mode === "--create-draft") {
    const draft = await createBrevoDraft(env, audience);
    console.log(JSON.stringify({ ...summary, draft, sends: false }, null, 2));
    return;
  }
  if (!confirmed) throw new Error("Refusing customer send without --confirm-real-customer-send.");
  const campaignId = process.env.HISTORICAL_REPERMISSION_CAMPAIGN_ID;
  if (!campaignId) throw new Error("HISTORICAL_REPERMISSION_CAMPAIGN_ID is required for --send.");
  await sendDraft(env, campaignId);
  console.log(JSON.stringify({ ...summary, campaignId, sends: true }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
