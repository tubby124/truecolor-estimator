"use client";

import { useState } from "react";
import type { Category, DesignStatus } from "@/lib/data/types";
import type { Addon } from "@/lib/data/types";

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

interface Props {
  category: Category;
  state: EstimatorState;
  onChange: (updates: Partial<EstimatorState>) => void;
  categoryLabel?: string; // human-readable name shown as a badge at top
}

// Qty options by product type
const QTY_TIERS: Record<string, number[]> = {
  FLYER: [25, 50, 100, 250, 500, 1000, 2500, 5000],
  BUSINESS_CARD: [250, 500, 1000, 2500, 5000],
  BROCHURE: [100, 250, 500],
  POSTCARD: [50, 100, 250, 500, 1000],
  STICKER: [50, 100, 250, 500, 1000],
};

// Quick-pick bulk qty presets for sqft-based products
const SQFT_QTY_PRESETS: Record<string, number[]> = {
  SIGN:           [1, 5, 10, 25],
  BANNER:         [1, 2, 5, 10],
  RIGID:          [1, 5, 10, 25],
  FOAMBOARD:      [1, 5, 10, 25],
  MAGNET:         [1, 2, 4, 5, 10],
  DECAL:          [1, 2, 5, 10],
  VINYL_LETTERING:[1, 2, 5, 10],
  PHOTO_POSTER:   [1],
  DISPLAY:        [1, 2, 3, 4, 5],
};

