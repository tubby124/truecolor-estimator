import type { TaxRates } from "@/lib/payment/tax-math";
export interface ReviewedPricing extends TaxRates {
  subtotalCents: number;
  gstCents: number;
  pstCents: number;
  totalCents: number;
}
export function reviewedPricingMatches(expected: unknown, actual: ReviewedPricing): boolean {
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) return false;
  const input = expected as Record<string, unknown>;
  const amounts = ["subtotalCents", "gstCents", "pstCents", "totalCents"] as const;
  if (amounts.some((key) => !Number.isSafeInteger(input[key]) || input[key] !== actual[key])) return false;
  return input.gstRate === actual.gstRate && input.pstRate === actual.pstRate &&
    (input.structuredTaxPolicyVersion ?? null) === (actual.structuredTaxPolicyVersion ?? null);
}
