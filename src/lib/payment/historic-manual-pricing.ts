import { isPstExemptCategory } from "@/lib/pricing/tax";
import type { StructuredQuoteTaxClass } from "@/lib/payment/structured-quote-tax";

export function historicManualPricing(item: { qty: number; line_total: number; category: string; material_code?: string | null; line_items_json?: unknown }) {
  const metadata = (Array.isArray(item.line_items_json) ? item.line_items_json[0] : item.line_items_json) as Record<string, unknown> | null;
  const standaloneService = isPstExemptCategory(item.category, item.material_code) || metadata?.standaloneService === true;
  const known = ["printed_good", "design_service", "rush_service", "installation_service"].includes(String(metadata?.taxClass));
  const serviceCategory = ["DESIGN", "SERVICE", "INSTALLATION"].includes(item.category);
  const taxClass: StructuredQuoteTaxClass | undefined = standaloneService ? "design_service" : known ? metadata!.taxClass as StructuredQuoteTaxClass : serviceCategory ? undefined : "printed_good";
  const cents = Math.round(item.line_total * 100);
  return {
    taxClass, standaloneService,
    taxClassificationRequired: serviceCategory && taxClass === undefined,
    kind: serviceCategory || (taxClass != null && taxClass !== "printed_good") ? "fee" as const : "product" as const,
    unitPrice: item.qty > 0 && Number.isInteger(cents / item.qty) ? (cents / item.qty / 100).toFixed(2) : "",
  };
}
