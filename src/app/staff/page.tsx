"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CategoryPicker } from "@/components/estimator/CategoryPicker";
import { OptionsPanel } from "@/components/estimator/OptionsPanel";
import { QuotePanel } from "@/components/estimator/QuotePanel";
import { ProductProof } from "@/components/estimator/ProductProof";
import type { Category, DesignStatus } from "@/lib/data/types";
import type { Addon } from "@/lib/data/types";
import type { EstimateResponse } from "@/lib/engine/types";
import type { QuoteEmailData } from "@/lib/email/quoteTemplate";
import { LOGO_PATH } from "@/lib/config";
import type { ProofImageState } from "@/components/estimator/ProductProof";

interface EstimatorState {
  width_in: string;
  height_in: string;
  sides: 1 | 2;
  qty: number;
  addons: Addon[];
  design_status: DesignStatus;
  is_rush: boolean;
  material_code: string;
}

const DEFAULT_STATE: EstimatorState = {
  width_in: "",
  height_in: "",
  sides: 1,
  qty: 1,
  addons: [],
  design_status: "PRINT_READY",
  is_rush: false,
  material_code: "",
};

// Map categories to their default material codes
const MATERIAL_MAP: Partial<Record<Category, string>> = {
  SIGN: "MPHCC020",
  BANNER: "RMBF004",
  RIGID: "RMACP002",
  MAGNET: "MAG302437550M",
  PHOTO_POSTER: "RMPS002",
  DECAL: "ARLPMF7008",
  VINYL_LETTERING: "ARLPMF7008",
  DISPLAY: "RBS33507875S", // Economy tier by default
};

// Human-readable material names for the proof card
const MATERIAL_LABEL_MAP: Partial<Record<string, string>> = {
  MPHCC020: "Coroplast 4mm",
  RMBF004: "Vinyl Banner 13oz",
  RMACP002: "ACP 3mm Aluminum",
  MAG302437550M: "Magnetic Sheet 30mil",
  RMPS002: "Photo Paper 220gsm",
  ARLPMF7008: "Adhesive Vinyl",
  RBS33507875S: "Retractable Banner — Economy",
  RBS33507900PSB: "Retractable Banner — Deluxe",
  RBS33507900PREM: "Retractable Banner — Premium",
};

const SQFT_CATEGORIES: Category[] = [
  "SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET",
  "DECAL", "VINYL_LETTERING", "PHOTO_POSTER", "DISPLAY",
];

