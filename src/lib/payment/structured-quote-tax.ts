import { computeTaxCents, type TaxRates } from "@/lib/payment/tax-math";

export type StructuredQuoteTaxClass =
  | "printed_good"
  | "design_service"
  | "rush_service"
  | "installation_service";

export interface StructuredQuoteLineItem {
  description: string;
  qty: string;
  unitPrice: string;
  taxClass: StructuredQuoteTaxClass;
}

export interface StructuredQuoteTotals {
  subtotal: number;
  gst: number;
  pst: number;
  grandTotal: number;
}

export const STRUCTURED_TAX_POLICY_VERSION = "pst20_20260906";
export const STRUCTURED_TAX_ROUNDING_VERSION = "wave_per_line_v1";

function lineCents(item: StructuredQuoteLineItem): number {
  return Math.round((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0) * 100);
}

function lineIsPstTaxable(
  item: StructuredQuoteLineItem,
  lineItems: StructuredQuoteLineItem[],
  rates: TaxRates,
): boolean {
  if (rates.structuredTaxPolicyVersion === STRUCTURED_TAX_POLICY_VERSION) {
    return lineItems.some((line) => line.taxClass === "printed_good") ||
      !["design_service", "rush_service"].includes(item.taxClass);
  }
  return !["design_service", "rush_service"].includes(item.taxClass);
}

/** Current policy for new revisions. Standalone design/rush remains GST only;
 * services supplied with printed goods belong to that taxable print sale. */
export function structuredQuotePstBaseCents(lineItems: StructuredQuoteLineItem[]): number {
  const bundledPrint = lineItems.some((item) => item.taxClass === "printed_good");
  return lineItems.reduce((sum, item) => {
    if (!bundledPrint && ["design_service", "rush_service"].includes(item.taxClass)) return sum;
    return sum + Math.round((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0) * 100);
  }, 0);
}

export function computeStructuredQuoteTotals(
  lineItems: StructuredQuoteLineItem[],
  rates: TaxRates,
  pstExempt = false,
): StructuredQuoteTotals {
  const subtotalCents = lineItems.reduce((sum, item) => sum + lineCents(item), 0);
  if (rates.structuredTaxRoundingVersion === STRUCTURED_TAX_ROUNDING_VERSION) {
    const gstCents = lineItems.reduce(
      (sum, item) => sum + Math.round(lineCents(item) * rates.gstRate),
      0,
    );
    const pstCents = pstExempt ? 0 : lineItems.reduce(
      (sum, item) => sum + (lineIsPstTaxable(item, lineItems, rates)
        ? Math.round(lineCents(item) * rates.pstRate)
        : 0),
      0,
    );
    return {
      subtotal: subtotalCents / 100,
      gst: gstCents / 100,
      pst: pstCents / 100,
      grandTotal: (subtotalCents + gstCents + pstCents) / 100,
    };
  }
  // Capability comes from the read-only DB config. Until the additive migration
  // is applied, preview, API and existing SQL all keep the same legacy basis.
  const pstBaseCents = rates.structuredTaxPolicyVersion === STRUCTURED_TAX_POLICY_VERSION
    ? structuredQuotePstBaseCents(lineItems)
    : lineItems.filter((item) => !["design_service", "rush_service"].includes(item.taxClass))
      .reduce((sum, item) => sum + Math.round((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0) * 100), 0);
  const tax = computeTaxCents(subtotalCents, rates, pstExempt, pstBaseCents);
  return { subtotal: subtotalCents / 100, gst: tax.gstCents / 100, pst: tax.pstCents / 100, grandTotal: tax.totalCents / 100 };
}
