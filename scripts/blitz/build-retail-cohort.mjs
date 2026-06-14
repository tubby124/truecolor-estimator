import fs from "node:fs";
import { pathToFileURL } from "node:url";

const NICHE = "retail";
const BREVO_LIST_ID = 15; // retail HTML-track list ("TC - Retail")

// Practical email format check. Rejects scrape junk (e.g. a Google Maps URL in
// the email field — real data: "//www.google.com/maps/@51.474499") that a bare
// truthiness check would pass and Brevo would later reject at send time.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

export function isEligible(lead) {
  return (
    Array.isArray(lead.industry_tags) &&
    lead.industry_tags.includes(NICHE) &&
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

async function main() {
  const sync = process.argv.includes("--sync"); // default = dry-run
  const env = loadEnv();
  const URL = env.SUPABASE_URL;
  const KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;
  const BREVO = env.BREVO_API_KEY;

  const sel =
    "select=id,email,industry_tags,drip_status,suppression_reason,unsubscribed_at,validation_status" +
    "&industry_tags=cs.{retail}&email=not.is.null";
  const res = await fetch(`${URL}/rest/v1/tc_leads?${sel}&limit=2000`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const leads = await res.json();
  const eligible = leads.filter(isEligible);
  console.log(`retail leads pulled: ${leads.length} | eligible: ${eligible.length} | mode: ${sync ? "SYNC" : "DRY-RUN"}`);

  if (!sync) {
    console.log("dry-run — first 5 eligible:", eligible.slice(0, 5).map((l) => l.email));
    return;
  }
  if (eligible.length > 300) {
    throw new Error(`refusing to sync ${eligible.length} > 300/day cap — split into chunks first`);
  }
  let ok = 0;
  for (const l of eligible) {
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": BREVO, "content-type": "application/json" },
      body: JSON.stringify({ email: l.email, listIds: [BREVO_LIST_ID], updateEnabled: true }),
    });
    if (r.ok || r.status === 204) ok++;
    else console.error(`brevo upsert failed ${r.status} for ${l.email}`);
  }
  console.log(`synced ${ok}/${eligible.length} into Brevo list ${BREVO_LIST_ID}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
