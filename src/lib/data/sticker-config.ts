/**
 * Client-safe sticker config + shared OptionControl types + qty snap helper.
 *
 * Why this file is separate from product-config.ts: that module imports the
 * CSV loader (node:fs / node:path), which can't run in a client bundle.
 * STICKER's config is entirely static (10 hardcoded presets + Custom + qty
 * tiers — no CSV reads needed), so it lives here and UnifiedConfigurator
 * imports from this file only. product-config.ts re-exports these symbols so
 * server-side tests + the registry stay backward-compatible.
 *
 * If later waves keep their per-category configs static, they can colocate
 * here. If a wave needs CSV-derived data (BOOKLET will, since prices live in
 * the SKU table), that wave's config must stay in product-config.ts and the
 * UI needs a server-rendered prop-pass pattern (or an API route) — NOT a
 * client-direct import.
 */

import type { Category } from "./types";

/** A single choice in a select/chip/preset_grid control. Optional fields let a
 *  size_preset choice carry the (width, height, material) it implies — so picking
 *  "2×3″ Sticker" in one tap sets all three at once. The `custom` flag marks the
 *  free-input option that reveals width/height fields and locks material to a
 *  catch-all (e.g. ARLPMF7008 for stickers → engine's area-scaling path). */
export interface OptionChoice {
  value: string | number;
  label: string;
  help?: string;
  width_in?: number;
  height_in?: number;
  material_code?: string;
  /** When true, picking this choice reveals free width/height inputs. */
  custom?: boolean;
}

/** A single control rendered by a configurator UI. */
export interface OptionControl {
  key:
    | "width_in"
    | "height_in"
    | "sides"
    | "qty"
    | "material_code"
    | "finish"
    | "design_status"
    | "is_rush"
    | "size_preset";
  label: string;
  kind: "number" | "select" | "toggle" | "chip" | "preset_grid";
  required: boolean;
  defaultValue?: string | number | boolean;
  choices?: OptionChoice[];
  min?: number;
  max?: number;
  hint?: string;
}

export interface ProductConfigShape {
  category: Category;
  label: string;
  isSqftCategory: boolean;
  isLotCategory: boolean;
  controls: OptionControl[];
  status: "live" | "skeleton";
  qty_snap_to_tier?: boolean;
  qty_tiers?: number[];
}

export interface QtySnapResult {
  snapped: boolean;
  from: number;
  to: number;
  exceeded_max: boolean;
}

/** Snap UP to the smallest tier ≥ requested qty. Never snaps DOWN (would mean
 *  customer pays for fewer than they asked). When requested qty exceeds the
 *  largest tier, clamps to the largest tier and flags `exceeded_max=true` so
 *  the UI can surface "above standard tiers — Albert will quote manually." */
export function snapQtyToTier(qty: number, tiers: number[]): QtySnapResult {
  if (!tiers || tiers.length === 0) {
    return { snapped: false, from: qty, to: qty, exceeded_max: false };
  }
  const sorted = [...tiers].sort((a, b) => a - b);
  if (sorted.includes(qty)) {
    return { snapped: false, from: qty, to: qty, exceeded_max: false };
  }
  const above = sorted.find((t) => t >= qty);
  if (above !== undefined) {
    return { snapped: true, from: qty, to: above, exceeded_max: false };
  }
  const max = sorted[sorted.length - 1];
  return { snapped: true, from: qty, to: max, exceeded_max: true };
}

/** STICKER product config — Wave 1. 10 size presets matching public
 *  products-content.ts verbatim + a Custom size preset locked to ARLPMF7008
 *  (catch-all material) so the engine's area-scaling path at engine/index.ts:134
 *  prices any custom dimension. Sides are fixed to 1 (owner decision 2026-05-29
 *  — no double-sided stickers; engine + CSV have no sides=2 sticker rules).
 *  Qty snaps UP to the nearest tier since the engine's STICKER lot rules use
 *  qty_min===qty_max exact-match. */
export const STICKER_CONFIG: ProductConfigShape = {
  category: "STICKER",
  label: "Stickers",
  isSqftCategory: false,
  isLotCategory: true,
  qty_snap_to_tier: true,
  qty_tiers: [25, 50, 100, 250, 500, 1000],
  status: "live",
  controls: [
    {
      key: "size_preset",
      label: "Size",
      kind: "preset_grid",
      required: true,
      defaultValue: "4x4",
      choices: [
        { value: "1x3",    label: '1″ × 3″',  width_in: 1, height_in: 3, material_code: "ARLPMF7008" },
        { value: "2x2",    label: '2″ × 2″',  width_in: 2, height_in: 2, material_code: "PLACEHOLDER_STICKER_2X2" },
        { value: "2x3",    label: '2″ × 3″',  width_in: 2, height_in: 3, material_code: "PLACEHOLDER_STICKER_2X3" },
        { value: "2x4",    label: '2″ × 4″',  width_in: 2, height_in: 4, material_code: "ARLPMF7008" },
        { value: "3x3",    label: '3″ × 3″',  width_in: 3, height_in: 3, material_code: "PLACEHOLDER_STICKER_3X3" },
        { value: "4x4",    label: '4″ × 4″',  width_in: 4, height_in: 4, material_code: "ARLPMF7008" },
        { value: "4x6",    label: '4″ × 6″',  width_in: 4, height_in: 6, material_code: "PLACEHOLDER_STICKER_4X6" },
        { value: "5x5",    label: '5″ × 5″',  width_in: 5, height_in: 5, material_code: "PLACEHOLDER_STICKER_5X5" },
        { value: "6x6",    label: '6″ × 6″',  width_in: 6, height_in: 6, material_code: "PLACEHOLDER_STICKER_6X6" },
        { value: "8x8",    label: '8″ × 8″',  width_in: 8, height_in: 8, material_code: "PLACEHOLDER_STICKER_8X8" },
        { value: "custom", label: "Custom size", custom: true, material_code: "ARLPMF7008",
          help: "Any dimension — area-priced from the 4″ × 4″ reference." },
      ],
    },
    { key: "width_in",  label: "Width (in)",  kind: "number", required: false, min: 1, max: 24, defaultValue: 4,
      hint: "Used only when Custom size is selected." },
    { key: "height_in", label: "Height (in)", kind: "number", required: false, min: 1, max: 24, defaultValue: 4 },
    { key: "qty", label: "Quantity", kind: "number", required: true, defaultValue: 100, min: 25, max: 1000,
      hint: "Off-tier quantities round up to the nearest 25/50/100/250/500/1000." },
    { key: "design_status", label: "Artwork", kind: "select", required: false, defaultValue: "PRINT_READY", choices: [
      { value: "PRINT_READY",      label: "Print-ready file" },
      { value: "MINOR_EDIT",       label: "Minor edits (+$35)" },
      { value: "FULL_DESIGN",      label: "Full design (+$50)" },
      { value: "LOGO_RECREATION",  label: "Logo recreation (+$75)" },
    ]},
    { key: "is_rush", label: "Rush (+$40)", kind: "toggle", required: false, defaultValue: false,
      hint: "Must be in before 10 AM same-day." },
  ],
};
