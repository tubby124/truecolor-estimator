"use client";

import { useState, useCallback } from "react";
import { addToCart } from "@/lib/cart/cart";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductConfigurator, type PriceData, type ConfigData } from "@/components/product/ProductConfigurator";
import { PriceSummary } from "@/components/product/PriceSummary";
import type { ProductContent } from "@/lib/data/products-content";
import type { Category } from "@/lib/data/types";

// Friendly material labels shown in the customer proof
const MATERIAL_LABELS: Record<string, string> = {
  "vinyl-banners":       "13oz Vinyl Banner",
  "coroplast-signs":     "4mm Coroplast",
  "acp-signs":           "3mm Aluminum",
  "vehicle-magnets":     "30mil Magnet",
  "flyers":              "80lb Gloss Text",
  "business-cards":      "14pt Gloss Card",
  "retractable-banners": "Premium Vinyl",
  "window-decals":       "Adhesive Vinyl",
};

interface Props {
  product: ProductContent;
}

const EMPTY_PRICE: PriceData = {
  price: null, loading: false, addonTotal: 0, designFee: 0, gst: null, total: null,
  pricePerUnit: null, qtyDiscountPct: null, qtyDiscountApplied: false,
};

const EMPTY_CONFIG: ConfigData = {
  widthIn: 0, heightIn: 0, qty: 1, sides: 1,
  addonQtys: {}, designStatus: "PRINT_READY",
  materialCode: "", sizeLabel: "", sidesLabel: "Single-sided",
};

export function ProductPageClient({ product }: Props) {
  const [priceData, setPriceData] = useState<PriceData>(EMPTY_PRICE);
  const [configData, setConfigData] = useState<ConfigData>(EMPTY_CONFIG);
  const [addedToCart, setAddedToCart] = useState(false);

  const handlePriceChange = useCallback((data: PriceData) => {
    setPriceData(data);
  }, []);

  const handleConfigChange = useCallback((config: ConfigData) => {
    setConfigData(config);
  }, []);

  function handleAddToCart() {
    if (priceData.price == null) return;

    const designLabel =
      configData.designStatus !== "PRINT_READY"
        ? ` | ${
            configData.designStatus === "FULL_DESIGN"
              ? "Full Design"
              : configData.designStatus === "MINOR_EDIT"
              ? "Minor Edits"
              : "Logo Vectorization"
          }`
        : "";

    const label = `${configData.sizeLabel} — ${configData.sidesLabel} × ${configData.qty}${designLabel}`;

    addToCart({
      product_name: product.name,
      product_slug: product.slug,
      category: product.category,
      label,
      config: {
        category: product.category,
        material_code: configData.materialCode,
        width_in: configData.widthIn,
        height_in: configData.heightIn,
        sides: configData.sides,
        qty: configData.qty,
        design_status: configData.designStatus,
        addons: Object.entries(configData.addonQtys)
          .filter(([, q]) => q > 0)
          .map(([addonLabel, addonQty]) => `${addonLabel} ×${addonQty}`),
      },
      sell_price: priceData.price,
      qty: configData.qty,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }

  const materialLabel = MATERIAL_LABELS[product.slug] ?? product.name;

  return (
    // pb-24 on mobile/tablet for sticky bar clearance; removed on lg+
    <div className="pb-24 lg:pb-0">
      {/* ── 3-column grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_2fr_1.4fr] gap-8 items-start">

        {/* Col 1 — Gallery */}
        <ProductGallery images={product.galleryImages} productName={product.name} />

        {/* Col 2 — Options (white card) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <ProductConfigurator
            product={product}
            onPriceChange={handlePriceChange}
            onConfigChange={handleConfigChange}
          />
        </div>

        {/* Col 3 — Sticky price panel (desktop only) */}
        <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <PriceSummary
            price={priceData.price}
            loading={priceData.loading}
            addonTotal={priceData.addonTotal}
            designFee={priceData.designFee}
            gst={priceData.gst}
            total={priceData.total}
            addedToCart={addedToCart}
            onAddToCart={handleAddToCart}
            productSlug={product.slug}
            widthIn={configData.widthIn}
            heightIn={configData.heightIn}
            qty={configData.qty}
            sides={configData.sides}
            materialLabel={materialLabel}
            addonQtys={configData.addonQtys}
            category={product.category as Category}
            pricePerUnit={priceData.pricePerUnit}
            qtyDiscountPct={priceData.qtyDiscountPct}
            qtyDiscountApplied={priceData.qtyDiscountApplied}
          />
        </div>
      </div>

      {/* ── Mobile / tablet sticky bottom bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {/* Price summary */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Total incl. GST</p>
          {priceData.loading && priceData.total == null ? (
            <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
          ) : priceData.total != null ? (
            <p className={`text-xl font-bold text-[#1c1712] leading-none tabular-nums transition-opacity duration-200 ${priceData.loading ? "opacity-60" : "opacity-100"}`}>
              ${priceData.total.toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 leading-none">Configure above</p>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={priceData.price == null || addedToCart || priceData.loading}
          className={`shrink-0 px-6 py-3 rounded-xl font-bold text-white text-base transition-all ${
            addedToCart
              ? "bg-[#8CC63E] cursor-default"
              : priceData.price == null || priceData.loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#16C2F3] hover:bg-[#0fb0dd] active:scale-[0.98]"
          }`}
        >
          {addedToCart ? "✓ Added" : "Add to Cart →"}
        </button>
      </div>
    </div>
  );
}
