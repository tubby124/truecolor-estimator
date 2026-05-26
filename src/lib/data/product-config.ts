/**
 * getProductConfig(category) — the single source for "what options can this
 * product have, what are valid values, how does the engine price it."
 *
 * Generalizes the flyer-catalog.ts pattern (the only category that's currently
 * fully centralized) to every category in pricing_rules.v1.csv.
 *
 * Why this exists: every configurator surface (customer estimator's
 * OptionsPanel, /products/[slug] ProductConfigurator, staff estimator,
 * manual-order modal's FlyerPicker, quote builder, /portal/[brokerage]
 * order form) used to re-implement "what controls to show + valid values."
 * One missed field = wrong SKU = wrong price = the bug class we've been
 * chasing (flyer width/height was the canonical case).
 *
 * Now every surface reads from getProductConfig(category) and renders the
 * controls it specifies. Add a product to CSV → it appears in every UI →
 * priced through the same engine path everywhere.
 *
 * This is the FOUNDATION commit. Each category's config is filled in
 * incrementally — flyers is real today (flyer-catalog.ts), others have
 * skeleton configs that callers can switch to as each is built out.
 */

import type { Category } from "@/lib/data/types";
import { getFlyerCatalog, type FlyerSku } from "./flyer-catalog";
import { getProducts, getPricingRules } from "./loader";

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
  /** Valid choices for select/chip kinds. Empty if the control accepts any value. */
  choices?: Array<{ value: string | number; label: string; help?: string }>;
  /** Min / max bounds for number inputs. */
  min?: number;
  max?: number;
  /** UI hint — display only. */
  hint?: string;
}

export interface ProductConfig {
  category: Category;
  label: string;
  /** True when the category prices off (width × height × qty) — sqft tier. */
  isSqftCategory: boolean;
  /** True when the category prices off a fixed SKU list (flyers, business cards, etc.). */
  isLotCategory: boolean;
  /** Controls to render, in display order. */
  controls: OptionControl[];
  /** Fixed SKU list when `isLotCategory` is true. */
  skus?: FlyerSku[];
  /** Whether this config is fully wired through to a UI today, or still skeleton. */
  status: "live" | "skeleton";
}

const LABEL_BY_CATEGORY: Partial<Record<Category, string>> = {
  FLYER: "Flyers",
  BUSINESS_CARD: "Business cards",
  BANNER: "Banners",
  RIGID: "ACP / Aluminum",
  SIGN: "Coroplast / Yard signs",
  STICKER: "Stickers",
  DECAL: "Vinyl decals",
  MAGNET: "Vehicle magnets",
  FOAMBOARD: "Foamboard displays",
  VINYL_LETTERING: "Vinyl lettering",
  PHOTO_POSTER: "Photo posters",
  POSTCARD: "Postcards",
  BROCHURE: "Brochures",
  BOOKLET: "Booklets",
  DISPLAY: "Display / Retractable banners",
};

/** Common sqft-category controls — width / height / sides / qty / rush / design. */
function sqftControls(opts: {
  materialChoices?: OptionControl["choices"];
  sizePresets?: OptionControl["choices"];
  defaultSize?: { w: number; h: number };
}): OptionControl[] {
  const controls: OptionControl[] = [];
  if (opts.sizePresets && opts.sizePresets.length > 0) {
    controls.push({
      key: "size_preset",
      label: "Common sizes",
      kind: "preset_grid",
      required: false,
      choices: opts.sizePresets,
      hint: "Pick a preset to fill width × height, or set manually below.",
    });
  }
  controls.push(
    { key: "width_in",  label: "Width (in)",  kind: "number", required: true, min: 1, max: 480, defaultValue: opts.defaultSize?.w ?? 24 },
    { key: "height_in", label: "Height (in)", kind: "number", required: true, min: 1, max: 480, defaultValue: opts.defaultSize?.h ?? 36 },
  );
  if (opts.materialChoices && opts.materialChoices.length > 0) {
    controls.push({
      key: "material_code",
      label: "Material",
      kind: "chip",
      required: true,
      defaultValue: opts.materialChoices[0]?.value,
      choices: opts.materialChoices,
    });
  }
  controls.push(
    { key: "sides", label: "Sides", kind: "chip", required: true, defaultValue: 1, choices: [
      { value: 1, label: "1 side" },
      { value: 2, label: "2 sides" },
    ]},
    { key: "qty", label: "Quantity", kind: "number", required: true, defaultValue: 1, min: 1, max: 10000 },
    { key: "design_status", label: "Artwork", kind: "select", required: false, defaultValue: "PRINT_READY", choices: [
      { value: "PRINT_READY",      label: "Print-ready file" },
      { value: "MINOR_EDIT",       label: "Minor edits ($35 design fee)" },
      { value: "FULL_DESIGN",      label: "Full design ($50 design fee)" },
      { value: "LOGO_RECREATION",  label: "Logo recreation ($75 design fee)" },
    ]},
    { key: "is_rush", label: "Rush", kind: "toggle", required: false, defaultValue: false, hint: "+$40 flat — must be in before 10 AM" },
  );
  return controls;
}

/** Pull active materials for a category from CSV — used to build chip choices. */
function materialsForCategory(category: Category): OptionControl["choices"] {
  const seen = new Set<string>();
  const out: OptionControl["choices"] = [];
  for (const rule of getPricingRules()) {
    if (rule.category !== category) continue;
    if (!rule.material_code || rule.material_code === "ALL") continue;
    if (seen.has(rule.material_code)) continue;
    seen.add(rule.material_code);
    out.push({ value: rule.material_code, label: rule.material_code });
  }
  return out;
}

