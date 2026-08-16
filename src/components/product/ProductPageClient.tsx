"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { addToCart } from "@/lib/cart/cart";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductConfigurator, type PriceData, type ConfigData } from "@/components/product/ProductConfigurator";
import { UnifiedConfigurator } from "@/components/product/UnifiedConfigurator";
import { PriceSummary } from "@/components/product/PriceSummary";
import { useToast, ToastContainer } from "@/components/ui";
import type { ProductContent } from "@/lib/data/products-content";
import type { Category } from "@/lib/data/types";
import type { MerchantOfferSelection } from "@/lib/merchant/merchant-catalog";
import { trackViewItem, trackAddToCart } from "@/lib/analytics";
import { metaTrackViewContent, metaTrackAddToCart } from "@/lib/analytics/metaPixel";
import { SameDayClock } from "@/components/home/SameDayClock";
import { flags } from "@/lib/flags";
import { PaidCartConfirmation } from "@/components/paid/PaidCartConfirmation";
import { MobileCallPriceBar } from "@/components/product/MobileCallPriceBar";

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
  initialSelection?: MerchantOfferSelection;
}

const EMPTY_PRICE: PriceData = {
  price: null, loading: false, addonTotal: 0, designFee: 0, rushFee: 0,
  gst: null, pst: null, total: null,
  pricePerUnit: null, qtyDiscountPct: null, qtyDiscountApplied: false,
  minChargeApplied: false, minChargeValue: null, preMinSubtotal: null, lineItems: [],
};

const EMPTY_CONFIG: ConfigData = {
  widthIn: 0, heightIn: 0, qty: 1, sides: 1,
  addonQtys: {}, designStatus: "PRINT_READY",
  materialCode: "", sizeLabel: "", sidesLabel: "Single-sided",
};

