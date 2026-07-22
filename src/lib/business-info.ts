import { RATING_VALUE, REVIEW_COUNT } from "@/lib/reviews";

export type SaskatchewanWeekday =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

export interface ShopClockParts {
  day: SaskatchewanWeekday;
  hour: number;
  minute: number;
}

export type SameDayRushState =
  | { status: "countdown"; minutesRemaining: number }
  | { status: "call" }
  | { status: "closed" };

/**
 * Public operational facts shared by UI, feeds, and AI-readable content.
 *
 * Price-bearing values identify their repository source and are asserted
 * against the CSV-backed pricing engine in business-info.test.ts. Keep
 * customer-facing copy derived from this object wherever practical.
 */
export const BUSINESS_INFO = {
  legalName: "True Color Display Printing Ltd.",
  website: "https://truecolorprinting.ca",
  address: {
    street: "216 33rd St W (upstairs)",
    city: "Saskatoon",
    province: "SK",
    postalCode: "S7L 0V1",
    display: "216 33rd St W (upstairs), Saskatoon, SK S7L 0V1",
  },
  phone: {
    display: "(306) 954-8688",
    href: "tel:+13069548688",
  },
  email: "info@true-color.ca",
  hours: {
    timeZone: "America/Regina",
    weekdayOpenHour: 9,
    weekdayCloseHour: 17,
    weekendClosed: true,
    display: "Mon–Fri 9 AM–5 PM",
  },
  turnaround: {
    standardBusinessDays: "1–3 business days",
    startsAfter: "artwork approval",
  },
  sameDayRush: {
    feeDollars: 40,
    feeSource: "data/tables/config.v1.csv:rush_fee_flat",
    cutoffHour: 10,
    cutoffMinute: 0,
    requiresCapacityConfirmation: true,
    display: "+$40 when ordered before 10 AM; call to confirm capacity",
  },
  fulfillment: {
    pickup: "Local pickup is standard.",
    courier:
      "Saskatchewan courier may be arranged by request at customer cost.",
    display:
      "Local pickup is standard. Saskatchewan courier may be arranged by request at customer cost.",
  },
  equipment: {
    wideFormat: {
      manufacturer: "Roland",
      model: "TrueVIS VG2",
      technology: "eco-solvent printer/cutter",
      display: "Roland TrueVIS VG2 eco-solvent printer/cutter",
    },
    digitalPress: {
      manufacturer: "Konica Minolta",
      technology: "digital production press",
      display: "Konica Minolta digital production press",
    },
    finishing: {
      display: "manual laminator",
    },
  },
  reviews: {
    ratingValue: RATING_VALUE,
    reviewCount: REVIEW_COUNT,
  },
} as const;

/**
 * Marketing anchors are not engine inputs. Tests bind these display values to
 * their authoritative CSV rows/rules so a future pricing change cannot drift
 * silently into contradictory public copy.
 */
export const MARKETING_PRICE_FACTS = {
  businessCards: {
    fromDollars: 45,
    configuration: "250 double-sided business cards on 14pt gloss stock",
    source: "data/tables/products.v1.csv:BC-14PT-250-2S",
  },
  coroplast: {
    ratePerSqFt: 8,
    orderMinimumDollars: 25,
    rateSource: "data/tables/pricing_rules.v1.csv:PR-CORO-S-T1",
    orderMinimumSource: "src/lib/pricing/order-min.ts",
  },
  flyers: {
    fromDollars: 45,
    configuration: "100 full-letter double-sided flyers on 80lb gloss stock",
    source: "data/tables/products.v1.csv:FLYER-80LB-100",
  },
  acpSigns: {
    fromDollars: 39,
    configuration: "18×24-inch single-sided ACP sign",
    source: "data/tables/products.v1.csv:RIGID-ACP3-18X24-S",
  },
  vehicleMagnets: {
    ratePerSqFt: 24,
    orderMinimumDollars: 25,
    rateSource: "data/tables/pricing_rules.v1.csv:PR-MAGNET-T1",
    orderMinimumSource: "src/lib/pricing/order-min.ts",
  },
  windowDecals: {
    ratePerSqFt: 11,
    orderMinimumDollars: 25,
    rateSource: "data/tables/pricing_rules.v1.csv:PR-DECAL-S",
    orderMinimumSource: "src/lib/pricing/order-min.ts",
  },
  vinylLettering: {
    ratePerSqFt: 8.5,
    orderMinimumDollars: 25,
    rateSource: "data/tables/pricing_rules.v1.csv:PR-LETTER-CUST",
    orderMinimumSource: "src/lib/pricing/order-min.ts",
  },
} as const;

export function getSameDayRushState({
  day,
  hour,
  minute,
}: ShopClockParts): SameDayRushState {
  if (day === "Sat" || day === "Sun") return { status: "closed" };

  const currentMinutes = hour * 60 + minute;
  const cutoffMinutes =
    BUSINESS_INFO.sameDayRush.cutoffHour * 60 +
    BUSINESS_INFO.sameDayRush.cutoffMinute;
  const closeMinutes = BUSINESS_INFO.hours.weekdayCloseHour * 60;

  if (currentMinutes >= closeMinutes) return { status: "closed" };
  if (currentMinutes >= cutoffMinutes) return { status: "call" };

  return {
    status: "countdown",
    minutesRemaining: cutoffMinutes - currentMinutes,
  };
}
