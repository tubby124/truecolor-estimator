import type { MerchantOffer } from "@/lib/merchant/merchant-catalog";

/** Exact offer schema for the isolated, noindex Merchant processing pilot. */
export function merchantPilotProductSchema(offer: MerchantOffer) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    sku: offer.offerId,
    description: offer.description,
    brand: { "@type": "Brand", name: "True Color Display Printing" },
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