export function ProductPageClient({ product, initialSelection }: Props) {
  const { toasts, showToast, dismissToast } = useToast();
  const [priceData, setPriceData] = useState<PriceData>(EMPTY_PRICE);
  const [configData, setConfigData] = useState<ConfigData>(EMPTY_CONFIG);
  const [addedToCart, setAddedToCart] = useState(false);

  // Mobile paid-search call/price bar (src/components/product/MobileCallPriceBar.tsx)
  // stacks ABOVE the existing sticky Add to Cart bar below — never covers it.
  // Height is live-measured off the existing bar (ref) so the stack stays
  // correct even if that bar's content height changes (price wraps, etc).
  // Starting guess matches the bar's typical rendered height pre-measurement
  // to avoid a one-frame overlap flash before ResizeObserver reports in.
  const mobileAddToCartBarRef = useRef<HTMLDivElement>(null);
  const [mobileAddToCartBarHeight, setMobileAddToCartBarHeight] = useState(84);

  useLayoutEffect(() => {
    const el = mobileAddToCartBarRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // getBoundingClientRect (not entries[0].contentRect, which excludes
    // padding/border) so the offset matches the bar's full rendered box —
    // this div has py-3 padding + a border-t that contentRect would drop.
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      if (height) setMobileAddToCartBarHeight(height);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [addedToCart]);

  function scrollToConfigurator() {
    const el = document.getElementById("product-configurator");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }

  // Fire view_item once on mount (GA4 + Meta Pixel)
  useEffect(() => {
    trackViewItem({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category,
    });
    metaTrackViewContent({
      content_ids: [product.slug],
      content_name: product.name,
      content_category: product.category,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePriceChange = useCallback((data: PriceData) => {
    setPriceData(data);
  }, []);

  const handleConfigChange = useCallback((config: ConfigData) => {
    setConfigData(config);
  }, []);

  function handleAddToCart() {
    // Flat-fee services carry no dimensions — the dimension gate would silently
    // drop every add-to-cart click for them (button enabled, nothing added).
    const dimensionsRequired = !product.serviceMode;
    if (
      priceData.price == null ||
      priceData.loading ||
      (dimensionsRequired && (configData.widthIn <= 0 || configData.heightIn <= 0)) ||
      configData.qty <= 0
    ) return;

    // Hard gate: a product with required spec text (boat licence number) must not
    // reach the cart without it — the number IS the artwork for these jobs.
    if (configData.customTextValid === false) {
      showToast("Enter your licence number before adding to cart", "error");
      document.getElementById(`ctf-${product.customTextFields?.find((f) => f.required)?.key}`)?.focus();
      return;
    }

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

    // Customer-typed spec (e.g. a boat licence number) goes INTO the label, because
    // label is what travels to checkout, the order line, the staff notification and
    // the Wave invoice. Keeping it here means production sees the exact characters
    // to cut without any new fields threaded through those four layers.
    // configData.customText already contains only the fields relevant to the
    // selected size, so a stale value can't leak in here.
    const specParts = Object.values(configData.customText ?? {})
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);
    if (configData.color) specParts.push(configData.color);
    const specLabel = specParts.length > 0 ? ` | ${specParts.join(" | ")}` : "";

    const label = `${configData.sizeLabel} — ${configData.sidesLabel} × ${configData.qty}${specLabel}${designLabel}`;

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
        color: configData.color,
        custom_text: configData.customText,
        addons: Object.entries(configData.addonQtys)
          .filter(([, q]) => q > 0)
          .map(([addonLabel, addonQty]) => `${addonLabel} ×${addonQty}`),
      },
      sell_price: priceData.price,
      gst_rate: 0.05,
      design_fee: priceData.designFee ?? 0,
      qty: configData.qty,
      line_items: priceData.lineItems.length > 0 ? priceData.lineItems : undefined,
    });

    // GA4: add_to_cart
    trackAddToCart({
      item_id: product.slug,
      item_name: product.name,
      item_category: product.category,
      price: priceData.price,
      quantity: configData.qty,
    });
    // Meta Pixel: AddToCart
    metaTrackAddToCart({
      content_ids: [product.slug],
      content_name: product.name,
      value: priceData.price,
      contents: [{ id: product.slug, quantity: configData.qty, item_price: priceData.price / Math.max(configData.qty, 1) }],
    });

    setAddedToCart(true);
    showToast(`${product.name} added to cart!`, "success");
  }

  const materialLabel = MATERIAL_LABELS[product.slug] ?? product.name;

  return (
    // pb-24 on mobile/tablet for sticky bar clearance; removed on lg+.
    // Mobile-only (<md) gets extra clearance (pb-40) to reserve space for
    // MobileCallPriceBar stacked above the sticky bar — that bar is
    // md:hidden, so md/lg clearance is unchanged from the original value.
    <div className={addedToCart ? "pb-44 sm:pb-32" : "pb-40 md:pb-24 lg:pb-0"}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* ── 3-column grid ────────────────────────────────────────────────── */}
      {/* minmax(0,…) so a wide thumbnail rail can't blow the columns past the viewport (grid min-content blowout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)] gap-8 items-start">

        {/* Col 1 — Gallery (heroImage always first; deduped if already in galleryImages) */}
        <ProductGallery
          images={[product.heroImage, ...product.galleryImages.filter((i) => i !== product.heroImage)]}
          productName={product.name}
        />

        {/* Col 2 — Options (white card). Wave 1: stickers behind public flag
            mount the UnifiedConfigurator (reads from getProductConfig). All
            other products + stickers when the flag is off keep the existing
            ProductConfigurator. PriceSummary + Add to Cart sit outside, drive
            by the same PriceData/ConfigData callbacks → no payment-path
            changes either way. */}
        <div
          id="product-configurator"
          tabIndex={-1}
          aria-label="Product options and price"
          className="bg-white border border-gray-200 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2"
        >
          {product.slug === "stickers" && flags.useProductConfigStickerPublic() ? (
            <UnifiedConfigurator
              category={product.category as Category}
              mode="customer"
              prefilled={initialSelection}
              onPriceChange={handlePriceChange}
              onConfigChange={handleConfigChange}
            />
          ) : (
            <ProductConfigurator
              product={product}
              initialSelection={initialSelection}
              onPriceChange={handlePriceChange}
              onConfigChange={handleConfigChange}
            />
          )}
        </div>

        {/* Col 3 — Sticky price panel (desktop only) */}
        <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <PriceSummary
            price={priceData.price}
            loading={priceData.loading}
            addonTotal={priceData.addonTotal}
            designFee={priceData.designFee}
            designStatus={configData.designStatus}
            gst={priceData.gst}
            pst={priceData.pst}
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
            minChargeApplied={priceData.minChargeApplied}
            minChargeValue={priceData.minChargeValue}
            preMinSubtotal={priceData.preMinSubtotal}
            lineItems={priceData.lineItems}
            showQtyDiscountTiers={!product.lotPriced}
          />
        </div>
      </div>

      {/* ── Mobile / tablet sticky bottom bar ────────────────────────────── */}
      {!addedToCart && <div ref={mobileAddToCartBarRef} className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {/* Price summary */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Price (before tax)</p>
          <SameDayClock className="text-[10px] text-[#16C2F3] flex items-center gap-1 mb-0.5" />
          {priceData.loading && priceData.price == null ? (
            <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
          ) : priceData.price != null ? (
            <p className={`text-xl font-bold text-[#1c1712] leading-none tabular-nums transition-opacity duration-200 ${priceData.loading ? "opacity-60" : "opacity-100"}`}>
              ${priceData.price.toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-gray-400 leading-none">Choose options below</p>
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
      </div>}

      {/* Paid-search (Google Ads) mobile call/price bar — stacks above the
          sticky Add to Cart bar via live-measured offset; hidden once
          addedToCart (PaidCartConfirmation below owns that moment). */}
      <MobileCallPriceBar
        visible={!addedToCart}
        bottomOffset={mobileAddToCartBarHeight}
        onGetPriceClick={scrollToConfigurator}
      />

      {addedToCart && <PaidCartConfirmation productName={product.name} />}
    </div>
  );
}