/** Common size presets per sqft category — keeps the configurator copy-paste-able. */
const SIZE_PRESETS_BY_CATEGORY: Partial<Record<Category, OptionControl["choices"]>> = {
  BANNER:    [{ value: "2x4",  label: "2′ × 4′" },  { value: "3x6", label: "3′ × 6′" }, { value: "4x8", label: "4′ × 8′" }],
  SIGN:      [{ value: "18x24", label: '18" × 24"' }, { value: "24x36", label: '24" × 36"' }, { value: "48x96", label: "4′ × 8′" }],
  RIGID:     [{ value: "18x24", label: '18" × 24"' }, { value: "24x36", label: '24" × 36"' }, { value: "48x96", label: "4′ × 8′" }],
  FOAMBOARD: [{ value: "18x24", label: '18" × 24"' }, { value: "24x36", label: '24" × 36"' }],
  MAGNET:    [{ value: "12x18", label: '12" × 18"' }, { value: "12x24", label: '12" × 24"' }],
  DECAL:     [{ value: "8x10",  label: '8" × 10"' },  { value: "12x18", label: '12" × 18"' }],
  STICKER:   [{ value: "3x3",   label: '3" × 3"' },   { value: "4x4",   label: '4" × 4"' }],
};

let _registry: Partial<Record<Category, ProductConfig>> | null = null;

/**
 * Returns the config for a category. Throws if the category has no config
 * (forces explicit handling — better than silently rendering nothing).
 *
 * Categories with a "skeleton" status are wired to render via the generic
 * sqftControls() pattern; UI callers can use them today. As each category
 * gets a custom configurator (e.g. flyers has FlyerPicker because it has
 * fixed SKUs not sqft pricing), its config.status flips to "live".
 */
export function getProductConfig(category: Category): ProductConfig {
  const reg = buildRegistry();
  const cfg = reg[category];
  if (!cfg) throw new Error(`No ProductConfig registered for category ${category}`);
  return cfg;
}

/** List of all configured categories — drives CategoryPicker. */
export function listProductCategories(): ProductConfig[] {
  return Object.values(buildRegistry()).filter(Boolean) as ProductConfig[];
}

function buildRegistry(): Partial<Record<Category, ProductConfig>> {
  if (_registry) return _registry;

  const r: Partial<Record<Category, ProductConfig>> = {};

  // Flyers — fully live via flyer-catalog.ts
  r.FLYER = {
    category: "FLYER",
    label: LABEL_BY_CATEGORY.FLYER ?? "Flyers",
    isSqftCategory: false,
    isLotCategory: true,
    skus: getFlyerCatalog(),
    controls: [
      { key: "size_preset", label: "Size + paper", kind: "preset_grid", required: true,
        choices: getFlyerCatalog().map((s) => ({
          value: s.productId,
          label: `${s.sizeLabel} · ${s.paperLabel} · ${s.sides}S · ${s.qty}qty · $${s.price.toFixed(2)}`,
        })),
      },
      { key: "design_status", label: "Artwork", kind: "select", required: false, defaultValue: "PRINT_READY", choices: [
        { value: "PRINT_READY",     label: "Print-ready file" },
        { value: "MINOR_EDIT",      label: "Minor edits ($35)" },
        { value: "FULL_DESIGN",     label: "Full design ($50)" },
        { value: "LOGO_RECREATION", label: "Logo recreation ($75)" },
      ]},
      { key: "is_rush", label: "Rush (+$40)", kind: "toggle", required: false, defaultValue: false },
    ],
    status: "live",
  };

  // Business cards — lot-priced; products.v1.csv exact matches
  const bcSkus = getProducts().filter((p) => p.category === "BUSINESS_CARD" && p.is_active !== false);
  if (bcSkus.length > 0) {
    r.BUSINESS_CARD = {
      category: "BUSINESS_CARD",
      label: LABEL_BY_CATEGORY.BUSINESS_CARD ?? "Business cards",
      isSqftCategory: false,
      isLotCategory: true,
      controls: [
        { key: "size_preset", label: "Stock + qty", kind: "preset_grid", required: true,
          choices: bcSkus.map((p) => ({
            value: p.product_id,
            label: `${p.qty} cards · ${p.sides ?? 1}S · ${p.material_code ?? ""} · $${(p.price ?? 0).toFixed(2)}`,
          })),
        },
      ],
      status: "live",
    };
  }

  // Sqft categories — generic sqft controls (skeleton; UIs can migrate when ready)
  const sqftCats: Category[] = [
    "BANNER", "RIGID", "SIGN", "STICKER", "DECAL", "MAGNET",
    "FOAMBOARD", "VINYL_LETTERING", "PHOTO_POSTER",
  ];
  for (const cat of sqftCats) {
    const materials = materialsForCategory(cat);
    const presets = SIZE_PRESETS_BY_CATEGORY[cat];
    r[cat] = {
      category: cat,
      label: LABEL_BY_CATEGORY[cat] ?? cat,
      isSqftCategory: true,
      isLotCategory: false,
      controls: sqftControls({
        materialChoices: materials,
        sizePresets: presets,
      }),
      status: "skeleton",
    };
  }

  _registry = r;
  return r;
}

/**
 * Helper for UIs to expand a size_preset value like "24x36" into width/height.
 */
export function parseSizePreset(preset: string): { width_in: number; height_in: number } | null {
  const m = preset.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return { width_in: parseFloat(m[1]), height_in: parseFloat(m[2]) };
}
