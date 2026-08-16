export const PRICE_MICROS = (cad) => String(Math.round(cad * 1_000_000));

// A PRICE asset is one object with up to eight offerings. Its full payload must
// participate in the key: identifying it by name would make an edited offering
// appear in sync indefinitely.
export const priceOfferingSignature = (offer) => [
  offer.header, offer.description, offer.priceMicros, offer.currencyCode, offer.finalUrl,
].join("~");

export const priceKey = (price) => [
  "PRICE", price.name, price.type, price.priceQualifier, price.languageCode,
  price.offerings.map(priceOfferingSignature).join("|"),
].join("::");

export const priceKeyFromContract = (price) => priceKey({
  name: price.name,
  type: price.type,
  priceQualifier: price.priceQualifier,
  languageCode: price.languageCode,
  offerings: price.offerings.map((offer) => ({
    header: offer.header,
    description: offer.description,
    priceMicros: PRICE_MICROS(offer.priceCad),
    currencyCode: "CAD",
    finalUrl: offer.finalUrl,
  })),
});

export const priceKeyFromLive = (asset) => priceKey({
  name: asset.name ?? "",
  type: asset.priceAsset?.type ?? "",
  priceQualifier: asset.priceAsset?.priceQualifier ?? "",
  languageCode: asset.priceAsset?.languageCode ?? "",
  offerings: (asset.priceAsset?.priceOfferings ?? []).map((offer) => ({
    header: offer.header ?? "",
    description: offer.description ?? "",
    priceMicros: String(offer.price?.amountMicros ?? ""),
    currencyCode: offer.price?.currencyCode ?? "",
    finalUrl: offer.finalUrl ?? "",
  })),
});
