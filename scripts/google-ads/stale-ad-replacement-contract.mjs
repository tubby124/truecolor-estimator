// Pure classification + planning logic for replace-stale-price-ads.mjs.
//
// Split out for the same reason hard-stop-contract.mjs and controlled-test-contract.mjs are:
// the tool itself opens an OAuth session and hits the Google Ads API at import time, so nothing
// inside it can be unit-tested. Every decision this file makes — what counts as stale, what gets
// created, what gets paused — is a contract decision that must be provable without touching a
// live account. The tool keeps the I/O; this keeps the judgement.
//
// See the header of replace-stale-price-ads.mjs for WHY the rules are shaped this way, including
// the documented variant-A exception on a destination change.

// Order-independent identity for a block of ad copy. Google returns assets in serving order, which
// is not guaranteed to match contract order, so comparing raw arrays would report false drift.
export const fingerprintCopy = (headlines, descriptions) => JSON.stringify({
  h: [...(headlines ?? [])].map((t) => String(t).trim()).sort(),
  d: [...(descriptions ?? [])].map((t) => String(t).trim()).sort(),
});

// Destination identity. Sorted because an RSA may legitimately carry several final URLs whose
// order carries no meaning.
export const fingerprintDestinations = (finalUrls) =>
  JSON.stringify([...(finalUrls ?? [])].map((u) => String(u).trim()).sort());

export function buildCoreContractIndex(coreCampaign) {
  if (!coreCampaign?.adGroups?.length) throw new Error("CORE campaign missing from the contract");
  const index = new Map();
  for (const group of coreCampaign.adGroups) {
    index.set(group.name, {
      finalUrl: group.finalUrl,
      urlFp: fingerprintDestinations([group.finalUrl]),
      variantA: group.rsa ? fingerprintCopy(group.rsa.headlines, group.rsa.descriptions) : null,
      variantB: group.rsaVariantB
        ? { fp: fingerprintCopy(group.rsaVariantB.headlines, group.rsaVariantB.descriptions), ad: group.rsaVariantB }
        : null,
    });
  }
  return index;
}

// Fail closed: the replacement copy is only worth shipping if the contract itself is already
// correct. A contract still carrying the retired design ladder would otherwise be faithfully
// republished as "the fix".
const RETIRED_DESIGN_PRICES = /(design[^.|]{0,40}\$(35|50|75))|(\$(35|50|75)[^.|]{0,20}flat[^.|]{0,20}(proof|design))/i;

export function findRetiredPriceInContract(index) {
  for (const [name, entry] of index) {
    if (!entry.variantB) continue;
    const text = [...entry.variantB.ad.headlines, ...entry.variantB.ad.descriptions].join(" | ");
    if (RETIRED_DESIGN_PRICES.test(text)) return name;
  }
  return null;
}

// Classify every live Core ad against its ad group's contract copy AND destination.
//
// Variant A is matched on COPY ALONE, deliberately: the legacy control arm must stay recognisable
// as variant A even when the contract has moved the group's destination out from under it. A
// classifier that loses the name of the ad cannot make a decision about it.
//
// Everything else is matched on copy + destination together. Same copy at a superseded URL is
// STALE — that is the whole point of the 2026-08-10 change.
export function classifyLiveCoreAds(ads, index) {
  return (ads ?? []).map((ad) => {
    const contract = index.get(ad.groupName);
    if (!contract) return { ...ad, kind: "UNKNOWN_GROUP" };
    const atContractUrl = ad.urlFp === contract.urlFp;
    if (contract.variantA && ad.fp === contract.variantA) {
      return { ...ad, kind: atContractUrl ? "VARIANT_A" : "VARIANT_A_STALE_URL", contract };
    }
    if (contract.variantB && ad.fp === contract.variantB.fp && atContractUrl) {
      return { ...ad, kind: "VARIANT_B_CURRENT", contract };
    }
    return { ...ad, kind: "STALE", contract };
  });
}

