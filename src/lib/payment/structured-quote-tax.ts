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

const toCents = (amount: number) => Math.round(amount * 100);

export function computeStructuredQuoteTotals(
  lineItems: StructuredQuoteLineItem[],
  rates: TaxRates,
  pstExempt = false,
): StructuredQuoteTotals {
  const lineTotal = (item: StructuredQuoteLineItem) =>
    (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + lineTotal(item), 0) * 100) / 100;
  const pstBase = pstExempt
    ? 0
    : lineItems
      .filter((item) => !["design_service", "rush_service"].includes(item.taxClass))
      .reduce((sum, item) => sum + lineTotal(item), 0);
  const whole = computeTaxCents(toCents(subtotal), { gstRate: rates.gstRate, pstRate: 0 });
  const pst = pstExempt ? 0 : Math.round(pstBase * rates.pstRate * 100) / 100;
  const gst = whole.gstCents / 100;
  return {
    subtotal,
    gst,
    pst,
    grandTotal: Math.round((subtotal + gst + pst) * 100) / 100,
  };
}