export default function StaffPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [state, setState] = useState<EstimatorState>(DEFAULT_STATE);
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [step, setStep] = useState<"pick" | "options">("pick");
  const [proofImage, setProofImage] = useState<ProofImageState | null>(null);

  const handleCategorySelect = useCallback((cat: Category) => {
    setCategory(cat);
    setState({
      ...DEFAULT_STATE,
      material_code: MATERIAL_MAP[cat] ?? "",
      qty: ["FLYER", "BUSINESS_CARD", "BROCHURE", "POSTCARD", "STICKER"].includes(cat) ? 250 : 1,
      // Retractable banners are always 33.5" × 80" — pre-fill so proof renders immediately
      ...(cat === "DISPLAY" ? { width_in: "33.5", height_in: "80" } : {}),
    });
    setResult(null);
    setProofImage(null);
    setStep("options");
  }, []);

  const handleStateChange = useCallback((updates: Partial<EstimatorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Debounced estimate fetch
  useEffect(() => {
    if (!category) return;

    const w = parseFloat(state.width_in);
    const h = parseFloat(state.height_in);
    const isSqftBased = ["SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET", "DECAL", "VINYL_LETTERING", "PHOTO_POSTER"].includes(category);

    // Don't fetch if sqft-based product has no dimensions yet
    if (isSqftBased && (!w || !h || w <= 0 || h <= 0)) {
      setResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const body = {
          category,
          material_code: state.material_code || undefined,
          width_in: isSqftBased ? w : undefined,
          height_in: isSqftBased ? h : undefined,
          sides: state.sides,
          qty: state.qty,
          addons: state.addons,
          is_rush: state.is_rush,
          design_status: state.design_status,
          pricing_version: "v1_2026-02-19",
        };
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data: EstimateResponse = await res.json();
        setResult(data);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [category, state]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step === "options" && (
              <button
                onClick={() => { setStep("pick"); setCategory(null); setResult(null); }}
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_PATH} alt="True Color Display Printing" className="h-8 w-auto object-contain" />
              {category && (
                <span className="text-xs text-[var(--muted)] hidden sm:block">{categoryDisplayName(category)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Website</Link>
            <Link href="/staff/orders" className="text-sm text-[#16C2F3] hover:underline">Orders →</Link>
            <span className="text-xs text-[var(--muted)] font-mono hidden sm:block">v1_2026-02-24 · STAFF</span>
            <button
              onClick={() => { setCategory(null); setState(DEFAULT_STATE); setResult(null); setStep("pick"); }}
              className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-full text-[var(--muted)] hover:border-gray-400 transition-all"
            >
              New quote
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 py-8">
        {/* Step 1: Category picker */}
        {step === "pick" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight mb-1">What are we printing?</h2>
              <p className="text-sm text-[var(--muted)]">Select a product category to start your quote</p>
            </div>
            <CategoryPicker selected={category} onSelect={handleCategorySelect} />
          </div>
        )}

        {/* Step 2: Options + Live Quote */}
        {step === "options" && category && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Options */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-widest mb-5">
                Job Details
              </h2>
              <OptionsPanel
                category={category}
                state={state}
                onChange={handleStateChange}
              />
            </div>

            {/* Right: Proof + Live Quote */}
            <div className="lg:sticky lg:top-24 space-y-4">
              {(!SQFT_CATEGORIES.includes(category) ||
                (parseFloat(state.width_in) > 0 && parseFloat(state.height_in) > 0)) && (
                <ProductProof
                  category={category}
                  widthIn={parseFloat(state.width_in) || 0}
                  heightIn={parseFloat(state.height_in) || 0}
                  qty={state.qty}
                  sides={state.sides}
                  addons={state.addons}
                  materialName={
                    MATERIAL_LABEL_MAP[state.material_code] ?? categoryDisplayName(category)
                  }
                  isRush={state.is_rush}
                  designStatus={state.design_status}
                  proofImage={proofImage}
                  onProofUpload={setProofImage}
                />
              )}
              <QuotePanel
                result={result}
                loading={loading}
                isCustomerMode={isCustomerMode}
                onToggleCustomerMode={() => setIsCustomerMode((v) => !v)}
                jobDetails={category ? buildJobDetails(category, state, MATERIAL_LABEL_MAP) : undefined}
                proofImage={proofImage}
              />
            </div>
          </div>
        )}
      </main>

      {/* Customer-facing fullscreen overlay */}
      {isCustomerMode && result && result.sell_price !== null && (
        <CustomerOverlay
          result={result}
          category={category!}
          widthIn={parseFloat(state.width_in) || 0}
          heightIn={parseFloat(state.height_in) || 0}
          qty={state.qty}
          sides={state.sides}
          addons={state.addons}
          materialName={MATERIAL_LABEL_MAP[state.material_code] ?? categoryDisplayName(category!)}
          isRush={state.is_rush}
          designStatus={state.design_status}
          proofImage={proofImage}
          onClose={() => setIsCustomerMode(false)}
        />
      )}

      {/* Pricing version footer */}
      <footer className="text-center py-6 text-xs text-[var(--muted)] no-print">
        True Color Display Printing · Pricing v1_2026-02-24 · All prices in CAD + GST
      </footer>
    </div>
  );
}

// ─── Customer-Facing Overlay ──────────────────────────────────────────────────

function CustomerOverlay({
  result,
  category,
  widthIn,
  heightIn,
  qty,
  sides,
  addons,
  materialName,
  isRush,
  designStatus,
  proofImage,
  onClose,
}: {
  result: EstimateResponse;
  category: Category;
  widthIn: number;
  heightIn: number;
  qty: number;
  sides: 1 | 2;
  addons: Addon[];
  materialName: string;
  isRush: boolean;
  designStatus: string;
  proofImage?: ProofImageState | null;
  onClose: () => void;
}) {
  const sellPrice = result.sell_price ?? 0;
  const gstRate = 0.05;
  const gst = Math.round(sellPrice * gstRate * 100) / 100;
  const total = Math.round((sellPrice + gst) * 100) / 100;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="fixed top-6 right-6 text-gray-400 hover:text-gray-600 z-10"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col items-center py-12 px-6 max-w-lg mx-auto">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_PATH} alt="True Color Display Printing" className="h-12 w-auto object-contain mx-auto mb-2" />
          <p className="text-sm text-[var(--muted)]">Your Quote</p>
        </div>

        <div className="w-full mb-8">
          <ProductProof
            category={category}
            widthIn={widthIn}
            heightIn={heightIn}
            qty={qty}
            sides={sides}
            addons={addons}
            materialName={materialName}
            isRush={isRush}
            designStatus={designStatus}
            sellPrice={sellPrice}
            gstAmount={gst}
            totalAmount={total}
            proofImage={proofImage}
          />
        </div>

        {result.sqft_calculated && (
          <p className="text-sm text-gray-400 mb-6 text-center">
            {result.sqft_calculated.toFixed(2)} sq ft
            {result.price_per_sqft && ` · $${result.price_per_sqft.toFixed(2)}/sq ft`}
          </p>
        )}

        <div className="mb-8 text-center">
          <p className="text-7xl font-semibold tracking-tighter">${total.toFixed(2)}</p>
          <p className="text-sm text-[var(--muted)] mt-2">Total including GST</p>
        </div>

        {result.line_items.length > 1 && (
          <div className="w-full space-y-2 mb-8">
            {result.line_items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span>{item.description.split("(")[0].trim()}</span>
                <span>${item.line_total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-gray-400 border-t border-gray-100 pt-2">
              <span>GST (5%)</span>
              <span>${gst.toFixed(2)}</span>
            </div>
          </div>
        )}

        {result.min_charge_applied && (
          <p className="text-xs text-[var(--muted)] mb-4">
            Minimum order charge applied
            {result.price_per_unit != null && result.sell_price != null &&
             result.price_per_unit < result.sell_price &&
             ` · $${result.price_per_unit.toFixed(2)}/unit`}
          </p>
        )}

        <div className="w-full space-y-3 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-red-800 mb-1">Ready to proceed?</p>
            <p className="text-xs text-red-600 mb-3">Reply &ldquo;Approved&rdquo; and we&apos;ll get your order started</p>
            <a
              href={`mailto:info@true-color.ca?subject=Approved%20-%20Quote&body=Hi%2C%20I%20approve%20this%20quote%20and%20would%20like%20to%20proceed.`}
              className="inline-block bg-[var(--brand)] text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
            >
              Reply to Approve →
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Pay by Interac eTransfer</p>
            <p className="text-base font-bold text-blue-800">info@true-color.ca</p>
            <p className="text-xs text-blue-500 mt-0.5">Auto-deposit enabled · Send exact total above</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 mt-6">Prices in CAD + GST · True Color Display Printing</p>
      </div>
    </div>
  );
}

function buildJobDetails(
  category: Category,
  state: EstimatorState,
  materialLabelMap: Partial<Record<string, string>>
): QuoteEmailData["jobDetails"] {
  const isSqft = SQFT_CATEGORIES.includes(category);
  return {
    category,
    categoryLabel: categoryDisplayName(category),
    widthIn: isSqft ? parseFloat(state.width_in) || undefined : undefined,
    heightIn: isSqft ? parseFloat(state.height_in) || undefined : undefined,
    qty: state.qty,
    sides: state.sides,
    materialName: materialLabelMap[state.material_code] ?? undefined,
    isRush: state.is_rush,
  };
}

function categoryDisplayName(cat: Category): string {
  const map: Record<Category, string> = {
    SIGN: "Coroplast Sign",
    BANNER: "Vinyl Banner",
    RIGID: "ACP Sign",
    FOAMBOARD: "Foam Board",
    DISPLAY: "Retractable Banner",
    STICKER: "Sticker",
    DECAL: "Decal",
    VINYL_LETTERING: "Vinyl Lettering",
    PHOTO_POSTER: "Photo Poster",
    MAGNET: "Vehicle Magnet",
    POSTCARD: "Postcard",
    BUSINESS_CARD: "Business Cards",
    FLYER: "Flyers",
    BROCHURE: "Brochure",
    DESIGN: "Design Service",
    INSTALLATION: "Installation",
    SERVICE: "Service",
  };
  return map[cat] ?? cat;
}
