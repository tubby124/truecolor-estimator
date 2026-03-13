import type { Addon, Category, DesignStatus, Finish } from "../data/types";

export interface EstimateRequest {
  category: Category;
  material_code?: string;
  width_in?: number;
  height_in?: number;
  sides?: 1 | 2;
  qty?: number;
  finish?: Finish;
  addons?: Addon[];
  is_rush?: boolean;
  design_status?: DesignStatus;
  pricing_version?: string;
  skip_min_charge?: boolean;
}

export interface LineItem {
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  rule_id: string;
}

export interface CostBreakdown {
  material_cost: number | "PLACEHOLDER";
  ink_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number | "PLACEHOLDER";
  margin_pct: number | null;
  is_partial: boolean;
}

export interface EstimateResponse {
  status: "QUOTED" | "NEEDS_CLARIFICATION" | "BLOCKED";
  sell_price: number | null;
  design_fee?: number; // PST-exempt design service portion bundled in sell_price
  line_items: LineItem[];
  sqft_calculated: number | null;
  price_per_sqft: number | null;
  tier_applied: string | null;
  min_charge_applied: boolean;
  min_charge_value: number | null;
  min_charge_skipped: boolean; // true when skip_min_charge was used and price is below minimum
  rules_fired: string[];
  cost: CostBreakdown | null;
  wave_line_name: string;
  needs_clarification: boolean;
  clarification_notes: string[];
  pricing_version: string;
  // PLACEHOLDER warning — true when any material cost is unknown (awaiting supplier data)
  has_placeholder: boolean;
  placeholder_materials: string[];
  // Margin thresholds from config.v1.csv — passed through so UI never hardcodes them
  margin_green_threshold: number;
  margin_yellow_threshold: number;
  // Bulk quantity discount fields
  qty_discount_pct: number | null;
  qty_discount_applied: boolean;
  price_per_unit: number | null;
  // Pre-minimum base price (set only when min_charge_applied is true)
  base_unit_price: number | null;
}
