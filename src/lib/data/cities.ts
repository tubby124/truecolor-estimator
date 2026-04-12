/**
 * Saskatchewan city data for programmatic SEO city pages.
 * Used by city hub pages and city×product pages for cross-linking and city-specific copy.
 */

export interface CityData {
  name: string;
  /** URL slug suffix — used in both hub slugs and product slugs */
  slug: string;
  /** Distance from Saskatoon */
  distance: string;
  /** Direction from Saskatoon */
  direction: string;
  /** Dominant industry context for city-specific copy */
  industry: string;
  /** Approximate population (for context) */
  pop: string;
  /** Typical courier transit time from Saskatoon */
  transit: string;
  /** Typical shipping cost range for small sign order (10 or fewer) */
  shippingRange: string;
}

export const SK_CITIES: Record<string, CityData> = {
  regina: {
    name: "Regina",
    slug: "regina",
    distance: "260km",
    direction: "south",
    industry: "government, oil services, retail, construction",
    pop: "215K",
    transit: "1–2 business days",
    shippingRange: "$30–$50",
  },
  "moose-jaw": {
    name: "Moose Jaw",
    slug: "moose-jaw-sk",
    distance: "75km",
    direction: "southwest",
    industry: "tourism, agriculture, military (15 Wing), hospitality",
    pop: "34K",
    transit: "1–2 business days",
    shippingRange: "$20–$35",
  },
  "prince-albert": {
    name: "Prince Albert",
    slug: "prince-albert-sk",
    distance: "140km",
    direction: "north",
    industry: "forestry, mining, healthcare, government services",
    pop: "38K",
    transit: "1–2 business days",
    shippingRange: "$25–$40",
  },
  yorkton: {
    name: "Yorkton",
    slug: "yorkton-sk",
    distance: "180km",
    direction: "east",
    industry: "agriculture, grain, livestock, retail",
    pop: "16K",
    transit: "1–2 business days",
    shippingRange: "$25–$45",
  },
  lloydminster: {
    name: "Lloydminster",
    slug: "lloydminster-sk",
    distance: "290km",
    direction: "west",
    industry: "oil and gas, construction, agriculture",
    pop: "32K",
    transit: "1–2 business days",
    shippingRange: "$35–$55",
  },
  "swift-current": {
    name: "Swift Current",
    slug: "swift-current-sk",
    distance: "250km",
    direction: "southwest",
    industry: "agriculture, oil and gas, retail",
    pop: "17K",
    transit: "1–2 business days",
    shippingRange: "$30–$50",
  },
  estevan: {
    name: "Estevan",
    slug: "estevan-sk",
    distance: "330km",
    direction: "southeast",
    industry: "oil and gas, coal, agriculture",
    pop: "12K",
    transit: "1–2 business days",
    shippingRange: "$35–$55",
  },
  weyburn: {
    name: "Weyburn",
    slug: "weyburn-sk",
    distance: "195km",
    direction: "southeast",
    industry: "oil, agriculture, grain",
    pop: "11K",
    transit: "1–2 business days",
    shippingRange: "$28–$45",
  },
  "north-battleford": {
    name: "North Battleford",
    slug: "north-battleford-sk",
    distance: "140km",
    direction: "northwest",
    industry: "agriculture, Indigenous business, government services",
    pop: "14K",
    transit: "1–2 business days",
    shippingRange: "$25–$40",
  },
};

/**
 * All city hub pages in sitemap order — used to generate relatedCities cross-links.
 * Each entry maps to a top-level city hub page (signs-* or printing-*).
 */
export const CITY_HUB_PAGES: { name: string; slug: string }[] = [
  { name: "Regina", slug: "coroplast-signs-regina" },
  { name: "Moose Jaw", slug: "signs-moose-jaw-sk" },
  { name: "Prince Albert", slug: "signs-prince-albert-sk" },
  { name: "Yorkton", slug: "signs-yorkton-sk" },
  { name: "Lloydminster", slug: "printing-lloydminster-sk" },
  { name: "Swift Current", slug: "printing-swift-current-sk" },
  { name: "Estevan", slug: "printing-estevan-sk" },
  { name: "Weyburn", slug: "printing-weyburn-sk" },
  { name: "North Battleford", slug: "signs-north-battleford-sk" },
];