export function OptionsPanel({ category, state, onChange, categoryLabel }: Props) {
  const isSqftBased = ["SIGN", "BANNER", "RIGID", "FOAMBOARD", "MAGNET", "DECAL", "VINYL_LETTERING", "PHOTO_POSTER"].includes(category);
  const showSides = ["SIGN", "FLYER", "BUSINESS_CARD", "BROCHURE", "POSTCARD"].includes(category);
  const showGrommets = category === "BANNER";
  const showHStake = category === "SIGN";
  const showQtyTier = QTY_TIERS[category] !== undefined;

  // Track whether user has interacted with dimension inputs (for validation UX)
  const [widthTouched, setWidthTouched] = useState(false);
  const [heightTouched, setHeightTouched] = useState(false);

  const widthVal = parseFloat(state.width_in);
  const heightVal = parseFloat(state.height_in);
  const widthInvalid = widthTouched && (!state.width_in || widthVal <= 0);
  const heightInvalid = heightTouched && (!state.height_in || heightVal <= 0);

  const toggleAddon = (addon: Addon) => {
    const current = state.addons;
    if (current.includes(addon)) {
      onChange({ addons: current.filter((a) => a !== addon) });
    } else {
      onChange({ addons: [...current, addon] });
    }
  };

  return (
    <div className="space-y-5">
      {/* Product category badge */}
      {categoryLabel && (
        <div className="inline-flex items-center gap-1.5 bg-[var(--brand-50)] text-[var(--brand)] text-xs font-semibold px-3 py-1.5 rounded-full">
          {categoryLabel}
        </div>
      )}

      {/* Retractable Banner tier selector */}
      {category === "DISPLAY" && (
        <FieldGroup label="Stand Tier">
          <div className="flex flex-col gap-2">
            {[
              { label: "Economy — $219", material_code: "RBS33507875S" },
              { label: "Deluxe — $299", material_code: "RBS33507900PSB" },
              { label: "Premium — $349", material_code: "RBS33507900PREM" },
            ].map((tier) => (
              <button
                key={tier.material_code}
                onClick={() => onChange({ material_code: tier.material_code })}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                  state.material_code === tier.material_code
                    ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]"
                    : "border-[var(--border)] bg-white hover:border-gray-300"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      {/* Dimensions — for sqft-based products */}
      {isSqftBased && (
        <FieldGroup label="Dimensions">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:flex-1">
              <label className="block text-xs text-[var(--muted)] mb-1">Width (inches)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 36"
                value={state.width_in}
                onChange={(e) => onChange({ width_in: e.target.value })}
                onBlur={() => setWidthTouched(true)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white min-h-[44px] ${
                  widthInvalid
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
                }`}
              />
              {widthInvalid && (
                <p className="text-xs text-red-500 mt-1">Enter a valid width</p>
              )}
            </div>
            <span className="text-[var(--muted)] text-lg hidden sm:block mt-4">×</span>
            <div className="w-full sm:flex-1">
              <label className="block text-xs text-[var(--muted)] mb-1">Height (inches)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 72"
                value={state.height_in}
                onChange={(e) => onChange({ height_in: e.target.value })}
                onBlur={() => setHeightTouched(true)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 bg-white min-h-[44px] ${
                  heightInvalid
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
                }`}
              />
              {heightInvalid && (
                <p className="text-xs text-red-500 mt-1">Enter a valid height</p>
              )}
            </div>
          </div>
          {state.width_in && state.height_in && widthVal > 0 && heightVal > 0 && (
            <SqftBadge widthIn={widthVal} heightIn={heightVal} />
          )}
        </FieldGroup>
      )}

      {/* Sides */}
      {showSides && (
        <FieldGroup label="Sides">
          <div className="flex gap-2">
            {([1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChange({ sides: s })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  state.sides === s
                    ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]"
                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-gray-300"
                }`}
              >
                {s === 1 ? <OneSidedIcon active={state.sides === 1} /> : <TwoSidedIcon active={state.sides === 2} />}
                {s === 1 ? "Single-sided" : "Double-sided"}
              </button>
            ))}
          </div>
        </FieldGroup>
      )}

      {/* Quantity — tier picker for print products */}
      {showQtyTier ? (
        <FieldGroup label="Quantity">
          <div className="flex flex-wrap gap-2">
            {QTY_TIERS[category].map((q) => (
              <button
                key={q}
                onClick={() => onChange({ qty: q })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  state.qty === q
                    ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]"
                    : "border-[var(--border)] bg-white hover:border-gray-300"
                }`}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>
          {category === "STICKER" && state.qty < 50 && (
            <p className="text-xs text-amber-600 mt-1">Minimum order: 50 stickers</p>
          )}
        </FieldGroup>
      ) : (isSqftBased || SQFT_QTY_PRESETS[category] !== undefined) ? (
        <FieldGroup label="Quantity">
          {SQFT_QTY_PRESETS[category] ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {SQFT_QTY_PRESETS[category].map((q) => (
                  <button
                    key={q}
                    onClick={() => onChange({ qty: q })}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      state.qty === q
                        ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]"
                        : "border-[var(--border)] bg-white hover:border-gray-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                placeholder="Custom qty"
                value={state.qty}
                onChange={(e) => onChange({ qty: parseInt(e.target.value) || 1 })}
                onFocus={(e) => e.target.select()}
                className="w-28 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] bg-white"
              />
            </div>
          ) : (
            <input
              type="number"
              min="1"
              value={state.qty}
              onChange={(e) => onChange({ qty: parseInt(e.target.value) || 1 })}
              className="w-24 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] bg-white"
            />
          )}
        </FieldGroup>
      ) : null}

      {/* Add-ons */}
      {(showGrommets || showHStake) && (
        <FieldGroup label="Add-ons">
          <div className="space-y-2">
            {showGrommets && (
              <AddonToggle
                id="GROMMETS"
                label="Grommets"
                sublabel="Auto-calculated · $2.50 each"
                checked={state.addons.includes("GROMMETS")}
                onChange={() => toggleAddon("GROMMETS")}
              />
            )}
            {showHStake && (
              <AddonToggle
                id="H_STAKE"
                label="H-Stake (Yard Stake)"
                sublabel="$2.50 each"
                checked={state.addons.includes("H_STAKE")}
                onChange={() => toggleAddon("H_STAKE")}
              />
            )}
          </div>
        </FieldGroup>
      )}

      {/* Rush */}
      <FieldGroup label="Turnaround">
        <AddonToggle
          id="RUSH"
          label="Rush Order"
          sublabel="+$40.00 flat fee"
          checked={state.is_rush}
          onChange={() => onChange({ is_rush: !state.is_rush })}
          accent="amber"
        />
      </FieldGroup>

      {/* Design Status */}
      <FieldGroup label="Design / Artwork">
        <div className="space-y-2">
          {[
            { val: "PRINT_READY", label: "Files are print-ready", sub: "No charge" },
            { val: "MINOR_EDIT", label: "Minor edits needed", sub: "+$35.00" },
            { val: "FULL_DESIGN", label: "Full design from scratch", sub: "+$50.00" },
            { val: "LOGO_RECREATION", label: "Logo recreation / vectorize", sub: "+$75.00" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => onChange({ design_status: opt.val as DesignStatus })}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-lg border text-sm transition-all ${
                state.design_status === opt.val
                  ? "border-[var(--brand)] bg-[var(--brand-50)]"
                  : "border-[var(--border)] bg-white hover:border-gray-300"
              }`}
            >
              <span className={state.design_status === opt.val ? "font-medium text-[var(--brand)]" : ""}>
                {opt.label}
              </span>
              <span className="text-xs text-[var(--muted)]">{opt.sub}</span>
            </button>
          ))}
        </div>
      </FieldGroup>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">{label}</p>
      {children}
    </div>
  );
}

function AddonToggle({
  id,
  label,
  sublabel,
  checked,
  onChange,
  accent = "red",
}: {
  id: string;
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: () => void;
  accent?: "red" | "amber";
}) {
  const activeClass = accent === "amber"
    ? "border-amber-400 bg-amber-50"
    : "border-[var(--brand)] bg-[var(--brand-50)]";

  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all ${
        checked ? activeClass : "border-[var(--border)] bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
          checked
            ? accent === "amber" ? "bg-amber-400 border-amber-400" : "bg-[var(--brand)] border-[var(--brand)]"
            : "border-gray-300 bg-white"
        }`}>
          {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className={checked ? "font-medium" : ""}>{label}</span>
      </div>
      <span className="text-xs text-[var(--muted)]">{sublabel}</span>
    </button>
  );
}

function SqftBadge({ widthIn, heightIn }: { widthIn: number; heightIn: number }) {
  const sqft = ((widthIn / 12) * (heightIn / 12)).toFixed(2);
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
      {sqft} sq ft
    </div>
  );
}

// Inline SVG icons for sides toggle
function OneSidedIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="shrink-0">
      <rect x="1" y="1" width="16" height="12" rx="1.5"
        fill={active ? "var(--brand-50)" : "#f3f4f6"}
        stroke={active ? "var(--brand)" : "#9ca3af"}
        strokeWidth="1.5"
      />
      <line x1="4" y1="4.5" x2="14" y2="4.5" stroke={active ? "var(--brand)" : "#9ca3af"} strokeWidth="1" strokeLinecap="round" />
      <line x1="4" y1="7" x2="11" y2="7" stroke={active ? "var(--brand)" : "#9ca3af"} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function TwoSidedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" className="shrink-0">
      <rect x="1" y="1" width="9" height="12" rx="1.5"
        fill={active ? "var(--brand-50)" : "#f3f4f6"}
        stroke={active ? "var(--brand)" : "#9ca3af"}
        strokeWidth="1.5"
      />
      <rect x="12" y="1" width="9" height="12" rx="1.5"
        fill={active ? "var(--brand-50)" : "#f3f4f6"}
        stroke={active ? "var(--brand)" : "#9ca3af"}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <path d="M10.5 7H11.5" stroke={active ? "var(--brand)" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
