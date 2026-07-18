import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "./config-validator.mjs";
import { pathToFileURL } from "node:url";

const allowedTiers = new Set(["TIER_1_PRODUCT", "TIER_1_CONQUEST"]);

export function evaluateLaunchCandidate(config) {
  const validation = validateConfig(config);
  const candidates = config.campaigns.flatMap((campaign) => campaign.adGroups
    .filter((group) => allowedTiers.has(group.launchTier))
    .map((group) => ({ campaign: campaign.name, adGroup: group.name, tier: group.launchTier })));
  const held = config.campaigns.flatMap((campaign) => campaign.adGroups
    .filter((group) => !allowedTiers.has(group.launchTier))
    .map((group) => ({ campaign: campaign.name, adGroup: group.name, tier: group.launchTier })));
  return {
    status: validation.localStatus === "VALIDATED" && validation.blockers.length === 0 ? "READY_FOR_FRESH_LIVE_PREFLIGHT" : "BLOCKED",
    activationPermitted: false,
    accountCustomerId: config.accountCustomerId,
    candidates,
    held,
    blockers: validation.blockers,
    errors: validation.errors,
    nextRequiredCommand: "npm run validate:google-ads",
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = evaluateLaunchCandidate(paidSearchConfig);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "READY_FOR_FRESH_LIVE_PREFLIGHT") process.exitCode = 1;
}
