"use client";

/**
 * UnifiedConfigurator — Wave 1 (Stickers only).
 *
 * Reads getProductConfig(category) and renders the right controls for that
 * category. Same engine. Same data. Two modes:
 *   - "customer" → hides margin + manual override (used on /products/[slug])
 *   - "staff"    → shows margin + manual override (used on /staff)
 *
 * Emits PriceData + ConfigData via callbacks — parent owns cart, quote, payment
 * surfaces. This component does NOT touch /api/orders, /api/checkout, or any
 * payment plumbing. Read-only quoter.
 *
 * Wave 1 scope: STICKER only. Other categories show a fallback message; the
 * mount sites are flag-gated to STICKER for now. Future waves slot in by
 * promoting categories in product-config.ts; this renderer is generic over the
 * OptionControl kinds so the same code handles them.
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import { useState, useEffect } from "react";
import type { Category, DesignStatus } from "@/lib/data/types";
import type { EstimateResponse } from "@/lib/engine/types";
import type { LineItem } from "@/lib/cart/cart";
import { computeTax } from "@/lib/pricing/tax";
import {
  STICKER_CONFIG,
  snapQtyToTier,
  type OptionChoice,
  type ProductConfigShape,
} from "@/lib/data/sticker-config";
import { flags } from "@/lib/flags";
import type { PriceData, ConfigData } from "./ProductConfigurator";

interface UnifiedConfiguratorProps {
  category: Category;
  mode: "customer" | "staff";
  prefilled?: Partial<ConfigData & { isRush: boolean }>;
  onPriceChange?: (data: PriceData) => void;
  onConfigChange?: (config: ConfigData) => void;
  /** Emits the raw EstimateResponse so a parent (staff page) can drive its
   *  existing QuotePanel + ProductProof + Add-to-Cart flow unchanged. */
  onResponse?: (response: EstimateResponse | null, loading: boolean) => void;
}

const EMPTY_PRICE: PriceData = {
  price: null, loading: false, addonTotal: 0, designFee: 0, rushFee: 0,
  gst: null, pst: null, total: null,
  pricePerUnit: null, qtyDiscountPct: null, qtyDiscountApplied: false,
  minChargeApplied: false, minChargeValue: null, preMinSubtotal: null, lineItems: [],
};

function defaultChoice(choices: OptionChoice[] | undefined, fallback: OptionChoice | null = null): OptionChoice | null {
  if (!choices || choices.length === 0) return fallback;
  // Prefer the choice marked as default by value matching; else first non-custom.
  const nonCustom = choices.find((c) => !c.custom);
  return nonCustom ?? choices[0] ?? fallback;
}

