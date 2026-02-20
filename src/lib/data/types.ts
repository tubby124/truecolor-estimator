// All TypeScript types for the True Color pricing data layer
// Mirrors the CSV column schemas from /docs/DATA_SCHEMA.md

export type Category =
  | "SIGN"
  | "BANNER"
  | "RIGID"
  | "DISPLAY"
  | "STICKER"
  | "DECAL"
  | "VINYL_LETTERING"
  | "FOAMBOARD"
  | "PHOTO_POSTER"
  | "MAGNET"
  | "POSTCARD"
  | "BUSINESS_CARD"
  | "FLYER"
  | "BROCHURE"
  | "DESIGN"
  | "INSTALLATION"
  | "SERVICE";

export type DesignStatus =
  | "PRINT_READY"
  | "MINOR_EDIT"
  | "FULL_DESIGN"
  | "LOGO_RECREATION"
  | "INCLUDED"
  | "UNKNOWN";

export type Finish =
  | "GLOSS_LAM"
  | "MATTE_LAM"
  | "HEMMED"
  | "DIE_CUT"
  | "NONE";

export type Addon =
  | "GROMMETS"
  | "H_STAKE"
  | "RUSH"
  | "DESIGN_MINOR"
  | "DESIGN_FULL"
  | "DESIGN_LOGO"
  | "INSTALLATION";

// pricing_rules.v1.csv row
export interface PricingRule {
  rule_id: string;
  version: string;
  effective_date: string;
  category: string;
  material_code: string;
  sides: number | null;
  sqft_min: number | null;
  sqft_max: number | null;
  qty_min: number | null;
  qty_max: number | null;
  price_per_sqft: number | null;
  price_per_unit: number | null;
  min_charge: number;
  rounding: string;
  conflict_note: string;
  source_ref: string;
}

// products.v1.csv row (fixed-size catalog products)
export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  material_code: string;
  width_in: number;
  height_in: number;
  sides: number;
  qty: number;
  price: number;
  price_model: string;
  pricing_rule_ref: string;
  is_active: boolean;
  core_catalog: boolean;
  source_ref: string;
  pricing_version: string;
}

// materials.v1.csv row
export interface Material {
  material_code: string;
  material_name: string;
  vendor: string;
  unit_type: string;
  cost_per_sqft: number | null;
  cost_per_unit: number | null;
  is_placeholder: boolean;
  keywords: string;
  printer_route: string; // ROLAND | KONICA
  waste_multiplier: number;
  source_ref: string;
}

// services.v1.csv row
export interface Service {
  service_id: string;
  service_name: string;
  service_type: string;
  unit: string;
  default_price: number;
  min_charge: number;
  applies_to: string;
  pricing_rule_ref: string;
  taxable_gst: boolean;
  taxable_pst: boolean;
  is_active: boolean;
  notes: string;
  source_ref: string;
  pricing_version: string;
}

// cost_rules.v1.csv row
export interface CostRule {
  rule_id: string;
  version: string;
  category: string;
  material_code: string;
  cost_per_sqft: number | null;
  cost_per_unit: number | null;
  waste_multiplier: number;
  ink_route: string;
  ink_cost_per_sqft: number | null;
  ink_cost_per_sheet: number | null;
  labor_min_per_line: number;
  labor_rate_hr: number;
  overhead_per_order: number;
  source_ref: string;
}
