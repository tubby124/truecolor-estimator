export interface TaxRates {
  gstRate: number;
  pstRate: number;
  structuredTaxPolicyVersion?: string;
}

export interface TaxCents {
  gstCents: number;
  pstCents: number;
  totalCents: number;
}

export function computeTaxCents(
  subtotalCents: number,
  rates: TaxRates,
  pstExempt = false,
  pstBaseCents = subtotalCents,
): TaxCents {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("Tax subtotal must be a non-negative integer number of cents");
  }
  if ([rates.gstRate, rates.pstRate].some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 1)) {
    throw new Error("Tax rates must be numbers between zero and one");
  }
  if (!Number.isSafeInteger(pstBaseCents) || pstBaseCents < 0 || pstBaseCents > subtotalCents) {
    throw new Error("PST base must be integer cents within the subtotal");
  }
  const gstCents = Math.round(subtotalCents * rates.gstRate);
  const pstCents = pstExempt ? 0 : Math.round(pstBaseCents * rates.pstRate);
  return { gstCents, pstCents, totalCents: subtotalCents + gstCents + pstCents };
}
