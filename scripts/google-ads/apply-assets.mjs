// Sync extension assets (callouts + sitelinks) from the contract to the live account.
//
// WHY THIS EXISTS
// ---------------
// apply-sync.mjs holds no authority over assets, and sync-plan.mjs used to not even look at
// them. The result on 2026-08-06: the contract's callouts and sitelink descriptions were
// rewritten with real prices, every check reported "in sync", and the account kept serving
// "Exact Online Pricing" and "Configure and order locally" on every impression. A diff tool
// blind to a class of object reports clean forever.
//
// MUTATION AUTHORITY
// ------------------
// This is the FOURTH and final holder of mutation authority, scoped strictly to extension
// assets:
//   ENABLE a campaign  -> enable-stage-one.mjs
//   PAUSE a campaign   -> hard-stop-monitor.mjs
//   CREATE contract children -> apply-sync.mjs
//   SYNC extension assets    -> this file
//
// It CREATES assets, LINKS them to campaigns, and REMOVES campaign-asset LINKS that the
// contract does not describe. It never deletes an asset itself — only the link — so every
// removal is reversible by re-linking. It never touches ads, keywords, budgets, or status.
//
// Run: railway run node scripts/google-ads/apply-assets.mjs           (dry run)
//      railway run node scripts/google-ads/apply-assets.mjs --execute

import { paidSearchConfig } from "../../docs/paid-search/campaign-config.mjs";
import { PRICE_MICROS, priceKeyFromContract, priceKeyFromLive } from "./asset-contract.mjs";

const V = "v24";
const CUSTOMER = "1072816342";
const LOGIN = "1125402990";
const APPROVED_CAMPAIGN_IDS = ["24048123058", "24048123061", "24048123064"];
const BRAND_ID = "24048123064";
// Field types this script is allowed to touch. STRUCTURED_SNIPPET is deliberately excluded —
// its contract values are the sitelink texts, which this pass does not change.
// 2026-08-16 +PRICE. A price asset renders the price as a structured table under the ad rather
// than as prose inside a callout, which is the strongest asset this account has: the entire
// competitive position is "the price is on the page before you talk to anyone".
const MANAGED_FIELD_TYPES = new Set(["CALLOUT", "SITELINK", "PRICE"]);
// PRICE assets are created with an EXPLICIT name. live-verify counts manual assets with
// `WHERE asset.name LIKE 'TC PPC %'`, so an unnamed asset would be invisible to the verifier
// and the manualAssets pin (13 -> 14) would never move. Callouts and sitelinks predate that
// convention; new managed assets carry the name.

const args = process.argv.slice(2);
for (const arg of args) if (arg !== "--execute") throw new Error(`unknown argument: ${arg}`);
const EXECUTE = args.includes("--execute");

for (const name of ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"]) {
  if (!process.env[name]) throw new Error(`${name} is required — run through "railway run"`);
}

const token = await (async () => {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`token exchange failed: HTTP ${r.status}`);
  return (await r.json()).access_token;
})();

const headers = {
  authorization: `Bearer ${token}`,
  "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "login-customer-id": LOGIN,
  "content-type": "application/json",
};

async function search(query, label) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/googleAds:search`, {
    method: "POST", headers, body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 400)}`);
  return (await r.json()).results ?? [];
}

