"use client";

/**
 * Shared hooks + UI bits for the per-category configurators (StickerConfigurator,
 * BookletConfigurator, DisplayConfigurator, DecalConfigurator, BrochureConfigurator).
 *
 * Each per-category file owns its own input state (size, qty, material, etc.).
 * Everything that's the SAME across categories lives here:
 *   - useEngineQuote: debounced /api/estimate call + PriceData derivation + tax
 *   - DesignAndRushControls: design fee + rush toggle (every wave needs these)
 *   - StaffManualOverride: engine quote display + manual override field (staff mode)
 *   - EMPTY_PRICE: shared zero-state
 *   - ChipButton, NumberInput: shared styling
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import { useEffect, useState } from "react";
import type { Category, DesignStatus } from "@/lib/data/types";
import type { EstimateResponse } from "@/lib/engine/types";
import type { LineItem } from "@/lib/cart/cart";
import { computeTax } from "@/lib/pricing/tax";
import type { PriceData } from "./ProductConfigurator";

export const EMPTY_PRICE: PriceData = {
  price: null, loading: false, addonTotal: 0, designFee: 0, rushFee: 0,
  gst: null, pst: null, total: null,
  pricePerUnit: null, qtyDiscountPct: null, qtyDiscountApplied: false,
  minChargeApplied: false, minChargeValue: null, preMinSubtotal: null, lineItems: [],
};

interface EngineQuoteRequest {
  category: Category;
  material_code: string;
  width_in: number;
  height_in: number;
  sides: 1 | 2;
  qty: number;
  designStatus: DesignStatus;
  isRush: boolean;
  inputsValid: boolean;
}

interface EngineQuoteResult {
  priceData: PriceData;
  rawResponse: EstimateResponse | null;
}

/**
 * Debounced engine quoter. Calls /api/estimate when inputsValid, derives
 * PriceData + computes tax. Returns the latest PriceData and the raw
 * EstimateResponse for parents that need it (staff QuotePanel).
 *
 * Why returned (not callback'd back): keeping the response in this hook's
 * state means a per-category configurator can render its own quote panel
 * without round-tripping through the parent's state.
 */
export function useEngineQuote(req: EngineQuoteRequest): EngineQuoteResult {
  const [priceData, setPriceData] = useState<PriceData>(EMPTY_PRICE);
  const [rawResponse, setRawResponse] = useState<EstimateResponse | null>(null);

  useEffect(() => {
    // No sync setState on the invalid path — the returned value already
    // derives EMPTY_PRICE + null via the inputsValid ternary at the bottom
    // of this hook, so reading from the consumer side sees the empty state
    // without us cascading a render here.
    if (!req.inputsValid) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: req.category,
            material_code: req.material_code,
            width_in: req.width_in,
            height_in: req.height_in,
            sides: req.sides,
            qty: req.qty,
            design_status: req.designStatus,
            is_rush: req.isRush,
            pricing_version: "v1_2026-02-19",
          }),
        });
        if (!res.ok) {
          if (!cancelled) { setPriceData({ ...EMPTY_PRICE }); setRawResponse(null); }
          return;
        }
        const data = (await res.json()) as EstimateResponse;
        if (cancelled) return;
        if (data.status !== "QUOTED" || data.sell_price == null) {
          setPriceData({ ...EMPTY_PRICE, loading: false });
          setRawResponse(data);
          return;
        }
        const tax = computeTax({
          sell_price: data.sell_price,
          design_fee: data.design_fee,
          rush_fee: data.rush_fee,
          gst_rate: data.gst_rate,
        });
        setPriceData({
          price: data.sell_price,
          loading: false,
          addonTotal: 0,
          designFee: data.design_fee ?? 0,
          rushFee: data.rush_fee ?? 0,
          gst: tax.gst,
          pst: tax.pst,
          total: data.sell_price + tax.gst + tax.pst,
          pricePerUnit: data.price_per_unit,
          qtyDiscountPct: data.qty_discount_pct,
          qtyDiscountApplied: data.qty_discount_applied,
          minChargeApplied: data.min_charge_applied,
          minChargeValue: data.min_charge_value,
          preMinSubtotal: data.pre_min_subtotal,
          lineItems: data.line_items.map<LineItem>((li) => ({
            description: li.description,
            qty: li.qty,
            unit_price: li.unit_price,
            line_total: li.line_total,
            rule_id: li.rule_id,
          })),
        });
        setRawResponse(data);
      } catch {
        if (!cancelled) { setPriceData({ ...EMPTY_PRICE, loading: false }); setRawResponse(null); }
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [
    req.category, req.material_code, req.width_in, req.height_in, req.sides,
    req.qty, req.designStatus, req.isRush, req.inputsValid,
  ]);

  return {
    priceData: req.inputsValid ? priceData : EMPTY_PRICE,
    rawResponse: req.inputsValid ? rawResponse : null,
  };
}

interface DesignAndRushProps {
  designStatus: DesignStatus;
  onDesignStatusChange: (s: DesignStatus) => void;
  isRush: boolean;
  onRushChange: (r: boolean) => void;
}

export function DesignAndRushControls({
  designStatus, onDesignStatusChange, isRush, onRushChange,
}: DesignAndRushProps) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Artwork</p>
        <select
          value={designStatus}
          onChange={(e) => onDesignStatusChange(e.target.value as DesignStatus)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
        >
          <option value="PRINT_READY">Print-ready file</option>
          <option value="MINOR_EDIT">Minor edits (+$35)</option>
          <option value="FULL_DESIGN">Full design (+$50)</option>
          <option value="LOGO_RECREATION">Logo recreation (+$75)</option>
        </select>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isRush}
          onChange={(e) => onRushChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
        />
        <span className="text-sm text-gray-700">Rush — same-day (+$40)</span>
      </label>
    </>
  );
}

interface StaffManualOverrideProps {
  price: number | null;
  value: string;
  onChange: (v: string) => void;
}

export function StaffManualOverride({ price, value, onChange }: StaffManualOverrideProps) {
  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Engine quote</span>
        <span className="font-mono font-semibold">
          {price != null ? `$${price.toFixed(2)}` : "—"}
        </span>
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Manual override (optional)
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="Leave blank to use engine quote"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Staff-only — used when Albert quotes a custom job. Engine quote stays the baseline.
        </span>
      </label>
    </div>
  );
}

interface ChipButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export function ChipButton({ selected, onClick, children, ariaLabel }: ChipButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-xl border transition-all ${
        selected
          ? "border-[var(--brand)] bg-[var(--brand)] text-white font-semibold"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}
