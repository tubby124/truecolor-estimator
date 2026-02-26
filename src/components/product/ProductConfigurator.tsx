"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductContent } from "@/lib/data/products-content";
import type { LineItem } from "@/lib/cart/cart";
import { useToast, ToastContainer } from "@/components/ui";
import { sanitizeError } from "@/lib/errors/sanitize";

const BULK_HINTS: Record<string, Record<number, string>> = {
  SIGN:           { 5: "save 8%", 10: "save 17%", 25: "save 23%" },
  BANNER:         { 5: "save 5%", 10: "save 10%", 25: "save 15%" },
  RIGID:          { 5: "save 3%", 10: "save 5%",  25: "save 8%"  },
  FOAMBOARD:      { 5: "save 8%", 10: "save 12%", 25: "save 15%" },
  MAGNET:         { 5: "save 5%", 10: "save 10%", 25: "save 15%" },
  DECAL:          { 5: "save 5%", 10: "save 10%"                  },
  VINYL_LETTERING:{ 5: "save 8%"                                   },
  // Lot-priced: savings vs qty 100 (minimum lot common to all sizes/papers)
  STICKER:        { 100: "save 16%", 250: "save 32%", 500: "save 50%", 1000: "save 66%" }, // single size — exact
  POSTCARD:       { 250: "save 20%+", 500: "save 35%+", 1000: "save 50%+" },               // conservative across 4×6/5×7/3×4
  BROCHURE:       { 250: "save 40%+", 500: "save 44%+" },                                  // verified tri-fold + half-fold
  BUSINESS_CARD:  { 500: "save 25%+", 1000: "save 35%+" }, // Spicer-verified 2026-02-24
  FLYER:          { 500: "save 30%+", 1000: "save 40%+" },                                 // covers 80lb AND 100lb paper
};

const MOST_POPULAR_QTY: Record<string, number> = {
  SIGN:           10,
  BANNER:          5,
  RIGID:          10,
  FOAMBOARD:      10,
  MAGNET:          5,
  DECAL:           2,
  VINYL_LETTERING: 1,
  STICKER:         100,
  POSTCARD:        250,
  BROCHURE:        250,
  BUSINESS_CARD:   500,
  FLYER:           500,
};

const DESIGN_FEES: Record<string, number> = {
  PRINT_READY: 0,
  MINOR_EDIT: 35,
  FULL_DESIGN: 50,
  LOGO_RECREATION: 75,
};

// Grommet estimator — mirrors engine formula (spacing + min from config.v1.csv)
const GROMMET_SPACING_FT = 2;
const GROMMET_MIN_COUNT = 4;
function estimateGrommetCount(widthIn: number, heightIn: number): number {
  if (!widthIn || !heightIn) return GROMMET_MIN_COUNT;
  const perimeterFt = 2 * (widthIn / 12 + heightIn / 12);
  return Math.max(GROMMET_MIN_COUNT, Math.ceil(perimeterFt / GROMMET_SPACING_FT));
}

export interface PriceData {
  price: number | null;
  loading: boolean;
  addonTotal: number;
  designFee: number;
  gst: number | null;
  total: number | null;
  pricePerUnit: number | null;
  qtyDiscountPct: number | null;
  qtyDiscountApplied: boolean;
  minChargeApplied: boolean;
  minChargeValue: number | null;
  lineItems: LineItem[]; // engine breakdown: base + addons
}

export interface ConfigData {
  widthIn: number;
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  addonQtys: Record<string, number>;
  designStatus: string;
  materialCode: string;
  sizeLabel: string;
  sidesLabel: string;
}

interface Props {
  product: ProductContent;
  onPriceChange?: (data: PriceData) => void;
  onConfigChange?: (config: ConfigData) => void;
}

