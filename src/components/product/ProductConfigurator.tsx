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
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: product.category,
          material_code: product.material_code,
          width_in: effectiveWidth,
          height_in: effectiveHeight,
          sides,
          qty: effectiveQty,
          design_status: "PRINT_READY",
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
    effectiveWidth,
    effectiveHeight,
    sides,
    effectiveQty,
  ]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const gst = price != null ? price * 0.05 : null;
  const total = price != null && gst != null ? price + gst : null;

  // Build a human-readable label
  const sizeLabel = isCustom
    ? `${customW}×${customH}"`
    : selectedSize.label;
  const sidesLabel = sides === 1 ? "Single-sided" : "Double-sided";
  const qtyLabel = `× ${effectiveQty}`;

  function handleAddToCart() {
    if (price == null) return;
    addToCart({
      product_name: product.name,
      product_slug: product.slug,
      category: product.category,
      label: `${sizeLabel} — ${sidesLabel} ${qtyLabel}`,
      config: {
        category: product.category,
        material_code: product.material_code,
        width_in: effectiveWidth,
        height_in: effectiveHeight,
        sides,
        qty: effectiveQty,
        design_status: "PRINT_READY",
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

      {/* Size presets — only shown for sqft products */}
      {product.sizePresets.length > 1 && (
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

      {/* Live price display */}
      <div className="bg-[#f4efe9] rounded-xl p-4">
        {loading ? (
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
        ) : price != null ? (
          <div>
            <p className="text-3xl font-bold text-[#1c1712]">
              ${price.toFixed(2)}
            </p>
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
          href="/quote"
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
