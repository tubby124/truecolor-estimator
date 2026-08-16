import { priceKeyFromContract, priceKeyFromLive } from "./asset-contract.mjs";

const audienceKey = (criterion) => criterion.userInterest ?? criterion.userList;

export function observationAudienceDriftWarnings(audiences, liveGroups, liveCriteria, customerId) {
  if (!audiences) return [];

  const warnings = [];
  const expectedGroups = new Map(audiences.adGroups.map((group) => [group.id, group.name]));
  const expectedCriteria = [
    ...audiences.userInterests.map((item) => `customers/${customerId}/userInterests/${item.criterionId}`),
    ...audiences.userLists.map((item) => `customers/${customerId}/userLists/${item.id}`),
  ];
  const expectedCriterionSet = new Set(expectedCriteria);

  for (const [id, name] of expectedGroups) {
    const group = liveGroups.get(name);
    if (!group || String(group.id) !== id) {
      warnings.push(`observation audience ad group "${name}" (${id}) is not live`);
      continue;
    }
    const observational = (group.targetRestrictions ?? []).some(
      (restriction) => restriction.targetingDimension === "AUDIENCE" && restriction.bidOnly === true,
    );
    if (!observational) warnings.push(`ad group "${name}" (${id}) is not AUDIENCE bid-only (OBSERVATION)`);

    const liveForGroup = new Set(liveCriteria.filter((criterion) => criterion.adGroupId === id).map(audienceKey).filter(Boolean));
    for (const key of expectedCriteria) {
      if (!liveForGroup.has(key)) warnings.push(`ad group "${name}" (${id}) is missing observation audience ${key}`);
    }
    for (const key of liveForGroup) {
      if (!expectedCriterionSet.has(key)) warnings.push(`ad group "${name}" (${id}) has undeclared observation audience ${key}`);
    }
  }
  return warnings;
}

export function priceAssetDriftWarnings(contractPrices, livePriceAssets) {
  const liveByKey = new Map(livePriceAssets.map((asset) => [priceKeyFromLive(asset), asset]));
  const contractByKey = new Map(contractPrices.map((price) => [priceKeyFromContract(price), price]));
  const warnings = [];
  for (const [key, price] of contractByKey) {
    if (!liveByKey.has(key)) warnings.push(`PRICE asset "${price.name}" is in the contract but NOT linked live (payload fingerprint differs or is absent)`);
  }
  for (const [key, asset] of liveByKey) {
    if (!contractByKey.has(key)) warnings.push(`PRICE asset "${asset.name ?? "(unnamed)"}" is linked live but NOT in the contract (payload fingerprint differs or is extra)`);
  }
  return warnings;
}
