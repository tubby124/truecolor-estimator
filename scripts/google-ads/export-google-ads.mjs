import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "./config-validator.mjs";

const OUTPUT_DIR = path.resolve("docs/paid-search/generated");

const csvCell = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (headers, rows) => `${headers.map(csvCell).join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
const keywordText = ({ text, matchType }) => matchType === "EXACT" ? `[${text}]` : `"${text}"`;

export function buildArtifacts(config) {
  const validation = validateConfig(config);
  if (validation.localStatus !== "VALIDATED") throw new Error(`Configuration is invalid:\n${validation.errors.join("\n")}`);

  const campaignRows = config.campaigns.map((campaign) => ({
    Campaign: campaign.name,
    "Campaign type": "Search",
    Status: campaign.status,
    Budget: campaign.dailyBudgetCad,
    "Budget type": "Daily",
    "Bid strategy type": "Maximize clicks",
    "Max CPC bid limit": config.bidding.cpcCeilingCad,
    "Start date": config.pilot.startDate,
    "End date": config.pilot.endDate,
    "Google Search": "Enabled",
    "Search partners": "Disabled",
    "Display Network": "Disabled",
    Location: "Saskatoon, Saskatchewan, Canada",
    "Location criterion ID": campaign.geoTarget.criterionId,
    "Location option": "Presence: People in or regularly in targeted locations",
    Language: campaign.language,
    "Final URL suffix": config.tracking.finalUrlSuffix,
  }));
  const adGroupRows = [];
  const keywordRows = [];
  const adRows = [];
  const negativeRows = [];
  for (const campaign of config.campaigns) {
    for (const negative of campaign.campaignNegatives) {
      negativeRows.push({ Campaign: campaign.name, "Ad group": "", Keyword: negative, "Match type": "Phrase", Status: "Enabled" });
    }
    for (const group of campaign.adGroups) {
      adGroupRows.push({ Campaign: campaign.name, "Ad group": group.name, Status: group.status });
      for (const item of group.keywords) {
        keywordRows.push({ Campaign: campaign.name, "Ad group": group.name, Keyword: keywordText(item), "Match type": item.matchType === "EXACT" ? "Exact" : "Phrase", Status: "Paused", "Final URL": group.finalUrl });
      }
      for (const negative of group.crossNegatives) {
        negativeRows.push({ Campaign: campaign.name, "Ad group": group.name, Keyword: negative, "Match type": "Phrase", Status: "Enabled" });
      }
      const row = { Campaign: campaign.name, "Ad group": group.name, "Ad type": "Responsive search ad", Status: "Paused", "Final URL": group.finalUrl };
      group.rsa.headlines.forEach((headline, index) => { row[`Headline ${index + 1}`] = headline; });
      group.rsa.descriptions.forEach((description, index) => { row[`Description ${index + 1}`] = description; });
      adRows.push(row);
    }
  }
  for (const campaign of config.campaigns) {
    for (const negative of config.accountNegatives) {
      negativeRows.push({ Campaign: campaign.name, "Ad group": "", Keyword: keywordText(negative), "Match type": negative.matchType === "EXACT" ? "Exact" : "Phrase", Status: "Enabled" });
    }
  }
  const rsaHeaders = ["Campaign", "Ad group", "Ad type", "Status", "Final URL", ...Array.from({ length: 15 }, (_, index) => `Headline ${index + 1}`), ...Array.from({ length: 4 }, (_, index) => `Description ${index + 1}`)];
  const summary = {
    artifactStatus: "BUILT",
    campaignsCreatedInAds: false,
    ...validation,
    maximum30DayCad: config.maximum30DayCad,
    note: "Google Ads enforces daily budgets, not a true lifetime cap. The end date, hard stop, and monitoring are mandatory.",
  };
  return {
    "campaigns.csv": csv(Object.keys(campaignRows[0]), campaignRows),
    "ad-groups.csv": csv(["Campaign", "Ad group", "Status"], adGroupRows),
    "keywords.csv": csv(["Campaign", "Ad group", "Keyword", "Match type", "Status", "Final URL"], keywordRows),
    "responsive-search-ads.csv": csv(rsaHeaders, adRows),
    "campaign-negatives.csv": csv(["Campaign", "Ad group", "Keyword", "Match type", "Status"], negativeRows),
    "validation-summary.json": `${JSON.stringify(summary, null, 2)}\n`,
  };
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const artifacts = buildArtifacts(paidSearchConfig);
  if (checkOnly) {
    const mismatches = [];
    for (const [name, expected] of Object.entries(artifacts)) {
      let actual = "";
      try { actual = await readFile(path.join(OUTPUT_DIR, name), "utf8"); } catch { mismatches.push(`${name} is missing`); continue; }
      if (actual !== expected) mismatches.push(`${name} is stale`);
    }
    if (mismatches.length) throw new Error(mismatches.join("\n"));
    console.log(`VALIDATED: ${Object.keys(artifacts).length} committed artifacts are deterministic and current.`);
    return;
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(Object.entries(artifacts).map(([name, content]) => writeFile(path.join(OUTPUT_DIR, name), content)));
  console.log(`BUILT: ${Object.keys(artifacts).length} files in ${OUTPUT_DIR}`);
  console.log("Local artifacts VALIDATED; Google Ads API/account creation BLOCKED; campaigns NOT CREATED; spend CA$0.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
