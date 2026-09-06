"use client";

import { useEffect, useState } from "react";
import type { TaxRates } from "@/lib/payment/tax-math";

export type CheckoutRates = TaxRates & { rushFee: number };

/** Refresh on mount; no guessed rate permits checkout while the source is unavailable. */
export function useCanonicalRates() {
  const [rates, setRates] = useState<CheckoutRates | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/pricing/tax-rates", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Pricing configuration unavailable. Reload before submitting.");
        const value = await response.json();
        if ([value.gstRate, value.pstRate].some((rate) => typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 1) ||
            typeof value.rushFee !== "number" || !Number.isFinite(value.rushFee) || value.rushFee < 0) {
          throw new Error("Pricing configuration is invalid. Reload before submitting.");
        }
        setRates(value);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Pricing configuration unavailable"); });
    return () => controller.abort();
  }, []);
  return { rates, error };
}
