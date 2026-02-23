"use client";

import { useState, useEffect, useCallback } from "react";
import { addToCart } from "@/lib/cart/cart";
import type { ProductContent } from "@/lib/data/products-content";

interface Props {
  product: ProductContent;
}

export function ProductConfigurator({ product }: Props) {
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
  const [addedToCart, setAddedToCart] = useState(false);
  const [designStatus, setDesignStatus] = useState<string>("PRINT_READY");
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({});
  const [selectedTier, setSelectedTier] = useState(0);

  const effectiveWidth = isCustom
    ? parseFloat(customW) || 0
    : selectedSize.width_in;
  const effectiveHeight = isCustom
    ? parseFloat(customH) || 0
    : selectedSize.height_in;
  const effectiveQty = isCustomQty
    ? parseInt(customQty, 10) || product.qtyPresets[0]
    : qty;

  const fetchPrice = useCallback(async () => {
    if (!effectiveWidth || !effectiveHeight) return;
    setLoading(true);
    try {
      const effectiveMaterialCode = product.tierPresets
        ? product.tierPresets[selectedTier]?.material_code ?? product.material_code
        : product.material_code;

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
      }
    } catch {
      // silent — price just won't update
    } finally {
      setLoading(false);
    }
  }, [
    product.category,
    product.material_code,
    product.tierPresets,
    effectiveWidth,
    effectiveHeight,
    sides,
    effectiveQty,
    designStatus,
    selectedTier,
  ]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const addonTotal = product.addons
    ? product.addons.reduce(
        (sum, addon) => sum + (addonQtys[addon.label] || 0) * addon.unitPrice,
        0
      )
    : 0;
  const gst = price != null ? (price + addonTotal) * 0.05 : null;
  const total = price != null && gst != null ? price + addonTotal + gst : null;

  // Build a human-readable label
  const sizeLabel = isCustom
    ? `${customW}×${customH}"`
    : selectedSize.label;
  const sidesLabel = sides === 1 ? "Single-sided" : "Double-sided";
  const qtyLabel = `× ${effectiveQty}`;

  function handleAddToCart() {
    if (price == null) return;
    const designLabel =
      designStatus !== "PRINT_READY"
        ? ` | ${
            designStatus === "NEED_DESIGN"
              ? "Full Design"
              : designStatus === "NEED_REVISION"
              ? "Minor Edits"
              : "Logo Vectorization"
          }`
        : "";
    const label = `${sizeLabel} — ${sidesLabel} ${qtyLabel}${designLabel}`;
    addToCart({
      product_name: product.name,
      product_slug: product.slug,
      category: product.category,
      label,
      config: {
        category: product.category,
        material_code: product.material_code,
        width_in: effectiveWidth,
        height_in: effectiveHeight,
        sides,
        qty: effectiveQty,
        design_status: designStatus,
        addons: Object.entries(addonQtys)
          .filter(([, qty]) => qty > 0)
          .map(([addonLabel, addonQty]) => `${addonLabel} ×${addonQty}`),
      },
      sell_price: price,
      qty: effectiveQty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Product name + price anchor */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1712]">{product.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Starting from {product.fromPrice}</p>
      </div>

      {/* Tier selector (retractable banners / tiered products) */}
      {product.tierPresets && (
        <div>
          <p className="text-sm font-semibold text-[#1c1712] mb-2">Select your stand</p>
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

      {/* Size presets — only shown for sqft products without tierPresets */}
      {!product.tierPresets && product.sizePresets.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-[#1c1712] mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedSize(preset);
                  setIsCustom(false);
                }}
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

          {/* Custom size inputs */}
          {isCustom && (
            <div className="flex gap-2 mt-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Width (inches)</label>
                <input
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(e.target.value)}
                  placeholder="e.g. 30"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#16C2F3]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Height (inches)</label>
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
          <p className="text-sm font-semibold text-[#1c1712] mb-2">Sides</p>
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
        <p className="text-sm font-semibold text-[#1c1712] mb-2">Quantity</p>
        <div className="flex flex-wrap gap-2">
          {product.qtyPresets.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQty(q);
                setIsCustomQty(false);
              }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isCustomQty && qty === q
                  ? "bg-[#1c1712] text-white border-[#1c1712]"
                  : "bg-white text-[#1c1712] border-gray-200 hover:border-[#16C2F3]"
              }`}
            >
              {q}
            </button>
          ))}
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
      </div>

      {/* Add-ons (shown only when product has addons) */}
      {product.addons && product.addons.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#1c1712] mb-2">Add-ons</p>
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
        <p className="text-sm font-semibold text-[#1c1712] mb-2">Do you have a design file?</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "I have a print-ready file", value: "PRINT_READY", note: "" },
            { label: "Minor edits to my file", value: "NEED_REVISION", note: "+$35" },
            { label: "Design from scratch", value: "NEED_DESIGN", note: "+$50" },
            { label: "Logo vectorization", value: "LOGO_ONLY", note: "+$75" },
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
                <span
                  className={`text-xs ${
                    designStatus === opt.value ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {opt.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live price display */}
      <div className="bg-[#f4efe9] rounded-xl p-4">
        {loading ? (
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
        ) : price != null ? (
          <div>
            <p className="text-3xl font-bold text-[#1c1712]">
              ${price.toFixed(2)}
            </p>
            {addonTotal > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                + ${addonTotal.toFixed(2)} add-ons
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              + ${gst!.toFixed(2)} GST = <strong>${total!.toFixed(2)}</strong> total
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Enter dimensions to see price</p>
        )}
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={price == null || addedToCart}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-colors ${
            addedToCart
              ? "bg-[#8CC63E] cursor-default"
              : price == null
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#16C2F3] hover:bg-[#0fb0dd]"
          }`}
        >
          {addedToCart ? "✓ Added to Cart" : "Add to Cart →"}
        </button>

        <a
          href={`/quote-request?product=${product.slug}`}
          className="block w-full py-3 rounded-lg border border-gray-200 text-center text-sm font-medium text-gray-600 hover:border-[#16C2F3] hover:text-[#16C2F3] transition-colors"
        >
          Or get a quote by email
        </a>
      </div>

      {/* Design note */}
      <p className="text-xs text-gray-400 leading-relaxed">
        No file? Our in-house designer handles artwork from a rough sketch —
        starting at $35. Just mention it in your order notes.
      </p>
    </div>
  );
}
