import { getConfigNum } from "@/lib/data/loader";
import type { TaxRates } from "@/lib/payment/tax-math";

/** Server-only CSV reader. Never consult or mutate customer/order records. */
export function getCanonicalTaxRates(): TaxRates {
  const rates = { gstRate: getConfigNum("gst_rate"), pstRate: getConfigNum("pst_rate") };
  if (Object.values(rates).some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 1)) {
    throw new Error("Canonical tax configuration is invalid");
  }
  return rates;
}
