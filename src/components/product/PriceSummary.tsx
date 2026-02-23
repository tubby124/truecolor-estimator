"use client";

import { CustomerProof } from "@/components/product/CustomerProof";
import type { Category } from "@/lib/data/types";

interface PriceSummaryProps {
  // Price data
  price: number | null;
  loading: boolean;
  addonTotal: number;
  designFee: number;
  gst: number | null;
  total: number | null;
  pricePerUnit?: number | null;
  qtyDiscountPct?: number | null;
  qtyDiscountApplied?: boolean;
  minChargeApplied?: boolean;
  minChargeValue?: number | null;
  // Cart
  addedToCart: boolean;
  onAddToCart: () => void;
  // Links
  productSlug: string;
  // Proof
  widthIn: number;
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  materialLabel: string;
  addonQtys: Record<string, number>;
  category: Category;
}

const DESIGN_LABELS: Record<number, string> = {
  35: "Minor edits",
  50: "Design from scratch",
  75: "Logo vectorization",
};

export function PriceSummary({
  price, loading, addonTotal, designFee, gst, total,
  addedToCart, onAddToCart, productSlug,
  widthIn, heightIn, qty, sides, materialLabel, addonQtys, category,
  pricePerUnit, qtyDiscountPct, qtyDiscountApplied,
  minChargeApplied, minChargeValue,
}: PriceSummaryProps) {
  const hasPrice = price != null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Proof diagram */}
      <div className="border-b border-gray-100">
        <CustomerProof
          category={category}
          widthIn={widthIn}
          heightIn={heightIn}
          qty={qty}
          sides={sides}
          materialLabel={materialLabel}
          addonQtys={addonQtys}
        />
      </div>

      {/* Price + CTA */}
      <div className="p-5 space-y-4">
        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Your Price
        </p>

        {/* Price display */}
        <div className={`transition-opacity duration-200 ${loading && hasPrice ? "opacity-60" : "opacity-100"}`}>
          {!hasPrice && !loading ? (
            <p className="text-sm text-gray-400">Enter dimensions to see price</p>
          ) : !hasPrice && loading ? (
            <div className="space-y-2">
              <div className="h-9 bg-gray-100 rounded animate-pulse w-32" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Main price */}
              <p className="text-4xl font-bold text-[#1c1712] tabular-nums leading-none">
                ${price!.toFixed(2)}
              </p>
              {/* Bulk discount badge */}
              {qtyDiscountApplied && qtyDiscountPct && pricePerUnit != null && qty > 1 && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {qtyDiscountPct}% bulk discount
                  </span>
                  <span className="text-xs text-green-700 font-medium">${pricePerUnit.toFixed(2)}/unit × {qty}</span>
                </div>
              )}

              {/* Minimum charge note */}
              {minChargeApplied && minChargeValue != null && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-2">
                  Minimum order ${minChargeValue.toFixed(2)} applied
                  {qty > 1 && pricePerUnit != null && ` · ${qty} × $${pricePerUnit.toFixed(2)}/unit`}
                </p>
              )}

              {/* Design service note */}
              {designFee > 0 && (
                <p className="text-sm text-[#16C2F3] flex items-center gap-1 pt-0.5">
                  <span>✏</span>
                  <span>{DESIGN_LABELS[designFee] ?? "Design"} included</span>
                </p>
              )}

              {/* Add-ons */}
              {addonTotal > 0 && (
                <p className="text-sm text-gray-500">
                  + ${addonTotal.toFixed(2)} add-ons
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 my-3 pt-1">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>GST (5%)</span>
                  <span className="tabular-nums">${gst?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1c1712] mt-1">
                  <span>Total</span>
                  <span className="tabular-nums">${total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={onAddToCart}
          disabled={!hasPrice || addedToCart || loading}
          className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
            addedToCart
              ? "bg-[#8CC63E] cursor-default"
              : !hasPrice || loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#16C2F3] hover:bg-[#0fb0dd] active:scale-[0.98]"
          }`}
        >
          {addedToCart ? "✓ Added to Cart" : loading && hasPrice ? "Updating…" : "Add to Cart →"}
        </button>

        {/* Secondary CTA */}
        <a
          href={`/quote-request?product=${productSlug}`}
          className="block text-center text-sm text-gray-500 hover:text-[#16C2F3] transition-colors"
        >
          Or get a quote by email
        </a>

        {/* Design note */}
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
          No file? Our in-house designer handles artwork from a rough sketch — starting at $35.
        </p>
      </div>
    </div>
  );
}