export function ProductConfigurator({ product, onPriceChange, onConfigChange }: Props) {
  const { toasts, showToast, dismissToast } = useToast();
  const [selectedSize, setSelectedSize] = useState(product.sizePresets[0]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [sides, setSides] = useState<1 | 2>(product.defaultSides);
  const [qty, setQty] = useState(product.qtyPresets[0]);
  const [customQty, setCustomQty] = useState("");
  const [isCustomQty, setIsCustomQty] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [designStatus, setDesignStatus] = useState<string>("PRINT_READY");
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [selectedTier, setSelectedTier] = useState(0);
  const [qtyDiscountPct, setQtyDiscountPct] = useState<number | null>(null);
  const [qtyDiscountApplied, setQtyDiscountApplied] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [minChargeApplied, setMinChargeApplied] = useState(false);
  const [minChargeValue, setMinChargeValue] = useState<number | null>(null);

  const effectiveWidth = isCustom ? parseFloat(customW) || 0 : selectedSize.width_in;
  const effectiveHeight = isCustom ? parseFloat(customH) || 0 : selectedSize.height_in;
  const effectiveQty = isCustomQty ? parseInt(customQty, 10) || product.qtyPresets[0] : qty;

  const addonTotal = product.addons
    ? product.addons.reduce((sum, addon) => sum + (addonQtys[addon.label] || 0) * addon.unitPrice, 0)
    : 0;

  const effectiveMaterialCode = product.tierPresets
    ? product.tierPresets[selectedTier]?.material_code ?? product.material_code
    : (!isCustom && selectedSize?.material_code)
      ? selectedSize.material_code
      : product.material_code;

  const fetchPrice = useCallback(async () => {
    if (!effectiveWidth || !effectiveHeight) return;
    setLoading(true);
    // Build engine addon codes from active addonQtys (uses engineCode field from products-content.ts)
    const engineAddons = product.addons
      ? product.addons
          .filter((addon) => addon.engineCode && (addonQtys[addon.label] || 0) > 0)
          .map((addon) => addon.engineCode as string)
      : [];
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: product.category,
          material_code: effectiveMaterialCode,
          width_in: effectiveWidth,
          height_in: effectiveHeight,
          sides,
          qty: effectiveQty,
          design_status: designStatus,
          addons: engineAddons.length > 0 ? engineAddons : undefined,
        }),
      });
      const data = await res.json();
      if (data.sell_price != null) {
        setPrice(data.sell_price);
        setLineItems(data.line_items ?? []);
        setQtyDiscountApplied(data.qty_discount_applied ?? false);
        setQtyDiscountPct(data.qty_discount_pct ?? null);
        setPricePerUnit(data.price_per_unit ?? null);
        setMinChargeApplied(data.min_charge_applied ?? false);
        setMinChargeValue(data.min_charge_value ?? null);
      }
    } catch (err) {
      showToast(sanitizeError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [
    product.category,
    product.addons,
    effectiveMaterialCode,
    effectiveWidth,
    effectiveHeight,
    sides,
    effectiveQty,
    designStatus,
    addonQtys,
  ]);

  // Fire price fetch — debounced 300ms for custom inputs, immediate for presets
  useEffect(() => {
    if (!effectiveWidth || !effectiveHeight) return;
    const delay = isCustom || isCustomQty ? 300 : 0;
    const timer = setTimeout(fetchPrice, delay);
    return () => clearTimeout(timer);
  }, [fetchPrice, isCustom, isCustomQty]);

  // Bubble price data to parent
  // NOTE: price is already the engine's sell_price including all addons — do NOT add addonTotal again
  useEffect(() => {
    const gstCalc = price != null ? price * 0.05 : null;
    const totalCalc = price != null && gstCalc != null ? price + gstCalc : null;
    onPriceChange?.({
      price,
      loading,
      addonTotal,
      designFee: DESIGN_FEES[designStatus] ?? 0,
      gst: gstCalc,
      total: totalCalc,
      pricePerUnit,
      qtyDiscountPct,
      qtyDiscountApplied,
      minChargeApplied,
      minChargeValue,
      lineItems,
    });
  }, [price, loading, addonTotal, designStatus, onPriceChange, pricePerUnit, qtyDiscountPct, qtyDiscountApplied, minChargeApplied, minChargeValue, lineItems]);

  // Bubble config to parent (for proof + cart)
  useEffect(() => {
    onConfigChange?.({
      widthIn: effectiveWidth,
      heightIn: effectiveHeight,
      qty: effectiveQty,
      sides,
      addonQtys,
      designStatus,
      materialCode: effectiveMaterialCode ?? "",
      sizeLabel: isCustom ? `${customW}″×${customH}″` : selectedSize.label,
      sidesLabel: sides === 1 ? "Single-sided" : "Double-sided",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveWidth, effectiveHeight, effectiveQty, sides, addonQtys, designStatus, selectedTier, isCustom, customW, customH, selectedSize.label]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Product name */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1712]">{product.name}</h1>
        <p className="text-gray-400 text-sm mt-1">Starting from {product.fromPrice}</p>
      </div>

      {/* Tier selector */}
      {product.tierPresets && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Select Your Stand</p>
          <div className="flex flex-col gap-2">
            {product.tierPresets.map((tier, i) => (
              <button
                key={tier.label}
                onClick={() => setSelectedTier(i)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                  selectedTier === i
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size presets */}
      {!product.tierPresets && product.sizePresets.length > 1 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setSelectedSize(preset); setIsCustom(false); }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !isCustom && selectedSize.label === preset.label
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isCustom
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <div className="flex gap-2 mt-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Width (inches)</label>
                <input
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  placeholder="e.g. 30"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#16C2F3]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Height (inches)</label>
                <input
                  type="number"
                  value={customH}
                  onChange={(e) => setCustomH(e.target.value)}
                  placeholder="e.g. 48"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#16C2F3]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sides toggle */}
      {product.sideOptions && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Sides</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSides(s)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  sides === s
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                {s === 1 ? "Single-sided" : "Double-sided"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Quantity</p>
        <div className="flex flex-wrap gap-3 pt-4">
          {product.qtyPresets.map((q) => {
            const hint = BULK_HINTS[product.category]?.[q];
            const isMostPopular = MOST_POPULAR_QTY[product.category] === q;
            const isSelected = !isCustomQty && qty === q;
            const hasDiscount = !!hint;
            return (
              <div key={q} className="relative flex flex-col items-center">
                {isMostPopular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-100 border border-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap z-10">
                    Popular
                  </span>
                )}
                <button
                  onClick={() => { setQty(q); setIsCustomQty(false); }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isSelected && hasDiscount
                      ? "border-2 border-green-500 bg-green-50 text-green-800"
                      : isSelected
                      ? "bg-[#1c1712] text-white border-[#1c1712]"
                      : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                  }`}
                >
                  {q}
                </button>
                {hint && (
                  <span className="mt-1 text-[11px] text-green-600 font-medium leading-tight">
                    {hint}
                  </span>
                )}
              </div>
            );
          })}
          {!product.lotPriced && (
            <div className="flex flex-col items-center">
              <button
                onClick={() => { setCustomQty(String(qty)); setIsCustomQty(true); }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isCustomQty
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                Custom
              </button>
            </div>
          )}
        </div>
        {!product.lotPriced && isCustomQty && (
          <input
            type="number"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            placeholder="Enter quantity"
            min={1}
            className="mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-[#16C2F3]"
          />
        )}
        {product.lotPriced && (
          <p className="mt-3 text-xs text-gray-400">
            Need more than {Math.max(...product.qtyPresets).toLocaleString()}?{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] font-medium hover:underline">
              Call (306) 954-8688
            </a>{" "}
            for a custom quote.
          </p>
        )}
        {qtyDiscountApplied && pricePerUnit != null && effectiveQty > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {qtyDiscountPct}% bulk discount
            </span>
            <span className="text-xs text-green-700 font-medium">${pricePerUnit.toFixed(2)}/unit</span>
          </div>
        )}
        {!qtyDiscountApplied && minChargeApplied && pricePerUnit != null && effectiveQty > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-amber-700 font-medium">${pricePerUnit.toFixed(2)}/unit (min order applies)</span>
          </div>
        )}
        {/* Per-unit display for lot-priced products (no engine discount, no min charge) */}
        {!qtyDiscountApplied && !minChargeApplied && effectiveQty > 1 && price !== null && (
          <p className="text-xs text-gray-400 mt-1 font-medium">
            ${(price / effectiveQty).toFixed(2)} / unit
          </p>
        )}
      </div>

      {/* Add-ons */}
      {product.addons && product.addons.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Add-ons</p>
          <div className="space-y-2">
            {product.addons.map((addon) => {
              const isGrommet = addon.engineCode === "GROMMETS";
              const hasDims = effectiveWidth > 0 && effectiveHeight > 0;
              const grommetCount = isGrommet && hasDims ? estimateGrommetCount(effectiveWidth, effectiveHeight) : null;
              const grommetTotal = grommetCount != null ? grommetCount * addon.unitPrice : null;
              const isAddonActive = (addonQtys[addon.label] || 0) > 0;
              return (
                <div
                  key={addon.label}
                  className="border border-gray-200 rounded-lg px-4 py-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#1c1712]">{addon.label}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {isGrommet ? "Auto-calculated · $2.50 each" : `$${addon.unitPrice.toFixed(2)} each`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setAddonQtys((prev) => ({
                            ...prev,
                            [addon.label]: Math.max(0, (prev[addon.label] || 0) - (addon.step || 1)),
                          }))
                        }
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-lg leading-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {addonQtys[addon.label] || 0}
                      </span>
                      <button
                        onClick={() =>
                          setAddonQtys((prev) => ({
                            ...prev,
                            [addon.label]: (prev[addon.label] || 0) + (addon.step || 1),
                          }))
                        }
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-lg leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Grommet count estimate (live — updates as dimensions change) */}
                  {isGrommet && hasDims && !isAddonActive && (
                    <p className="text-xs text-[#16C2F3]">
                      For your {effectiveWidth}×{effectiveHeight}″ sign: ~{grommetCount} grommets (${grommetTotal!.toFixed(2)} total)
                    </p>
                  )}
                  {/* Grommet note when active (engine has the exact count in line_items) */}
                  {isGrommet && isAddonActive && (
                    <p className="text-xs text-green-600">
                      Count auto-calculated from your sign size — see price breakdown below
                    </p>
                  )}
                  {/* Static tip for non-grommet addons, or grommet tip when no dims */}
                  {addon.tip && !(isGrommet && hasDims) && (
                    <p className="text-xs text-gray-400">{addon.tip}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Design help */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Do You Have a Design File?</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "I have a print-ready file", value: "PRINT_READY", note: "" },
            { label: "Minor edits to my file", value: "MINOR_EDIT", note: "+$35" },
            { label: "Design from scratch", value: "FULL_DESIGN", note: "+$50" },
            { label: "Logo vectorization", value: "LOGO_RECREATION", note: "+$75" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDesignStatus(opt.value)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                designStatus === opt.value
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              <span>{opt.label}</span>
              {opt.note && (
                <span className={`text-xs ${designStatus === opt.value ? "text-blue-200" : "text-gray-400"}`}>
                  {opt.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