// --create planning. Only ENABLED stale ads matter: a paused stale ad serves nothing, so replacing
// it spends policy-review budget on an ad nobody sees. One replacement per ad group, always —
// a second create in the same group would leave two identical current-copy ads competing.
//
// A group whose ONLY drift is variant A sitting at a superseded URL gets no create: the contract's
// variant-B copy already exists there at the right destination, or the group has no variant A at
// all. That case is handled entirely by the swap's retire set.
export function planReplacementCreates(classified) {
  const staleEnabled = (classified ?? []).filter((ad) => ad.kind === "STALE" && ad.status === "ENABLED");
  const groupsWithReplacement = new Set(
    (classified ?? []).filter((ad) => ad.kind === "VARIANT_B_CURRENT").map((ad) => ad.groupId),
  );
  const todo = [];
  const skipped = [];
  const seen = new Set();
  for (const ad of staleEnabled) {
    if (groupsWithReplacement.has(ad.groupId)) { skipped.push({ ad, why: "a current-copy replacement already exists" }); continue; }
    if (seen.has(ad.groupId)) { skipped.push({ ad, why: "another stale ad in this group is already being replaced" }); continue; }
    seen.add(ad.groupId);
    todo.push(ad);
  }
  return { todo, skipped };
}

// --swap planning, per AD GROUP rather than per stale ad.
//
// The retire set is every ENABLED ad in the group that is not the replacement and not an untouched
// control arm:
//   STALE               -> always retired (drifted copy, or contract copy at a superseded URL)
//   VARIANT_A_STALE_URL -> retired ONLY because the destination moved; see the tool header for the
//                          documented exception to "never touch variant A"
//   VARIANT_A           -> never retired. Copy-only replacement leaves the control arm serving,
//                          exactly as before 2026-08-10.
export function planDestinationSwap(classified) {
  const byGroup = new Map();
  for (const ad of classified ?? []) {
    if (!byGroup.has(ad.groupId)) byGroup.set(ad.groupId, []);
    byGroup.get(ad.groupId).push(ad);
  }
  const ready = [];
  const waiting = [];
  for (const [groupId, groupAds] of byGroup) {
    const retire = groupAds.filter((ad) => ad.status === "ENABLED"
      && (ad.kind === "STALE" || ad.kind === "VARIANT_A_STALE_URL"));
    if (!retire.length) continue;
    const groupName = groupAds[0].groupName;
    // "The destination moved" is a property of the URLs, not of the classification label. It must
    // hold whether the legacy control arm reads back as VARIANT_A_STALE_URL (contract still
    // declares it) or as plain STALE (the same pass dropped it from the contract, because an ad
    // that ends up PAUSED cannot also be counted as live contract inventory).
    const destinationChanged = retire.some((ad) => ad.kind === "VARIANT_A_STALE_URL"
      || (ad.contract && ad.urlFp !== ad.contract.urlFp));
    const replacement = groupAds.find((ad) => ad.kind === "VARIANT_B_CURRENT" && ad.status === "PAUSED");
    if (!replacement) {
      waiting.push({ groupId, groupName, retire, why: "no paused replacement — run --create first" });
      continue;
    }
    // Fail closed on review state: enabling a replacement Google has not cleared would trade stale
    // copy for an ad that may not serve at all.
    if (replacement.approval !== "APPROVED" || replacement.review !== "REVIEWED") {
      waiting.push({ groupId, groupName, retire, why: `replacement ${replacement.adId} is ${replacement.approval}/${replacement.review}` });
      continue;
    }
    ready.push({ groupId, groupName, replacement, retire, destinationChanged });
  }
  return { ready, waiting };
}

// The mutate payload for a swap: enable the replacement, pause every ad in the retire set. Google
// applies an operation list atomically, so the group is never left with both destinations serving
// nor with nothing serving.
export function buildSwapOperations(ready) {
  return (ready ?? []).flatMap(({ replacement, retire }) => [
    { update: { resourceName: replacement.adResource, status: "ENABLED" }, updateMask: "status" },
    ...retire.map((ad) => ({ update: { resourceName: ad.adResource, status: "PAUSED" }, updateMask: "status" })),
  ]);
}
