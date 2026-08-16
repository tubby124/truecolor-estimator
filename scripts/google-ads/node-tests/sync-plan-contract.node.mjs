import assert from "node:assert/strict";
import test from "node:test";

import { observationAudienceDriftWarnings, priceAssetDriftWarnings } from "../sync-plan-contract.mjs";

const CUSTOMER = "1072816342";
const audiences = {
  adGroups: [{ id: "101", name: "Core" }],
  userInterests: [{ criterionId: "200", name: "Printing" }],
  userLists: [{ id: "300", name: "Visitors" }],
};
const price = {
  name: "Core prices", type: "SERVICES", priceQualifier: "FROM", languageCode: "en",
  offerings: [{ header: "Banners", description: "From $66", priceCad: 66, finalUrl: "https://truecolorprinting.ca/products/vinyl-banners" }],
};
const livePrice = {
  name: price.name,
  priceAsset: {
    type: price.type, priceQualifier: price.priceQualifier, languageCode: price.languageCode,
    priceOfferings: [{ header: "Banners", description: "From $66", price: { amountMicros: "66000000", currencyCode: "CAD" }, finalUrl: price.offerings[0].finalUrl }],
  },
};

test("sync-plan audience fixture is clean only when bid-only and every declared criterion is live", () => {
  const groups = new Map([["Core", { id: "101", targetRestrictions: [{ targetingDimension: "AUDIENCE", bidOnly: true }] }]]);
  const criteria = [
    { adGroupId: "101", userInterest: `customers/${CUSTOMER}/userInterests/200`, userList: null },
    { adGroupId: "101", userInterest: null, userList: `customers/${CUSTOMER}/userLists/300` },
  ];
  assert.deepEqual(observationAudienceDriftWarnings(audiences, groups, criteria, CUSTOMER), []);
  groups.get("Core").targetRestrictions[0].bidOnly = false;
  criteria.pop();
  const drift = observationAudienceDriftWarnings(audiences, groups, criteria, CUSTOMER);
  assert.equal(drift.length, 2);
  assert.match(drift.join("\n"), /not AUDIENCE bid-only/);
  assert.match(drift.join("\n"), /userLists\/300/);
});

test("sync-plan price fixture fingerprints offerings rather than trusting an asset name", () => {
  assert.deepEqual(priceAssetDriftWarnings([price], [livePrice]), []);
  livePrice.priceAsset.priceOfferings[0].price.amountMicros = "67000000";
  const drift = priceAssetDriftWarnings([price], [livePrice]);
  assert.equal(drift.length, 2);
  assert.match(drift[0], /Core prices/);
  assert.match(drift[1], /payload fingerprint differs/);
});
