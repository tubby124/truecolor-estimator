/**
 * Customer-facing commerce policy. This is deliberately separate from pricing
 * rules: no delivery rate, production date, or rush charge is inferred here.
 */
export const COMMERCE_POLICY_VERSION = "2026-09-02";

export const COMMERCE_POLICY = {
  pickup: {
    kind: "pickup" as const,
    price: "free",
    address: "216 33rd St W, Saskatoon, SK S7L 0V1",
    display: "Free pickup at 216 33rd St W",
    summary: "Free pickup is available at 216 33rd St W, Saskatoon, SK S7L 0V1.",
  },
  shipping: {
    kind: "quote_required" as const,
    display: "Shipping is quoted from the final job and destination details.",
    paymentRule: "Do not charge shipping until staff has quoted it and the customer accepts.",
    summary: "Shipping is quote-only from final job and destination details; no rate, carrier, or delivery timing is promised online.",
    requestLabel: "Request a shipping quote",
  },
  production: {
    standard: "2–3 business days after both artwork approval and payment",
    standardWindow: "2–3 business days",
    startsAfter: "both artwork approval and payment",
    summary: "Standard production is 2–3 business days after both artwork approval and payment.",
  },
  rush: {
    kind: "staff_confirmation_required" as const,
    display: "Rush is available only after staff confirms capacity, fee, and timing before payment.",
    summary: "Rush is a request only. Staff must confirm capacity, fee, and timing before payment.",
  },
  returns: {
    display: "Custom prints are final sale except verified defects or True Color errors reported within 48 hours.",
    reportingWindowHours: 48,
    reportWindow: "48 hours",
    summary: "Custom prints are final sale except verified defects or True Color errors reported within 48 hours.",
  },
  privacy: {
    summary: "Customer identity, artwork, order details, and analytics data are kept private and are not reused without recorded permission.",
  },
} as const;

export type FulfillmentSelection = "pickup" | "shipping_quote";

export function isPayableFulfillment(selection: FulfillmentSelection): boolean {
  // A shipping quote has no rate or acceptance receipt in self-serve checkout.
  return selection === "pickup";
}
