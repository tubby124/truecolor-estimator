/**
 * launch-niche-wave.mjs — reusable cold-drip wave launcher (Brevo free tier).
 *
 * Mirrors the proven "TC Wave N — Niche Day D" method:
 *   - list-based HTML campaigns, sender hello@outreach.true-color.ca, replyTo info@
 *   - 8:00 AM Saskatoon, cadence Day 0/7/14/30/45
 *   - fresh list per wave (zero overlap with prior sends)
 *   - 250/day cold-drip ceiling (50 reserved for transactional)
 *
 * Eligibility (queued, has email, not suppressed, not unsubscribed, not invalid)
 * is niche-generic: the local isEligible() filters on CFG.industryTag, so this
 * launcher works for ANY niche by swapping the CONFIG block (see DRIP-CAMPAIGN-RUNBOOK.md).
 *
 * Usage:
 *   node scripts/blitz/launch-niche-wave.mjs            # DRY-RUN (no writes)
 *   node scripts/blitz/launch-niche-wave.mjs --execute  # creates list + contacts + SCHEDULED campaigns
 *
 * Scheduled campaigns do NOT send until their scheduledAt; safe to delete/unschedule
 * in the Brevo UI before Day 0 if anything looks wrong.
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { isValidEmail } from "./build-retail-cohort.mjs";

// ===================== WAVE CONFIG (swap per niche) =====================
const CFG = {
  niche: "school",
  industryTag: "school",
  waveName: "TC Wave 4 — School",
  listName: "TC Wave 4 — School (2026-06)",
  sender: { name: "Hasan — True Color", email: "hello@outreach.true-color.ca" },
  replyTo: "info@true-color.ca",
  htmlDir: "content/campaigns/school",
  manifestPath: "content/campaigns/school/manifest.json",
  startDate: "2026-08-11", // Day 0 (Tue) — back-to-school window; retail wave done by Jul 30, zero collision
  sendTime: "08:00:00",
  tzOffset: "-06:00", // Saskatoon, no DST
  dailyCap: 250,
};
// =======================================================================

// Niche-generic eligibility — mirrors build-retail-cohort.isEligible but binds
// to CFG.industryTag instead of a hardcoded niche, so any wave can use it.
function isEligible(lead) {
  return (
    Array.isArray(lead.industry_tags) &&
    lead.industry_tags.includes(CFG.industryTag) &&
    isValidEmail(lead.email) &&
    lead.drip_status === "queued" &&
    lead.suppression_reason == null &&
    lead.unsubscribed_at == null &&
    lead.validation_status !== "invalid"
  );
}

function loadEnv() {
  const e = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    if (!line.includes("=") || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    e[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return e;
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const execute = process.argv.includes("--execute");
  const env = loadEnv();
  const SUPA = env.SUPABASE_URL;
  const SKEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;
  const BREVO = env.BREVO_API_KEY;
  const BH = { "api-key": BREVO, "content-type": "application/json" };

  const manifest = JSON.parse(fs.readFileSync(CFG.manifestPath, "utf8"));
  console.log(`\n=== ${CFG.waveName} — ${execute ? "EXECUTE" : "DRY-RUN"} ===`);

  // 1. eligible cohort
  const sel =
    "select=id,email,industry_tags,drip_status,suppression_reason,unsubscribed_at,validation_status" +
    `&industry_tags=cs.{${CFG.industryTag}}&email=not.is.null`;
  const leads = await (await fetch(`${SUPA}/rest/v1/tc_leads?${sel}&limit=2000`, {
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` },
  })).json();
  const eligible = leads.filter(isEligible);
  console.log(`eligible ${CFG.niche}: ${eligible.length} (of ${leads.length} with email)`);
  if (eligible.length > CFG.dailyCap)
    console.log(`⚠ ${eligible.length} > ${CFG.dailyCap}/day cap — this maxes its send-days; run parallel niches on OTHER days.`);

  // 2. schedule preview
  const plan = manifest.map((m) => {
    const date = addDays(CFG.startDate, m.wait_days);
    return { ...m, date, scheduledAt: `${date}T${CFG.sendTime}.000${CFG.tzOffset}`, file: `${CFG.htmlDir}/${m.file}.html` };
  });
  console.log("schedule:");
  for (const p of plan) console.log(`  Day ${String(p.wait_days).padStart(2)} → ${p.date} 8:00 — "${p.subject}"  [${p.file}]`);

  if (!execute) {
    console.log("\nDRY-RUN — no list, no contacts, no campaigns created. Re-run with --execute to launch.");
    return;
  }

  // 3. create fresh list (under folder 1 = default)
  const listRes = await fetch("https://api.brevo.com/v3/contacts/lists", {
    method: "POST", headers: BH, body: JSON.stringify({ name: CFG.listName, folderId: 1 }),
  });
  const listBody = await listRes.json();
  const listId = listBody.id;
  if (!listId) { console.error("list create failed:", listRes.status, JSON.stringify(listBody)); return; }
  console.log(`\ncreated list ${listId} "${CFG.listName}"`);

  // 4. sync eligible contacts into the list
  let synced = 0;
  for (const l of eligible) {
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST", headers: BH,
      body: JSON.stringify({ email: l.email, listIds: [listId], updateEnabled: true }),
    });
    if (r.ok || r.status === 204) synced++;
    else console.error(`  contact fail ${r.status}: ${l.email}`);
  }
  console.log(`synced ${synced}/${eligible.length} contacts into list ${listId}`);

  // 5. create + schedule one campaign per step
  const created = [];
  for (const p of plan) {
    const html = fs.readFileSync(p.file, "utf8");
    const r = await fetch("https://api.brevo.com/v3/emailCampaigns", {
      method: "POST", headers: BH,
      body: JSON.stringify({
        name: `${CFG.waveName} Day ${p.wait_days}`,
        subject: p.subject,
        sender: CFG.sender,
        replyTo: CFG.replyTo,
        htmlContent: html,
        recipients: { listIds: [listId] },
        scheduledAt: p.scheduledAt,
        inlineImageActivation: false,
      }),
    });
    const b = await r.json();
    if (b.id) { created.push({ day: p.wait_days, id: b.id, when: p.scheduledAt }); console.log(`  scheduled campaign ${b.id} — Day ${p.wait_days} @ ${p.scheduledAt}`); }
    else console.error(`  campaign create FAIL Day ${p.wait_days}: ${r.status} ${JSON.stringify(b)}`);
  }

  console.log(`\nDONE: list ${listId}, ${synced} contacts, ${created.length}/${plan.length} campaigns scheduled.`);
  console.log(JSON.stringify({ listId, campaigns: created }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
