import assert from "node:assert/strict";
import test from "node:test";

import { paidSearchConfig } from "../../../docs/paid-search/campaign-config.mjs";
import { validateConfig } from "../config-validator.mjs";
import { buildArtifacts } from "../export-google-ads.mjs";

const clone = () => structuredClone(paidSearchConfig);

test("canonical paid-search artifacts validate locally while account launch remains blocked", () => {
  const result = validateConfig(clone());
  assert.equal(result.localStatus, "VALIDATED");
  assert.equal(result.apiStatus, "BLOCKED");
  assert.equal(result.launched, false);
  assert.equal(result.spendCad, 0);
  assert.deepEqual(result.errors, []);
});

test("rejects enabled campaigns and unsafe network, match, geo, budget, and date settings", () => {
  const mutations = [
    (c) => { c.campaigns[0].status = "ENABLED"; },
    (c) => { c.campaigns[0].networks.display = true; },
    (c) => { c.campaigns[0].geoTarget.presenceOnly = false; },
    (c) => { c.campaigns[0].adGroups[0].keywords[0].matchType = "BROAD"; },
    (c) => { c.campaigns[0].adGroups[0].keywords = []; },
    (c) => { c.campaigns[0].dailyBudgetCad = 41; },
    (c) => { c.pilot.endDate = "2026-08-19"; },
    (c) => { c.campaigns.push({ ...structuredClone(c.campaigns[0]), kind: "EXTRA", name: "Unexpected", status: "ENABLED" }); },
  ];

  for (const mutate of mutations) {
    const config = clone();
    mutate(config);
    assert.notEqual(validateConfig(config).localStatus, "VALIDATED");
  }
});

test("rejects URL, RSA, ValueTrack, bidding, and gate violations", () => {
  const mutations = [
    (c) => { c.campaigns[0].adGroups[0].finalUrl = "https://example.com/products/coroplast-signs"; },
    (c) => { c.campaigns[0].adGroups[0].finalUrl = "https://truecolorprinting.ca/products/stickers"; },
    (c) => { c.campaigns[1].adGroups[0].rsa.headlines[0] = "Qwik Signs Alternative"; },
    (c) => { c.campaigns[1].adGroups[0].rsa.path1 = "qwik-signs"; },
    (c) => { c.campaigns[0].adGroups[0].rsa.headlines = ["Too few headlines"]; },
    (c) => { c.campaigns[0].adGroups[0].rsa.descriptions[0] = "x".repeat(91); },
    (c) => { c.tracking.finalUrlSuffix = c.tracking.finalUrlSuffix.replace("keyword={keyword}&", ""); },
    (c) => { c.bidding.cpcCeilingCad = 2.5; },
    (c) => { c.externalGates = c.externalGates.filter((g) => g.code !== "TRUE_COLOR_CUSTOMER_ID"); },
    (c) => { c.campaigns[2].gates = []; },
  ];

  for (const mutate of mutations) {
    const config = clone();
    mutate(config);
    assert.notEqual(validateConfig(config).localStatus, "VALIDATED");
  }
});

test("canonical routing and campaign caps are complete", () => {
  const core = paidSearchConfig.campaigns.find((c) => c.kind === "CORE");
  const competitors = paidSearchConfig.campaigns.find((c) => c.kind === "COMPETITOR");
  const brand = paidSearchConfig.campaigns.find((c) => c.kind === "BRAND");

  assert.equal(core.dailyBudgetCad, 40);
  assert.equal(core.maximum30DayCad, 1200);
  assert.equal(competitors.dailyBudgetCad, 7);
  assert.equal(competitors.maximum30DayCad, 210);
  assert.equal(brand.dailyBudgetCad, 3);
  assert.equal(brand.maximum30DayCad, 90);
  assert.equal(paidSearchConfig.maximum30DayCad, 1500);
  assert.equal(core.adGroups.find((g) => g.key === "coroplast").finalUrl, "https://truecolorprinting.ca/products/coroplast-signs");
  assert.equal(core.adGroups.find((g) => g.key === "stickers-labels").finalUrl, "https://truecolorprinting.ca/products/stickers");
  assert.ok(core.campaignNegatives.some((n) => n.toLowerCase().includes("qwik signs")));
});

test("exports deterministic Google Ads Editor CSV artifacts", () => {
  const first = buildArtifacts(clone());
  const second = buildArtifacts(clone());
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first).sort(), [
    "ad-groups.csv", "campaign-negatives.csv", "campaigns.csv", "keywords.csv", "responsive-search-ads.csv", "validation-summary.json",
  ]);
  assert.match(first["campaigns.csv"], /GOOG_Search_TC_CoreProducts_2026/);
  assert.match(first["keywords.csv"], /\[coroplast signs saskatoon\]/);
  assert.match(first["responsive-search-ads.csv"], /Ad type/);
  assert.match(first["responsive-search-ads.csv"], /Responsive search ad/);
  assert.doesNotMatch(first["campaign-negatives.csv"], /\n,/);
  assert.doesNotMatch(first["responsive-search-ads.csv"], /Qwik Signs Alternative/);
  assert.match(first["validation-summary.json"], /"apiStatus": "BLOCKED"/);
});
