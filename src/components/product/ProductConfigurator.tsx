"use client";

import Link from "next/link";
import { useState, useEffect, useLayoutEffect, useCallback, useRef, type KeyboardEvent } from "react";
import type { ProductContent } from "@/lib/data/products-content";
import type { LineItem } from "@/lib/cart/cart";
import { useToast, ToastContainer } from "@/components/ui";
import { sanitizeError } from "@/lib/errors/sanitize";
import { trackPriceCalculated } from "@/lib/analytics";
import { computeTax } from "@/lib/pricing/tax";

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
  // Slug-keyed override — no bulk break on boat numbers; each boat is its own pair.
  "boat-registration-numbers": {},
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
  "boat-registration-numbers": 1, // one boat = one pair; DECAL's default of 2 is wrong here
};

/**
 * WCAG relative-luminance contrast ratio between two hex colours (1:1 – 21:1).
 * Used to tell a boater whether their vinyl colour will actually read against
 * their hull. Contrast is a legal requirement under Canada Shipping Act s.204,
 * so this is a compliance check surfaced as a design aid, not decoration.
 */
function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [16, 8, 0]
      .map((shift) => ((n >> shift) & 255) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  };
  const [a, b] = [luminance(hexA), luminance(hexB)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Below this the number stops reading from another boat. 3:1 is the WCAG bar for
// large text, which is the closest standard analogue to 3-inch characters at range.
const HULL_CONTRAST_MIN = 3;

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
  rushFee: number; // rush portion bundled in the PST-taxable sell price (0 when not rushed)
  gst: number | null;
  pst: number | null;
  total: number | null;
  pricePerUnit: number | null;
  qtyDiscountPct: number | null;
  qtyDiscountApplied: boolean;
  minChargeApplied: boolean;
  minChargeValue: number | null;
  preMinSubtotal: number | null; // order subtotal pre-min-charge clamp (TOTAL, not per-unit)
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
  /** Selected vinyl colour label, when the product offers colour choice. */
  color?: string;
  /** Customer-entered spec values, keyed by CustomTextField.key. */
  customText?: Record<string, string>;
  /** False when a required custom text field is empty or fails its pattern. */
  customTextValid?: boolean;
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
  const [isCustomFlexSize, setIsCustomFlexSize] = useState(false);
  const [customFlexW, setCustomFlexW] = useState("");
  const [customFlexH, setCustomFlexH] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [designStatus, setDesignStatus] = useState<string>("PRINT_READY");
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [selectedTier, setSelectedTier] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colorOptions?.[0]);
  const [customText, setCustomText] = useState<Record<string, string>>({});
  const [touchedText, setTouchedText] = useState<Record<string, boolean>>({});
  const [selectedHull, setSelectedHull] = useState(product.livePreview?.hulls?.[0]);
  const [qtyDiscountPct, setQtyDiscountPct] = useState<number | null>(null);
  const [qtyDiscountApplied, setQtyDiscountApplied] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState<number | null>(null);
  const [minChargeApplied, setMinChargeApplied] = useState(false);
  const [minChargeValue, setMinChargeValue] = useState<number | null>(null);
  const [preMinSubtotal, setPreMinSubtotal] = useState<number | null>(null);
  const [rushFee, setRushFee] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0.05);
  const priceRequestSequence = useRef(0);
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const effectiveWidth = isCustomFlexSize ? parseFloat(customFlexW) || 0 : isCustom ? parseFloat(customW) || 0 : selectedSize.width_in;
  const effectiveHeight = isCustomFlexSize ? parseFloat(customFlexH) || 0 : isCustom ? parseFloat(customH) || 0 : selectedSize.height_in;
  const effectiveQty = isCustomQty ? parseInt(customQty, 10) || product.qtyPresets[0] : qty;

  const addonTotal = product.addons
    ? product.addons.reduce((sum, addon) => sum + (addonQtys[addon.label] || 0) * addon.unitPrice, 0)
    : 0;

  const effectiveMaterialCode = product.tierPresets
    ? product.tierPresets[selectedTier]?.material_code ?? product.material_code
    : selectedSize?.material_code
      ? selectedSize.material_code
      : product.material_code;

  const fetchPrice = useCallback(async (requestId: number, signal: AbortSignal) => {
    if (!effectiveWidth || !effectiveHeight) return;
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
        signal,
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
      if (signal.aborted || requestId !== priceRequestSequence.current) return;
      if (data.sell_price != null) {
        setPrice(data.sell_price);
        setLineItems(data.line_items ?? []);
        setQtyDiscountApplied(data.qty_discount_applied ?? false);
        setQtyDiscountPct(data.qty_discount_pct ?? null);
        setPricePerUnit(data.price_per_unit ?? null);
        setMinChargeApplied(data.min_charge_applied ?? false);
        setMinChargeValue(data.min_charge_value ?? null);
        setPreMinSubtotal(data.pre_min_subtotal ?? null);
        setRushFee(data.rush_fee ?? 0);
        setGstRate(data.gst_rate ?? 0.05);
        // GA4: price_calculated — fires every time a valid price is returned
        trackPriceCalculated({
          item_id: product.material_code ?? product.category,
          item_name: product.name,
          price: data.sell_price,
          quantity: effectiveQty,
        });
      } else {
        // Engine returned BLOCKED — clear stale price so old price never persists
        setPrice(null);
        setLineItems([]);
        setQtyDiscountApplied(false);
        setQtyDiscountPct(null);
        setPricePerUnit(null);
        setMinChargeApplied(false);
        setMinChargeValue(null);
        setPreMinSubtotal(null);
        setRushFee(0);
        setGstRate(0.05);
      }
    } catch (err) {
      if (signal.aborted || requestId !== priceRequestSequence.current) return;
      showToastRef.current(sanitizeError(err), "error");
    } finally {
      if (!signal.aborted && requestId === priceRequestSequence.current) setLoading(false);
    }
  }, [
    product.category,
    product.addons,
    product.material_code,
    product.name,
    effectiveMaterialCode,
    effectiveWidth,
    effectiveHeight,
    sides,
    effectiveQty,
    designStatus,
    addonQtys,
  ]);

  // Fire price fetch — debounced 300ms for custom inputs, immediate for presets
  useLayoutEffect(() => {
    const requestId = ++priceRequestSequence.current;
    setPrice(null);
    setLineItems([]);
    setQtyDiscountApplied(false);
    setQtyDiscountPct(null);
    setPricePerUnit(null);
    setMinChargeApplied(false);
    setMinChargeValue(null);
    setPreMinSubtotal(null);
    setRushFee(0);
    if (!effectiveWidth || !effectiveHeight) {
      setLoading(false);
      return;
    }
    // Invalidate the previous quote before the browser can paint a newly
    // selected configuration. This prevents a fast Add to Cart click from
    // pairing stale pricing with the new options.
    setLoading(true);
    const controller = new AbortController();
    const delay = isCustom || isCustomQty || isCustomFlexSize ? 300 : 0;
    const timer = setTimeout(() => void fetchPrice(requestId, controller.signal), delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Depend on the actual price inputs (sides, qty, dimensions, material, design)
    // so a sides-only toggle refetches. Previously only `fetchPrice` + custom flags
    // were listed, so single↔double never re-ran the estimate and the price stuck.
  }, [fetchPrice, sides, effectiveQty, effectiveWidth, effectiveHeight, effectiveMaterialCode, designStatus, isCustom, isCustomQty, isCustomFlexSize]);

  function handleQuantityRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const optionCount = product.qtyPresets.length + 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % optionCount;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + optionCount) % optionCount;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = optionCount - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    if (nextIndex === product.qtyPresets.length) {
      setCustomQty(String(qty));
      setIsCustomQty(true);
    } else {
      setQty(product.qtyPresets[nextIndex]);
      setIsCustomQty(false);
    }
    const group = event.currentTarget.closest('[role="radiogroup"]');
    requestAnimationFrame(() => group?.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex]?.focus());
  }

  // Bubble price data to parent
  // NOTE: price is already the engine's sell_price including all addons — do NOT add addonTotal again
  useEffect(() => {
    const designFee = DESIGN_FEES[designStatus] ?? 0;
    const taxes = price != null
      ? computeTax({ sell_price: price, design_fee: designFee, rush_fee: rushFee, gst_rate: gstRate })
      : null;
    onPriceChange?.({
      price,
      loading,
      addonTotal,
      designFee,
      rushFee,
      gst: taxes?.gst ?? null,
      pst: taxes?.pst ?? null,
      total: taxes?.total ?? null,
      pricePerUnit,
      qtyDiscountPct,
      qtyDiscountApplied,
      minChargeApplied,
      minChargeValue,
      preMinSubtotal,
      lineItems,
    });
  }, [price, loading, addonTotal, designStatus, rushFee, gstRate, onPriceChange, pricePerUnit, qtyDiscountPct, qtyDiscountApplied, minChargeApplied, minChargeValue, preMinSubtotal, lineItems]);

  // Only the fields relevant to the selected size are shown — and only those are
  // validated. A hidden field must never block Add to Cart.
  const activeTextFields = (product.customTextFields ?? []).filter(
    (f) => !f.appliesToMaterial || f.appliesToMaterial.includes(effectiveMaterialCode ?? "")
  );

  // Validate custom text fields — a required field must be non-empty and, when a
  // pattern is declared, match it. Drives both the inline error and the parent's
  // Add-to-Cart gate, so a boat decal can never be ordered without its number.
  const textFieldError = useCallback((field: NonNullable<ProductContent["customTextFields"]>[number]) => {
    const value = (customText[field.key] ?? "").trim();
    if (!value) return field.required ? "Required" : null;
    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      return field.patternHint ?? "Check this value";
    }
    return null;
  }, [customText]);

  const customTextValid = activeTextFields.every((f) => !textFieldError(f));

  // Normalize a typed value to exactly what gets cut. "compact" closes up a licence
  // number ("SK 1234567" → "SK1234567") so production never depends on how the
  // customer happened to space it. The preview renders this same normalized string,
  // so what they see is what they get.
  const normalizeText = useCallback(
    (field: NonNullable<ProductContent["customTextFields"]>[number], raw: string) => {
      const trimmed = raw.trim();
      return field.transform === "compact"
        ? trimmed.replace(/\s+/g, "").toUpperCase()
        : trimmed;
    },
    []
  );

  // Only report values for fields actually in play, so a stale boat name from a
  // previous size selection can't leak into the cart label.
  const activeCustomText = Object.fromEntries(
    activeTextFields
      .map((f) => [f.key, normalizeText(f, customText[f.key] ?? "")])
      .filter(([, v]) => v)
  ) as Record<string, string>;

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
      sizeLabel: isCustomFlexSize ? `${customFlexW}″×${customFlexH}″` : isCustom ? `${customW}″×${customH}″` : selectedSize.label,
      sidesLabel: product.category === "BOOKLET" ? "~80 pages" : sides === 1 ? "Single-sided" : "Double-sided",
      color: selectedColor?.label,
      customText: activeCustomText,
      customTextValid,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveWidth, effectiveHeight, effectiveQty, sides, addonQtys, designStatus, selectedTier, isCustom, customW, customH, selectedSize.label, selectedColor, customText, customTextValid, effectiveMaterialCode]);

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
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="tier-label">Select Your Stand</p>
          <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="tier-label">
            {product.tierPresets.map((tier, i) => (
              <button
                key={tier.label}
                onClick={() => setSelectedTier(i)}
                aria-pressed={selectedTier === i}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors active:scale-[0.96] ${
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
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="size-label">{product.sizeSectionLabel ?? "Size"}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="size-label">
            {product.sizePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setSelectedSize(preset); setIsCustom(false); }}
                aria-pressed={!isCustom && selectedSize.label === preset.label}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
                  !isCustom && selectedSize.label === preset.label
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                {preset.label}
              </button>
            ))}
            {!product.lotPriced && (
              <button
                onClick={() => setIsCustom(true)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
                  isCustom
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                Custom
              </button>
            )}
          </div>
          {!product.lotPriced && isCustom && (
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
          {!product.lotPriced && isCustom && price === null && !loading && customW && customH && (
            <p className="mt-2 text-xs text-gray-500">
              Custom sizes are available —{" "}
              <a href="tel:+13069548688" className="text-[#16C2F3] font-medium hover:underline">
                call (306) 954-8688
              </a>{" "}
              or{" "}
              <Link href="/products" className="text-[#16C2F3] font-medium hover:underline">
                request a quote
              </Link>.
            </p>
          )}
        </div>
      )}

      {/* Flex size section — for products where sizePresets are repurposed (e.g. paper weight on flyers) */}
      {product.showCustomSize && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Size</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsCustomFlexSize(false)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
                !isCustomFlexSize
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              Letter 8.5×11″
            </button>
            {!product.lotPriced && (
              <button
                onClick={() => setIsCustomFlexSize(true)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
                  isCustomFlexSize
                    ? "bg-[#1c1712] text-white border-[#1c1712]"
                    : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                }`}
              >
                Custom
              </button>
            )}
          </div>
          {!product.lotPriced && isCustomFlexSize && (
            <div className="flex gap-2 mt-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Width (inches)</label>
                <input
                  type="number"
                  value={customFlexW}
                  onChange={(e) => setCustomFlexW(e.target.value)}
                  placeholder="e.g. 5.5"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#16C2F3]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Height (inches)</label>
                <input
                  type="number"
                  value={customFlexH}
                  onChange={(e) => setCustomFlexH(e.target.value)}
                  placeholder="e.g. 8.5"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#16C2F3]"
                />
              </div>
            </div>
          )}
          {!product.lotPriced && isCustomFlexSize && price === null && !loading && customFlexW && customFlexH && (
            <p className="mt-2 text-xs text-gray-500">
              Custom sizes are available —{" "}
              <a href="tel:+13069548688" className="text-[#16C2F3] font-medium hover:underline">
                call (306) 954-8688
              </a>{" "}
              or{" "}
              <Link href="/products" className="text-[#16C2F3] font-medium hover:underline">
                request a quote
              </Link>.
            </p>
          )}
        </div>
      )}

      {/* Sides toggle */}
      {product.sideOptions && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="sides-label">Sides</p>
          <div className="flex gap-2" role="radiogroup" aria-labelledby="sides-label">
            {([1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSides(s)}
                aria-pressed={sides === s}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.95] ${
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

      {/* Vinyl colour — spec only, never affects price */}
      {product.colorOptions && product.colorOptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="colour-label">
            Colour <span className="normal-case tracking-normal text-gray-300 font-normal">· all the same price</span>
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="colour-label">
            {product.colorOptions.map((c) => {
              const active = selectedColor?.label === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={c.note ? `${c.label} — ${c.note}` : c.label}
                  onClick={() => setSelectedColor(c)}
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm font-medium transition-colors active:scale-[0.94] ${
                    active
                      ? "bg-[#1c1712] text-white border-[#1c1712]"
                      : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
                  }`}
                >
                  <span
                    aria-hidden
                    className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
          {selectedColor?.note && (
            <p className="mt-2 text-xs text-gray-500">{selectedColor.note}.</p>
          )}
        </div>
      )}

      {/* Customer-supplied spec text (e.g. boat licence number) */}
      {activeTextFields.length > 0 && (
        <div className="space-y-4">
          {activeTextFields.map((field) => {
            const error = textFieldError(field);
            const showError = touchedText[field.key] && error;
            return (
              <div key={field.key}>
                <label
                  htmlFor={`ctf-${field.key}`}
                  className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 block"
                >
                  {field.label}
                  {field.required && <span className="text-[#e63020] ml-1" aria-hidden>*</span>}
                </label>
                <input
                  id={`ctf-${field.key}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={field.maxLength}
                  required={field.required}
                  aria-required={field.required}
                  aria-invalid={showError ? true : undefined}
                  aria-describedby={showError ? `ctf-${field.key}-err` : field.help ? `ctf-${field.key}-help` : undefined}
                  value={customText[field.key] ?? ""}
                  onChange={(e) => setCustomText((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  onBlur={() => setTouchedText((prev) => ({ ...prev, [field.key]: true }))}
                  placeholder={field.placeholder}
                  className={`w-full border rounded-lg px-3 py-2.5 text-base font-mono tracking-wide uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-300 focus:outline-none transition-colors ${
                    showError
                      ? "border-[#e63020] focus:border-[#e63020]"
                      : "border-gray-200 focus:border-[#16C2F3]"
                  }`}
                />
                {showError ? (
                  <p id={`ctf-${field.key}-err`} role="alert" className="mt-1.5 text-xs text-[#e63020]">
                    {error}
                  </p>
                ) : field.help ? (
                  <p id={`ctf-${field.key}-help`} className="mt-1.5 text-xs text-gray-500">
                    {field.help}
                  </p>
                ) : null}
              </div>
            );
          })}

          {/* Live decal preview — what they typed, in the colour and height they picked */}
          {product.livePreview && (() => {
            const previewField = activeTextFields.find((f) => f.preview);
            // Preview the NORMALIZED value — this is the exact string that gets cut,
            // so a typed "sk 1234567" must show as "SK1234567" here, not with the space.
            const raw = previewField ? normalizeText(previewField, customText[previewField.key] ?? "") : "";
            const text = (raw || previewField?.placeholder || "").toUpperCase();
            const swatch = selectedColor?.hex ?? "#111111";
            const isPlaceholder = !raw;
            const hulls = product.livePreview.hulls;
            const hull = selectedHull ?? hulls?.[0];
            const hullHex = hull?.hex ?? "#DCE2E8";
            const ratio = contrastRatio(swatch, hullHex);
            const lowContrast = ratio < HULL_CONTRAST_MIN;
            const stage = hull?.sheen
              // Brushed-metal bands so bare aluminum doesn't read as flat grey.
              ? `linear-gradient(100deg, ${hullHex} 0%, #C6CBD0 18%, ${hullHex} 34%, #9BA1A7 55%, ${hullHex} 72%, #CDD2D7 88%, ${hullHex} 100%)`
              : `linear-gradient(160deg, ${hullHex} 0%, ${hullHex}E6 100%)`;
            return (
              <div>
                {hulls && hulls.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2" id="hull-label">
                      {product.livePreview.hullPickerLabel ?? "Backdrop"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-labelledby="hull-label">
                      {hulls.map((h) => {
                        const active = hull?.label === h.label;
                        return (
                          <button
                            key={h.label}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={h.label}
                            title={h.label}
                            onClick={() => setSelectedHull(h)}
                            className={`w-9 h-9 rounded-lg border-2 transition-transform active:scale-90 ${
                              active ? "border-[#1c1712] scale-110" : "border-gray-200 hover:border-[#16C2F3]"
                            }`}
                            style={{
                              background: h.sheen
                                ? `linear-gradient(120deg,${h.hex} 0%,#D3D8DD 45%,${h.hex} 100%)`
                                : h.hex,
                            }}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  {product.livePreview.hullLabel}
                </p>
                <div className="rounded-xl border border-gray-300 overflow-hidden" style={{ background: stage }}>
                  <div className="px-4 py-8 flex items-center justify-center min-h-[104px]">
                    <span
                      className="font-extrabold tracking-[0.12em] leading-none text-center break-all"
                      style={{
                        color: swatch,
                        fontSize: "clamp(1.35rem, 6.5vw, 2.4rem)",
                        opacity: isPlaceholder ? 0.4 : 1,
                      }}
                    >
                      {text}
                    </span>
                  </div>
                </div>
                {lowContrast && !isPlaceholder ? (
                  <p role="status" className="mt-2 flex gap-2 text-xs leading-relaxed text-[#b42318]">
                    <span aria-hidden>⚠</span>
                    <span>
                      <strong>{selectedColor?.label}</strong> barely stands out against a{" "}
                      {hull?.label.toLowerCase()} hull. Transport Canada requires a colour that
                      contrasts with the hull — pick a lighter or darker vinyl so the number reads
                      from another boat.
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    {isPlaceholder
                      ? "Type your number above to see it on your hull."
                      : `${selectedColor?.label ?? "Black"} vinyl on a ${hull?.label.toLowerCase() ?? "light"} hull · ${selectedSize.height_in}″ characters · cut exactly as shown.`}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="qty-label">Quantity</p>
        <div className="flex flex-wrap gap-3 pt-4" role="radiogroup" aria-labelledby="qty-label">
          {product.qtyPresets.map((q) => {
            // Slug key wins over category key, so products that share a category
            // but not a typical order size can override it (e.g. boat registration
            // numbers sit in DECAL, but one boat — not two — is the common order).
            const hint = (BULK_HINTS[product.slug] ?? BULK_HINTS[product.category])?.[q];
            const isMostPopular = (MOST_POPULAR_QTY[product.slug] ?? MOST_POPULAR_QTY[product.category]) === q;
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
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => { setQty(q); setIsCustomQty(false); }}
                  onKeyDown={(event) => handleQuantityRadioKeyDown(event, product.qtyPresets.indexOf(q))}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
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
              role="radio"
              aria-checked={isCustomQty}
              tabIndex={isCustomQty ? 0 : -1}
              onClick={() => { setCustomQty(String(qty)); setIsCustomQty(true); }}
              onKeyDown={(event) => handleQuantityRadioKeyDown(event, product.qtyPresets.length)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors active:scale-[0.94] ${
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
        {isCustomQty && price === null && !loading && customQty && (
          <p className="mt-2 text-xs text-gray-500">
            Need a quote for {customQty}?{" "}
            <a href="tel:+13069548688" className="text-[#16C2F3] font-medium hover:underline">
              Call (306) 954-8688
            </a>{" "}
            or{" "}
            <Link href="/products" className="text-[#16C2F3] font-medium hover:underline">
              get a quote online
            </Link>.
          </p>
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
            <span className="text-xs text-amber-700 font-medium">${pricePerUnit.toFixed(2)}/unit (small-order fee applies at checkout)</span>
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
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3" id="design-label">Do You Have a Design File?</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="design-label">
          {[
            { label: "I have a print-ready file", value: "PRINT_READY", note: "" },
            { label: "Minor edits to my file", value: "MINOR_EDIT", note: "+$35" },
            { label: "Design from scratch", value: "FULL_DESIGN", note: "+$50" },
            { label: "Logo vectorization", value: "LOGO_RECREATION", note: "+$75" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDesignStatus(opt.value)}
              aria-pressed={designStatus === opt.value}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors active:scale-[0.97] ${
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