async function mutate(path, operations, label) {
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUSTOMER}/${path}`, {
    method: "POST", headers, body: JSON.stringify({ operations }),
  });
  if (!r.ok) throw new Error(`${label} failed: HTTP ${r.status} ${(await r.text()).slice(0, 600)}`);
  return r.json();
}

async function readLive() {
  const account = (await search("SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1", "account"))[0]?.customer ?? {};
  const campaigns = new Map();
  for (const row of await search("SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name FROM campaign", "campaigns")) {
    campaigns.set(row.campaign.id, { name: row.campaign.name, status: row.campaign.status, resourceName: row.campaign.resourceName });
  }
  const assets = [];
  for (const row of await search(
    `SELECT asset.resource_name, asset.name, asset.type, asset.callout_asset.callout_text,
            asset.sitelink_asset.link_text, asset.sitelink_asset.description1, asset.sitelink_asset.description2,
            asset.price_asset.type, asset.price_asset.price_qualifier, asset.price_asset.language_code,
            asset.price_asset.price_offerings
     FROM asset WHERE asset.type IN ('CALLOUT','SITELINK','PRICE')`, "assets")) {
    assets.push(row.asset);
  }
  const links = [];
  for (const row of await search(
    `SELECT campaign.id, campaign_asset.resource_name, campaign_asset.asset, campaign_asset.field_type
     FROM campaign_asset WHERE campaign_asset.status != 'REMOVED'`, "links")) {
    links.push({ campaignId: row.campaign.id, resourceName: row.campaignAsset.resourceName, asset: row.campaignAsset.asset, fieldType: row.campaignAsset.fieldType });
  }
  return { account, campaigns, assets, links };
}

const calloutKey = (text) => `CALLOUT::${text}`;
const sitelinkKey = (s) => `SITELINK::${s.linkText}::${s.description1}::${s.description2}`;
const liveAssetKey = (asset) => {
  if (asset.type === "CALLOUT") return calloutKey(asset.calloutAsset?.calloutText ?? "");
  if (asset.type === "PRICE") return priceKeyFromLive(asset);
  return sitelinkKey({
    linkText: asset.sitelinkAsset?.linkText ?? "",
    description1: asset.sitelinkAsset?.description1 ?? undefined,
    description2: asset.sitelinkAsset?.description2 ?? undefined,
  });
};

const live = await readLive();

// ── preconditions, fail closed ───────────────────────────────────────────────
const problems = [];
if (live.account.id !== CUSTOMER) problems.push(`account id ${live.account.id} is not ${CUSTOMER}`);
if (live.account.currencyCode !== "CAD") problems.push(`currency ${live.account.currencyCode} is not CAD`);
if (live.account.timeZone !== "America/Regina") problems.push(`time zone ${live.account.timeZone} is not America/Regina`);
const liveIds = [...live.campaigns.keys()].sort();
if (JSON.stringify(liveIds) !== JSON.stringify([...APPROVED_CAMPAIGN_IDS].sort())) {
  problems.push(`campaign inventory ${liveIds.join(",")} does not equal the three approved campaigns`);
}
if (live.campaigns.get(BRAND_ID)?.status !== "PAUSED") problems.push("Brand campaign must be PAUSED going in");
if (problems.length) {
  console.error("ABORT — preconditions failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`account: ${live.account.id} ${live.account.currencyCode} ${live.account.timeZone}`);

// ── desired state from the contract ──────────────────────────────────────────
const wantCallouts = paidSearchConfig.adAssets?.callouts ?? [];
const wantSitelinks = paidSearchConfig.adAssets?.sitelinks ?? [];
const wantPrices = paidSearchConfig.adAssets?.prices ?? [];
const wantKeys = new Set([
  ...wantCallouts.map(calloutKey),
  ...wantSitelinks.map((s) => sitelinkKey({
    linkText: s.text, description1: s.description1, description2: s.description2,
  })),
  ...wantPrices.map(priceKeyFromContract),
]);

const liveAssetByKey = new Map();
for (const asset of live.assets) liveAssetByKey.set(liveAssetKey(asset), asset);

const assetsToCreate = [
  ...wantCallouts.filter((text) => !liveAssetByKey.has(calloutKey(text)))
    .map((text) => ({ kind: "CALLOUT", key: calloutKey(text), payload: { calloutAsset: { calloutText: text } }, label: `callout "${text}"` })),
  ...wantSitelinks.filter((s) => !liveAssetByKey.has(sitelinkKey({ linkText: s.text, description1: s.description1, description2: s.description2 })))
    .map((s) => ({
      kind: "SITELINK",
      key: sitelinkKey({ linkText: s.text, description1: s.description1, description2: s.description2 }),
      payload: { finalUrls: [s.finalUrl], sitelinkAsset: { linkText: s.text, description1: s.description1, description2: s.description2 } },
      label: `sitelink "${s.text}" (${s.description1} / ${s.description2})`,
    })),
  ...wantPrices.filter((price) => !liveAssetByKey.has(priceKeyFromContract(price)))
    .map((price) => ({
      kind: "PRICE",
      key: priceKeyFromContract(price),
      payload: {
        name: price.name,
        // No asset-level finalUrls: PriceOffering.final_url is required per offering and carries
        // the destination. If Google ever rejects the create for a missing asset-level URL, add
        // `finalUrls: [price.offerings[0].finalUrl]` here — do not guess a different URL.
        priceAsset: {
          type: price.type,
          priceQualifier: price.priceQualifier,
          languageCode: price.languageCode,
          priceOfferings: price.offerings.map((offer) => ({
            header: offer.header,
            description: offer.description,
            finalUrl: offer.finalUrl,
            price: { amountMicros: PRICE_MICROS(offer.priceCad), currencyCode: "CAD" },
            // `unit` is deliberately omitted. The enum only offers time units (PER_HOUR ...
            // PER_NIGHT) and none of them describe a print job; sending UNSPECIFIED would be
            // asserting a unit that does not exist.
          })),
        },
      },
      label: `price asset "${price.name}" (${price.offerings.length} offerings, ${price.type}/${price.priceQualifier})`,
    })),
];

// Links whose asset is a managed type but is NOT described by the contract.
const linksToRemove = live.links.filter((link) => {
  if (!MANAGED_FIELD_TYPES.has(link.fieldType)) return false;
  const asset = live.assets.find((a) => a.resourceName === link.asset);
  if (!asset) return false;
  return !wantKeys.has(liveAssetKey(asset));
});

console.log(`\nPLAN: ${assetsToCreate.length} assets to create, ${assetsToCreate.length * APPROVED_CAMPAIGN_IDS.length} links to add, ${linksToRemove.length} stale links to remove`);
for (const a of assetsToCreate) console.log(`  + ${a.label}`);
for (const l of linksToRemove) console.log(`  - unlink ${l.fieldType} from ${live.campaigns.get(l.campaignId)?.name}`);

if (!EXECUTE) {
  console.log("\nDRY RUN — nothing was changed. Re-run with --execute to apply.");
  console.log("Removals unlink the asset from the campaign; the asset itself is never deleted, so every removal is reversible.");
  process.exit(0);
}

// ── apply: create assets -> link them -> unlink stale ────────────────────────
const createdByKey = new Map();
if (assetsToCreate.length) {
  const result = await mutate("assets:mutate", assetsToCreate.map((a) => ({ create: a.payload })), "asset create");
  (result.results ?? []).forEach((r, index) => createdByKey.set(assetsToCreate[index].key, { resourceName: r.resourceName, kind: assetsToCreate[index].kind }));
  console.log(`created ${createdByKey.size} asset(s)`);
}

const linkOps = [];
for (const [, created] of createdByKey) {
  for (const campaignId of APPROVED_CAMPAIGN_IDS) {
    linkOps.push({ create: { campaign: `customers/${CUSTOMER}/campaigns/${campaignId}`, asset: created.resourceName, fieldType: created.kind } });
  }
}
if (linkOps.length) {
  await mutate("campaignAssets:mutate", linkOps, "campaign asset link");
  console.log(`linked ${linkOps.length} campaign asset(s)`);
}

if (linksToRemove.length) {
  await mutate("campaignAssets:mutate", linksToRemove.map((l) => ({ remove: l.resourceName })), "campaign asset unlink");
  console.log(`unlinked ${linksToRemove.length} stale campaign asset(s)`);
}

// ── readback: the same diff must come back empty ─────────────────────────────
const after = await readLive();
const afterKeys = new Set();
for (const link of after.links) {
  if (!MANAGED_FIELD_TYPES.has(link.fieldType)) continue;
  const asset = after.assets.find((a) => a.resourceName === link.asset);
  if (!asset) continue;
  afterKeys.add(liveAssetKey(asset));
}
const missing = [...wantKeys].filter((key) => !afterKeys.has(key));
const extra = [...afterKeys].filter((key) => !wantKeys.has(key));
console.log(`\nreadback: ${afterKeys.size} linked managed assets — ${missing.length} missing, ${extra.length} extra`);
for (const key of missing) console.error(`  MISSING ${key}`);
for (const key of extra) console.error(`  EXTRA   ${key}`);
if (missing.length || extra.length) {
  console.error("readback FAILED — live asset state does not match the contract");
  process.exit(1);
}
console.log("readback clean: live extension assets now match the contract.");
