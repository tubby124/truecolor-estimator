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
    "Bid strategy type": "Maximize clicks",
    "Maximum CPC bid limit": config.bidding.cpcCeilingCadByCampaignKind[campaign.kind],
    "Start date": config.pilot.startDate,
    "End date": config.pilot.endDate,
    Networks: "Google Search",
    Language: "en",
    "Final URL suffix": config.tracking.finalUrlSuffix,
  }));
  const locationRows = config.campaigns.map((campaign) => ({
    Campaign: campaign.name,
    Location: campaign.geoTarget.name,
    "Location ID": campaign.geoTarget.criterionId,
  }));
  const adGroupRows = [];
  const keywordRows = [];
  const adRows = [];
  const negativeRows = [];
  for (const campaign of config.campaigns) {
    for (const negative of campaign.campaignNegatives) {
      negativeRows.push({ Campaign: campaign.name, "Ad group": "", Keyword: keywordText({ text: negative, matchType: "PHRASE" }), Type: "Campaign negative" });
    }
    for (const group of campaign.adGroups) {
      adGroupRows.push({ Campaign: campaign.name, "Ad group": group.name, Status: group.status });
      for (const item of group.keywords) {
        keywordRows.push({ Campaign: campaign.name, "Ad group": group.name, Keyword: keywordText(item), Type: item.matchType === "EXACT" ? "Exact" : "Phrase", Status: "Paused", "Final URL": group.finalUrl });
      }
      for (const negative of group.crossNegatives) {
        negativeRows.push({ Campaign: campaign.name, "Ad group": group.name, Keyword: keywordText({ text: negative, matchType: "PHRASE" }), Type: "Negative" });
      }
      const row = { Campaign: campaign.name, "Ad group": group.name, Type: "Responsive search ad", Status: "Paused", "Final URL": group.finalUrl };
      group.rsa.headlines.forEach((headline, index) => { row[`Headline ${index + 1}`] = headline; });
      group.rsa.descriptions.forEach((description, index) => { row[`Description ${index + 1}`] = description; });
      adRows.push(row);
    }
  }
  for (const campaign of config.campaigns) {
    for (const negative of config.accountNegatives) {
      negativeRows.push({ Campaign: campaign.name, "Ad group": "", Keyword: keywordText(negative), Type: "Campaign negative" });
    }
  }
  const rsaHeaders = ["Campaign", "Ad group", "Type", "Status", "Final URL", ...Array.from({ length: 15 }, (_, index) => `Headline ${index + 1}`), ...Array.from({ length: 4 }, (_, index) => `Description ${index + 1}`)];
  const summary = {
    artifactStatus: "BUILT",
    accountCustomerId: config.accountCustomerId,
    ...validation,
    recordedLiveEvidence: config.liveGoogleAds,
    manualAdAssetsConfigured: true,
    conversionFirstLaunchTiersConfigured: true,
    maximum30DayCad: config.maximum30DayCad,
    editorSupportedEntitiesImportReady: true,
    editorImportTargetEncoded: false,
    targetAccountPreflightRequired: true,
    presenceOnlyCsvConfigured: false,
    presenceOnlyStatus: "API_VERIFIED_ACCOUNT_PREVIEW_REQUIRED",
    accountPreviewRequired: true,
    generatorAutoRollsDates: false,
    note: "Google Ads enforces daily budgets, not a true lifetime cap. The end date, hard stop, and monitoring are mandatory.",
  };
  return {
    "campaigns.csv": csv(Object.keys(campaignRows[0]), campaignRows),
    "locations.csv": csv(["Campaign", "Location", "Location ID"], locationRows),
    "ad-groups.csv": csv(["Campaign", "Ad group", "Status"], adGroupRows),
    "keywords.csv": csv(["Campaign", "Ad group", "Keyword", "Type", "Status", "Final URL"], keywordRows),
    "responsive-search-ads.csv": csv(rsaHeaders, adRows),
    "campaign-negatives.csv": csv(["Campaign", "Ad group", "Keyword", "Type"], negativeRows),
    "launch-candidate-manifest.json": `${JSON.stringify({
      accountCustomerId: config.accountCustomerId,
      activationPermitted: false,
      requiredFreshLiveVerification: true,
      allowedLaunchTiers: ["TIER_1_PRODUCT", "TIER_1_CONQUEST"],
      launchCandidates: config.campaigns.flatMap((campaign) => campaign.adGroups
        .filter((group) => ["TIER_1_PRODUCT", "TIER_1_CONQUEST"].includes(group.launchTier))
        .map((group) => ({ campaign: campaign.name, adGroup: group.name, tier: group.launchTier, requiredCurrentStatus: "PAUSED" }))),
      heldGroups: config.campaigns.flatMap((campaign) => campaign.adGroups
        .filter((group) => !["TIER_1_PRODUCT", "TIER_1_CONQUEST"].includes(group.launchTier))
        .map((group) => ({ campaign: campaign.name, adGroup: group.name, tier: group.launchTier, requiredStatus: "PAUSED" }))),
      blockers: validation.blockers,
    }, null, 2)}\n`,
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
  console.log("Local artifacts VALIDATED for True Color account 107-281-6342; live account state is UNVERIFIED until the credential-gated live verifier runs.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
