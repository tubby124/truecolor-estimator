import { computeTaxCents, type TaxRates } from "@/lib/payment/tax-math";
import { isPstExemptCategory } from "@/lib/pricing/tax";

export interface CatalogWavePlanItem {
  description: string;
  qty: number;
  sellPrice: number;
  designFee?: number | null;
  category?: string | null;
  materialCode?: string | null;
}

export interface CatalogWaveLine {
  description: string;
  unitPrice: number;
  qty: number;
  applyGst: boolean;
  applyPst: boolean;
}

export interface CatalogWaveInvoicePlan {
  waveItems: CatalogWaveLine[];
  /** The catalog plan owns every emitted line, including rush. */
  isRush: boolean;
  financials: {
    subtotalCents: number;
    gstCents: number;
    pstCents: number;
    totalCents: number;
  };
}

export interface CatalogWavePlanOptions {
  items: CatalogWavePlanItem[];
  discount: number;
  discountDescription?: string;
  smallOrderFee: number;
  rush: number;
  rates: TaxRates;
}

function dollarsToCents(value: number, field: string): number {
  const cents = Math.round(value * 100);
  if (!Number.isFinite(value) || !Number.isSafeInteger(cents) || value < 0) {
    throw new Error(`${field} must be a non-negative dollar amount`);
  }
  return cents;
}

/**
 * Wave rounds sales tax on each emitted invoice line. This plan is the single
 * catalog representation used for the browser preview and the API's Wave
 * invoice, so an order is never saved with aggregate tax that Wave cannot
 * approve. Negative discount lines use the matching magnitude's rounded tax.
 */
export function buildCatalogWaveInvoicePlan(opts: CatalogWavePlanOptions): CatalogWaveInvoicePlan {
  const { items, rates } = opts;
  const discountCents = dollarsToCents(opts.discount, "Discount");
  const setupCents = dollarsToCents(opts.smallOrderFee, "Small order fee");
  const rushCents = dollarsToCents(opts.rush, "Rush fee");
  const waveItems: CatalogWaveLine[] = [];

  const addLine = (
    description: string,
    totalCents: number,
    qty: number,
    applyPst: boolean,
  ) => {
    if (totalCents === 0) return;
    if (!Number.isSafeInteger(totalCents) || !Number.isSafeInteger(qty) || qty <= 0) {
      throw new Error("Catalog invoice lines must have whole-cent totals and positive quantities");
    }
    // Wave serializes unitPrice to two decimals. Keep a normal quantity line
    // when it divides exactly; otherwise retain the exact total as one line.
    if (totalCents % qty === 0) {
      waveItems.push({ description, unitPrice: totalCents / qty / 100, qty, applyGst: true, applyPst });
    } else {
      waveItems.push({
        description: `${description} — Quantity: ${qty}`,
        unitPrice: totalCents / 100,
        qty: 1,
        applyGst: true,
        applyPst,
      });
    }
  };

  let taxablePositiveCents = 0;
  for (const item of items) {
    const totalCents = dollarsToCents(item.sellPrice, "Cart item");
    const feeCents = dollarsToCents(item.designFee ?? 0, "Design fee");
    if (feeCents > totalCents) throw new Error("Design fee cannot exceed cart item price");
    const productCents = totalCents - feeCents;
    const applyPst = !isPstExemptCategory(item.category, item.materialCode);
    addLine(item.description, productCents, item.qty, applyPst);
    if (feeCents > 0) addLine("Design / Artwork Fee", feeCents, 1, applyPst);
    if (applyPst) taxablePositiveCents += totalCents;
  }

  const hasTaxableCatalogItem = items.some(
    (item) => !isPstExemptCategory(item.category, item.materialCode),
  );
  if (hasTaxableCatalogItem) taxablePositiveCents += setupCents + rushCents;

  const totalPositiveCents = items.reduce(
    (sum, item) => sum + dollarsToCents(item.sellPrice, "Cart item"),
    0,
  ) + setupCents + rushCents;
  if (discountCents > totalPositiveCents) throw new Error("Discount cannot exceed the catalog total");

  // Preserve the current PST policy: a discount first offsets the taxable
  // portion, then any remainder offsets GST-only service work.
  const taxableDiscountCents = Math.min(discountCents, taxablePositiveCents);
  const gstOnlyDiscountCents = discountCents - taxableDiscountCents;
  const discountDescription = opts.discountDescription ?? "Discount";
  if (taxableDiscountCents > 0) addLine(discountDescription, -taxableDiscountCents, 1, true);
  if (gstOnlyDiscountCents > 0) addLine(`${discountDescription} (service portion)`, -gstOnlyDiscountCents, 1, false);
  if (setupCents > 0) addLine("Small order setup fee", setupCents, 1, hasTaxableCatalogItem);
  if (rushCents > 0) {
    addLine("Rush production fee — same-day turnaround", rushCents, 1, hasTaxableCatalogItem);
  }

  let gstCents = 0;
  let pstCents = 0;
  let subtotalCents = 0;
  for (const line of waveItems) {
    const lineCents = Math.round(line.unitPrice * 100) * line.qty;
    subtotalCents += lineCents;
    const sign = lineCents < 0 ? -1 : 1;
    const tax = computeTaxCents(Math.abs(lineCents), rates, !line.applyPst);
    gstCents += sign * tax.gstCents;
    pstCents += sign * tax.pstCents;
  }
  return {
    waveItems,
    // createWaveInvoice's legacy option appends a second rush line, so the
    // plan passes false after including the exact configured line above.
    isRush: false,
    financials: {
      subtotalCents,
      gstCents,
      pstCents,
      totalCents: subtotalCents + gstCents + pstCents,
    },
  };
}
