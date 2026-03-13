/**
 * Seed script — March/April 2026 Instagram posts
 * Reads draft files from ../True Color Instagram/drafts/
 * Inserts 12 rows into social_posts table.
 *
 * Usage:
 *   1. Copy SUPABASE_SECRET_KEY from Railway dashboard into .env.local
 *   2. node scripts/seed_march_2026_posts.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env.local not found at", envPath);
  process.exit(1);
}
const envVars = {};
fs.readFileSync(envPath, "utf8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    envVars[key] = val;
  });

const SUPABASE_URL =
  envVars["NEXT_PUBLIC_SUPABASE_URL"] ?? "https://dczbgraekmzirxknjvwe.supabase.co";
const SERVICE_KEY = envVars["SUPABASE_SECRET_KEY"];

if (!SERVICE_KEY || SERVICE_KEY === "your-service-role-key") {
  console.error(
    "ERROR: SUPABASE_SECRET_KEY is not set in .env.local.\n" +
    "       Copy the service role key from Railway dashboard → Variables → SUPABASE_SECRET_KEY\n" +
    "       and paste it into .env.local before running this script."
  );
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DRAFTS_DIR = path.join(__dirname, "../../True Color Instagram/drafts");

if (!fs.existsSync(DRAFTS_DIR)) {
  console.error("ERROR: Drafts folder not found at", DRAFTS_DIR);
  process.exit(1);
}

/** Parse caption file → { body, hashtags } */
function parseCaption(text) {
  const afterHeader = text.split("---CAPTION---")[1];
  if (!afterHeader) throw new Error("---CAPTION--- marker not found");
  // Split body from hashtag block on the lone --- separator
  const parts = afterHeader.split(/\n---\n/);
  const body = parts[0].trim();
  const hashtags = parts[1] ? parts[1].trim() : "";
  return { body, hashtags };
}

/** Map content_type string → PostType */
function toPostType(contentType) {
  if (contentType === "Seasonal") return "launch";
  if (contentType === "Promotion") return "last-call";
  return "mid"; // Product, Industry, Showcase, Tip
}

/** POST JSON to Supabase REST API */
function supabaseInsert(rows) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const url = new URL(`${SUPABASE_URL}/rest/v1/social_posts`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Supabase error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Build rows ───────────────────────────────────────────────────────────────
const postFiles = [
  { num: "001", date: "2026-03-09" },
  { num: "002", date: "2026-03-11" },
  { num: "003", date: "2026-03-13" },
  { num: "004", date: "2026-03-16" },
  { num: "005", date: "2026-03-18" },
  { num: "006", date: "2026-03-20" },
  { num: "007", date: "2026-03-23" },
  { num: "008", date: "2026-03-25" },
  { num: "009", date: "2026-03-27" },
  { num: "010", date: "2026-03-30" },
  { num: "011", date: "2026-04-01" },
  { num: "012", date: "2026-04-03" },
];

const rows = postFiles.map(({ num, date }) => {
  const prefix = path.join(DRAFTS_DIR, `TC_${date}_${num}`);

  const captionText = fs.readFileSync(`${prefix}_caption.txt`, "utf8");
  const imagePromptText = fs.readFileSync(`${prefix}_image-prompt.txt`, "utf8");
  const meta = JSON.parse(fs.readFileSync(`${prefix}_meta.json`, "utf8"));

  const { body, hashtags } = parseCaption(captionText);

  return {
    campaign_id: null,
    caption_raw: body,
    caption_instagram: body,
    caption_facebook: null,
    caption_twitter: null,
    hashtags: hashtags || null,
    image_url: null,
    platforms: ["instagram"],
    schedule_date: date,
    schedule_time: null,
    use_next_free_slot: false,
    status: "draft",
    post_type: toPostType(meta.content_type),
    notes: imagePromptText.trim(),
  };
});

// ── Insert ───────────────────────────────────────────────────────────────────
(async () => {
  console.log(`Inserting ${rows.length} posts into social_posts…`);
  try {
    const result = await supabaseInsert(rows);
    console.log(`✓ Inserted ${result.length} rows:`);
    result.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.schedule_date}  ${r.post_type}  ${r.id}`);
    });
  } catch (err) {
    console.error("Insert failed:", err.message);
    process.exit(1);
  }
})();
