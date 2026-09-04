import type { MerchantOffer } from "@/lib/merchant/merchant-catalog";

/** Exact, configuration-bound offer schema for a Merchant landing page. */
export function merchantProductSchema(offer: MerchantOffer) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    sku: offer.offerId,
    description: offer.description,
    brand: { "@type": "Brand", name: "True Color Display Printing" },
    ...(offer.itemGroupId ? { inProductGroupWithID: offer.itemGroupId } : {}),
    offers: {
      "@type": "Offer",
      url: offer.link,
      priceCurrency: "CAD",
      price: offer.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

// Kept while older callers migrate to the catalog-wide name.
export const merchantPilotProductSchema = merchantProductSchema;
