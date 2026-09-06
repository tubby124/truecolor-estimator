import { computeTaxCents, type TaxRates } from "@/lib/payment/tax-math";
import { structuredQuotePstBaseCents, type StructuredQuoteTaxClass } from "@/lib/payment/structured-quote-tax";

export interface ManualPricingLine {
  amount: number;
  qty?: number;
  unitPrice?: number;
  taxClass?: StructuredQuoteTaxClass;
  standaloneService?: boolean;
}

export const maximumManualTotalCents = (rates: TaxRates) => Math.round(99999 * (1 + rates.gstRate + rates.pstRate) * 100);

export function manualBreakdownCents(items: ManualPricingLine[], rates: TaxRates, pstExempt = false) {
  const lines = items.filter((item) => !item.standaloneService).map((item) => ({
    description: "Manual line", qty: "1", unitPrice: (Math.round(item.amount * 100) / 100).toFixed(2),
    taxClass: item.taxClass ?? "printed_good" as StructuredQuoteTaxClass,
  }));
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
  return { subtotalCents, ...computeTaxCents(subtotalCents, rates, pstExempt, structuredQuotePstBaseCents(lines)) };
}

/** Shared by modal and API. An override changes only this quote's line amounts. */
export function scaleManualPricing<T extends ManualPricingLine>(items: T[], rates: TaxRates, overrideTotal?: number | null, pstExempt = false) {
  const breakdown = manualBreakdownCents(items, rates, pstExempt);
  if (overrideTotal == null) return { items, breakdown };
  const target = Math.round(overrideTotal * 100);
  if (!Number.isSafeInteger(target) || target <= 0 || target > maximumManualTotalCents(rates)) {
    throw new Error("Override total must be greater than $0 and within the maximum allowed");
  }
  if (breakdown.totalCents <= 0 || !items.length) throw new Error("Add line amounts before editing the total.");
  const scaled = items.map((item) => ({ ...item, amount: Math.round(Math.round(item.amount * 100) * target / breakdown.totalCents) / 100 }));
  const last = scaled.length - 1;
  let low = 0;
  let high = target;
  let matched = false;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    scaled[last].amount = mid / 100;
    const current = manualBreakdownCents(scaled, rates, pstExempt).totalCents;
    if (current === target) { matched = true; break; }
    if (current < target) low = mid + 1;
    else high = mid - 1;
  }
  if (!matched) throw new Error("This total cannot be matched exactly with the current tax mix.");
  // A changed line total must never leave a stale unit-price claim in the email.
  const adjusted = scaled.map((item) => ({ ...item, unitPrice: item.qty && Number.isInteger(Math.round(item.amount * 100) / item.qty) ? item.amount / item.qty : undefined }));
  return { items: adjusted, breakdown: manualBreakdownCents(adjusted, rates, pstExempt) };
}
