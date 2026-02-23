"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductContent } from "@/lib/data/products-content";

const BULK_HINTS: Record<string, Record<number, string>> = {
  SIGN:      { 5: "save 8%", 10: "save 17%", 25: "save 23%" },
  BANNER:    { 5: "save 5%", 10: "save 10%", 25: "save 15%" },
  RIGID:     { 5: "save 3%", 10: "save 5%",  25: "save 8%"  },
  FOAMBOARD: { 5: "save 8%", 10: "save 12%", 25: "save 15%" },
};

const MOST_POPULAR_QTY: Record<string, number> = {
  SIGN: 10,
  BANNER: 5,
  RIGID: 10,
  FOAMBOARD: 10,
};

const DESIGN_FEES: Record<string, number> = {
  PRINT_READY: 0,
  MINOR_EDIT: 35,
  FULL_DESIGN: 50,
  LOGO_RECREATION: 75,
};

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
  const [selectedSize, setSelectedSize] = useState(product.sizePresets[0]);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [sides, setSides] = useState<1 | 2>(product.defaultSides);
  const [qty, setQty] = useState(product.qtyPresets[0]);
  const [customQty, setCustomQty] = useState("");
  const [isCustomQty, setIsCustomQty] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [designStatus, setDesignStatus] = useState<string>("PRINT_READY");
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [selectedTier, setSelectedTier] = useState(0);
  const [qtyDiscountPct, setQtyDiscountPct] = useState<number | null>(null);
  const [qtyDiscountApplied, setQtyDiscountApplied] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);

  const effectiveWidth = isCustom ? parseFloat(customW) || 0 : selectedSize.width_in;
  const effectiveHeight = isCustom ? parseFloat(customH) || 0 : selectedSize.height_in;
  const effectiveQty = isCustomQty ? parseInt(customQty, 10) || product.qtyPresets[0] : qty;

  const addonTotal = product.addons
    ? product.addons.reduce((sum, addon) => sum + (addonQtys[addon.label] || 0) * addon.unitPrice, 0)
    : 0;

  const effectiveMaterialCode = product.tierPresets
    ? product.tierPresets[selectedTier]?.material_code ?? product.material_code
    : product.material_code;

  const fetchPrice = useCallback(async () => {
    if (!effectiveWidth || !effectiveHeight) return;
    setLoading(true);
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
        }),
      });
      const data = await res.json();
      if (data.sell_price != null) {
        setPrice(data.sell_price);
        setQtyDiscountApplied(data.qty_discount_applied ?? false);
        setQtyDiscountPct(data.qty_discount_pct ?? null);
        setPricePerUnit(data.price_per_unit ?? null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [
    product.category,
    effectiveMaterialCode,
    effectiveWidth,
    effectiveHeight,
    sides,
    effectiveQty,
    designStatus,
  ]);

  // Fire price fetch — debounced 300ms for custom inputs, immediate for presets
  useEffect(() => {
    if (!effectiveWidth || !effectiveHeight) return;
    const delay = isCustom || isCustomQty ? 300 : 0;
    const timer = setTimeout(fetchPrice, delay);
    return () => clearTimeout(timer);
  }, [fetchPrice, isCustom, isCustomQty]);

  // Bubble price data to parent
  useEffect(() => {
    const gstCalc = price != null ? (price + addonTotal) * 0.05 : null;
    const totalCalc = price != null && gstCalc != null ? price + addonTotal + gstCalc : null;
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
    });
  }, [price, loading, addonTotal, designStatus, onPriceChange, pricePerUnit, qtyDiscountPct, qtyDiscountApplied]);

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
          <div className="flex flex-col items-center">
            <button
              onClick={() => setIsCustomQty(true)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isCustomQty
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              Custom
            </button>
          </div>
        </div>
        {isCustomQty && (
          <input
            type="number"
            value={customQty}
            onChange={(e) => setCustomQty(e.target.value)}
            placeholder="Enter quantity"
            min={1}
            className="mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-[#16C2F3]"
          />
        )}
        {qtyDiscountApplied && pricePerUnit != null && effectiveQty > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {qtyDiscountPct}% bulk discount
            </span>
            <span className="text-xs text-green-700 font-medium">${pricePerUnit.toFixed(2)}/unit</span>
          </div>
        )}
      </div>

      {/* Add-ons */}
      {product.addons && product.addons.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Add-ons</p>
          <div className="space-y-2">
            {product.addons.map((addon) => (
              <div
                key={addon.label}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-[#1c1712]">{addon.label}</span>
                  <span className="text-xs text-gray-400 ml-2">${addon.unitPrice.toFixed(2)} each</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setAddonQtys((prev) => ({
                        ...prev,
                        [addon.label]: Math.max(0, (prev[addon.label] || 0) - (addon.step || 1)),
                      }))
                    }
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-lg leading-none"
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
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
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
