export interface TaxRates {
  gstRate: number;
  pstRate: number;
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
): TaxCents {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error("Tax subtotal must be a non-negative integer number of cents");
  }
  if (!Number.isFinite(rates.gstRate) || !Number.isFinite(rates.pstRate)) {
    throw new Error("Tax rates must be finite numbers");
  }
  const gstCents = Math.round(subtotalCents * rates.gstRate);
  const pstCents = pstExempt ? 0 : Math.round(subtotalCents * rates.pstRate);
  return { gstCents, pstCents, totalCents: subtotalCents + gstCents + pstCents };
}
