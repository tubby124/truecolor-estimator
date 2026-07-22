export type RevenueConversionType = "purchase_online" | "quote_won";

export function isRevenueConversionType(value: unknown): value is RevenueConversionType {
  return value === "purchase_online" || value === "quote_won";
}

export function pretaxConversionValue(input: {
  total: number;
  gst: number;
  pst: number;
}): number {
  if (![input.total, input.gst, input.pst].every(Number.isFinite)) return 0;
  return Math.max(0, Math.round((input.total - input.gst - input.pst) * 100) / 100);
}

export function conversionTransactionId(input: {
  conversionType: RevenueConversionType;
  conversionKey: string | null | undefined;
  orderNumber: string | null | undefined;
}): string | null {
  const key = input.conversionKey?.trim();
  const orderNumber = input.orderNumber?.trim();
  if (!key || !key.startsWith(`${input.conversionType}:`)) return null;
  if (!orderNumber || orderNumber.length > 100) return null;
  return orderNumber;
}