export function UnifiedConfigurator({
  category, mode, prefilled, onPriceChange, onConfigChange, onResponse,
}: UnifiedConfiguratorProps) {
  // Wave 1 — client bundle only knows about STICKER. Other categories are
  // promoted in subsequent waves; until then the component renders a fallback
  // (the flag-gating at the mount site already prevents this branch from
  // firing for non-STICKER categories). React Compiler auto-memoizes these
  // direct derivations — no manual useMemo wrappers needed (and they trip
  // react-hooks/preserve-manual-memoization on dep mismatch).
  const cfg: ProductConfigShape | null = category === "STICKER" ? STICKER_CONFIG : null;
  const sizeControl = cfg?.controls.find((c) => c.key === "size_preset");
  const sizeChoices: OptionChoice[] = sizeControl?.choices ?? [];

  // useState lazy initializer — runs once on mount, no need to memoize. Picks
  // the prefilled-material choice if any, else the configured default, else
  // the first non-custom choice in the list.
  const [selectedSize, setSelectedSize] = useState<OptionChoice | null>(() => {
    if (prefilled?.materialCode && sizeChoices.length > 0) {
      const match = sizeChoices.find((c) => c.material_code === prefilled.materialCode);
      if (match) return match;
    }
    const dv = sizeControl?.defaultValue;
    if (dv !== undefined) {
      const match = sizeChoices.find((c) => c.value === dv);
      if (match) return match;
    }
    return defaultChoice(sizeChoices);
  });
  const [customW, setCustomW] = useState<string>(String(prefilled?.widthIn ?? 4));
  const [customH, setCustomH] = useState<string>(String(prefilled?.heightIn ?? 4));
  const [qtyInput, setQtyInput] = useState<string>(String(prefilled?.qty ?? 100));
  const [designStatus, setDesignStatus] = useState<DesignStatus>(
    (prefilled?.designStatus as DesignStatus) ?? "PRINT_READY",
  );
  const [isRush, setIsRush] = useState<boolean>(prefilled?.isRush ?? false);
  const [manualOverride, setManualOverride] = useState<string>("");
  // STICKER-specific V2 inputs — only rendered when sticker V2 is active.
  // Material chip drives engine material_code (white/clear/perf). Shape chip
  // drives engine.shape (circle = +80%, die_cut = no premium per V2 data).
  const [stickerMaterial, setStickerMaterial] = useState<"ARLPMF7008" | "ARLPMF7008_CLEAR" | "RMVN006">("ARLPMF7008");
  const [stickerShape, setStickerShape] = useState<"square" | "circle" | "die_cut">("square");
  // priceData ONLY tracks fetched results. The "no inputs → empty" case is
  // a derived render-time computation below (avoids set-state-in-effect).
  const [priceData, setPriceData] = useState<PriceData>(EMPTY_PRICE);

  // Derived effective inputs — preset choice's W/H/material unless Custom is picked.
  const isCustom = selectedSize?.custom === true;
  const effectiveW = isCustom ? parseFloat(customW) || 0 : selectedSize?.width_in ?? 0;
  const effectiveH = isCustom ? parseFloat(customH) || 0 : selectedSize?.height_in ?? 0;
  // When V2 is on and category is STICKER, the material chip overrides the
  // preset's material_code (presets use the existing PLACEHOLDER_STICKER_*
  // family for size routing, but V2 needs to know vinyl_white vs vinyl_clear
  // vs perf_8mil — so the chip wins).
  const v2Active = category === "STICKER" && flags.useStickerPricingV2();
  const effectiveMaterial = v2Active
    ? stickerMaterial
    : selectedSize?.material_code ?? "";

  // Qty snap — UI rounds UP to nearest tier when requested qty isn't on a tier.
  // The engine's legacy lot rules use qty_min===qty_max so off-tier qty returns
  // BLOCKED. When STICKER_PRICING_V2 is on, the V2 model accepts ANY qty
  // (continuous tier-based pricing), so we skip the snap behavior entirely.
  const requestedQty = parseInt(qtyInput, 10) || 0;
  const snap =
    v2Active || !cfg?.qty_snap_to_tier || !cfg.qty_tiers || requestedQty <= 0
      ? { snapped: false, from: requestedQty, to: requestedQty, exceeded_max: false }
      : snapQtyToTier(requestedQty, cfg.qty_tiers);
  const effectiveQty = snap.to;
  const inputsValid = effectiveW > 0 && effectiveH > 0 && effectiveQty > 0 && !!effectiveMaterial;
  // Render-time derivation — when inputs aren't valid yet, show empty data
  // without invoking setState in an effect.
  const emittedPriceData: PriceData = inputsValid ? priceData : EMPTY_PRICE;

  const sides: 1 | 2 = 1; // Wave 1: stickers are sides=1 only (owner decision 2026-05-29).

  // Debounced engine call — same shape as staff page + ProductConfigurator.
  // The "empty/invalid inputs" case is handled via render-time derivation
  // (emittedPriceData above) so we don't sync-setState inside this effect.
  useEffect(() => {
    if (!inputsValid) {
      onResponse?.(null, false);
      return;
    }
    let cancelled = false;
    onResponse?.(null, true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            material_code: effectiveMaterial,
            width_in: effectiveW,
            height_in: effectiveH,
            sides,
            qty: effectiveQty,
            design_status: designStatus,
            is_rush: isRush,
            pricing_version: "v1_2026-02-19",
          }),
        });
        if (!res.ok) {
          if (!cancelled) { setPriceData({ ...EMPTY_PRICE }); onResponse?.(null, false); }
          return;
        }
        const data = (await res.json()) as EstimateResponse;
        if (cancelled) return;
        if (data.status !== "QUOTED" || data.sell_price == null) {
          setPriceData({ ...EMPTY_PRICE, loading: false });
          onResponse?.(data, false);
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
        onResponse?.(data, false);
      } catch {
        if (!cancelled) { setPriceData({ ...EMPTY_PRICE, loading: false }); onResponse?.(null, false); }
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [
    inputsValid, category, effectiveMaterial, effectiveW, effectiveH, effectiveQty,
    designStatus, isRush, onResponse,
  ]);

  // Emit callbacks on every meaningful state change so parent can drive cart /
  // quote / payment surfaces externally (no payment plumbing inside this file).
  // Emit derived emittedPriceData (EMPTY when inputs invalid) not raw priceData.
  useEffect(() => { onPriceChange?.(emittedPriceData); }, [emittedPriceData, onPriceChange]);
  useEffect(() => {
    onConfigChange?.({
      widthIn: effectiveW,
      heightIn: effectiveH,
      qty: effectiveQty,
      sides,
      addonQtys: {},
      designStatus,
      materialCode: effectiveMaterial,
      sizeLabel: selectedSize?.label ?? "",
      sidesLabel: "Single-sided",
    });
  }, [
    effectiveW, effectiveH, effectiveQty, designStatus,
    effectiveMaterial, selectedSize?.label, onConfigChange,
  ]);

  if (!cfg || cfg.status !== "live") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        UnifiedConfigurator: <code>{category}</code> not promoted to live yet.
        This category still uses the legacy configurator.
      </div>
    );
  }

  const designOptions = cfg.controls.find((c) => c.key === "design_status")?.choices ?? [];
  const showRush = cfg.controls.some((c) => c.key === "is_rush");

  return (
    <div className="space-y-6">
      {/* Size preset grid */}
      {sizeControl && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            {sizeControl.label}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={sizeControl.label}>
            {sizeChoices.map((choice) => {
              const selected = selectedSize?.value === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedSize(choice)}
                  className={`px-3 py-2 text-sm rounded-xl border transition-all ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white font-semibold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
          {isCustom && selectedSize?.help && (
            <p className="mt-2 text-xs text-gray-500">{selectedSize.help}</p>
          )}
        </div>
      )}

      {/* Custom width / height inputs — only when Custom size is picked */}
      {isCustom && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Width (in)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="1"
              max="24"
              value={customW}
              onChange={(e) => setCustomW(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Height (in)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="1"
              max="24"
              value={customH}
              onChange={(e) => setCustomH(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
            />
          </label>
        </div>
      )}

      {/* Quantity — tier chips + free input */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Quantity</p>
        {cfg.qty_tiers && (
          <div className="flex flex-wrap gap-2 mb-3">
            {cfg.qty_tiers.map((tier) => {
              const active = requestedQty === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setQtyInput(String(tier))}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white font-semibold"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        )}
        <input
          type="number"
          inputMode="numeric"
          min={cfg.qty_tiers?.[0] ?? 1}
          value={qtyInput}
          onChange={(e) => setQtyInput(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
        {snap.snapped && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {snap.exceeded_max
              ? `Quantities above ${snap.to.toLocaleString()} are quoted manually — Albert will follow up. Pricing shown is for ${snap.to.toLocaleString()}.`
              : `Rounded up to ${snap.to} for pricing (closest standard run).`}
          </p>
        )}
      </div>

      {/* Design status */}
      {designOptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Artwork</p>
          <select
            value={designStatus}
            onChange={(e) => setDesignStatus(e.target.value as DesignStatus)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
          >
            {designOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Rush toggle */}
      {showRush && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRush}
            onChange={(e) => setIsRush(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
          />
          <span className="text-sm text-gray-700">Rush — same-day (+$40)</span>
        </label>
      )}

      {/* Staff-only: manual override + margin display (mode === "staff") */}
      {mode === "staff" && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Engine quote</span>
            <span className="font-mono font-semibold">
              {emittedPriceData.price != null ? `$${emittedPriceData.price.toFixed(2)}` : "—"}
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
              value={manualOverride}
              onChange={(e) => setManualOverride(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Staff-only — used when Albert quotes a custom job. Engine quote stays the baseline.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
