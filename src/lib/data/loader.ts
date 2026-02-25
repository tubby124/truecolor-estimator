// CSV data loader — parses all pricing tables once at startup.
// Returns typed arrays. No database needed for Phase 1.

import fs from "fs";
import path from "path";
import type { PricingRule, Product, Material, Service } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "tables");

function readCsv(filename: string): string[][] {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), "utf-8");
  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => parseCsvLine(line));
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function num(s: string): number | null {
  if (!s || s === "" || s.toLowerCase().includes("placeholder")) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function bool(s: string): boolean {
  return s?.toUpperCase() === "TRUE";
}

// ─── Pricing Rules ───────────────────────────────────────────────────────────

let _pricingRules: PricingRule[] | null = null;

export function getPricingRules(): PricingRule[] {
  if (_pricingRules) return _pricingRules;
  const [, ...rows] = readCsv("pricing_rules.v1.csv");
  _pricingRules = rows
    .filter((r) => r[0])
    .map((r) => ({
      rule_id: r[0],
      version: r[1],
      effective_date: r[2],
      category: r[3],
      material_code: r[4],
      sides: r[5] ? parseInt(r[5]) : null,
      sqft_min: num(r[6]),
      sqft_max: r[7] ? num(r[7]) : null,
      qty_min: num(r[8]),
      qty_max: r[9] ? num(r[9]) : null,
      price_per_sqft: num(r[10]),
      price_per_unit: num(r[11]),
      min_charge: parseFloat(r[12]) || 0,
      rounding: r[13] || "",
      conflict_note: r[14] || "",
      source_ref: r[15] || "",
      is_lot_price: r[16]?.toUpperCase() === "FALSE" ? false : true,
    }));
  return _pricingRules;
}

// ─── Products (fixed-size catalog) ───────────────────────────────────────────

let _products: Product[] | null = null;

export function getProducts(): Product[] {
  if (_products) return _products;
  const [, ...rows] = readCsv("products.v1.csv");
  _products = rows
    .filter((r) => r[0] && bool(r[11])) // is_active only
    .map((r) => ({
      product_id: r[0],
      product_name: r[1],
      category: r[2],
      material_code: r[3],
      width_in: parseFloat(r[4]) || 0,
      height_in: parseFloat(r[5]) || 0,
      sides: parseInt(r[6]) || 1,
      qty: parseInt(r[7]) || 1,
      price: parseFloat(r[8]) || 0,
      price_model: r[9] || "",
      pricing_rule_ref: r[10] || "",
      is_active: bool(r[11]),
      core_catalog: bool(r[12]),
      source_ref: r[13] || "",
      pricing_version: r[14] || "",
    }));
  return _products;
}

// ─── Materials ───────────────────────────────────────────────────────────────
// CSV columns (0-indexed):
//   0:material_code, 1:material_name, 2:category, 3:finish, 4:thickness_or_weight,
//   5:cost_model, 6:cost_rate, 7:is_generic, 8:is_placeholder,
//   9:supplier_unit_cost, 10:supplier_unit_type, 11:supplier_date, 12:supplier_invoice_ref,
//   13:width_in, 14:aliases, 15:keywords, 16:source_ref

function deriveWasteMultiplier(category: string): number {
  const upper = category.toUpperCase();
  if (upper.includes("PAPER") || upper.includes("CARD")) return 1.0;
  if (upper.includes("COROPLAST") || upper.includes("ACP") || upper.includes("FOAM") || upper.includes("RIGID")) return 1.05;
  return 1.10; // roll vinyl, banner, magnet
}

function derivePrinterRoute(category: string, materialName: string): string {
  const haystack = (category + " " + materialName).toLowerCase();
  if (haystack.includes("paper") || haystack.includes("card stock") || haystack.includes("konica")) return "KONICA";
  return "ROLAND";
}

let _materials: Material[] | null = null;

export function getMaterials(): Material[] {
  if (_materials) return _materials;
  const [, ...rows] = readCsv("materials.v1.csv");
  _materials = rows
    .filter((r) => r[0])
    .map((r) => {
      const costRate = r[6] || "";
      const isGeneric = bool(r[7]);
      const isPlaceholderFlag = bool(r[8]);
      const costNum = num(costRate);
      const isPlaceholder = isPlaceholderFlag || isGeneric || costNum === null || costNum === 0;
      const category = r[2] || "";
      const materialName = r[1] || "";
      return {
        material_code: r[0],
        material_name: materialName,
        vendor: "",
        unit_type: r[5] || "per_sqft",
        cost_per_sqft: isPlaceholder ? null : costNum,
        cost_per_unit: null,
        is_placeholder: isPlaceholder,
        keywords: (r[15] || "") + " " + (r[14] || ""), // keywords + aliases
        printer_route: derivePrinterRoute(category, materialName),
        waste_multiplier: deriveWasteMultiplier(category),
        source_ref: r[16] || "",
      };
    });
  return _materials;
}

// ─── Config (key→value business rules) ───────────────────────────────────────

let _config: Record<string, string> | null = null;

export function getConfig(): Record<string, string> {
  if (_config) return _config;
  const [, ...rows] = readCsv("config.v1.csv");
  _config = {};
  for (const r of rows) {
    if (r[0]) _config[r[0]] = r[1] ?? "";
  }
  return _config;
}

/** Returns a config value as a number. Throws if the key is missing or non-numeric. */
export function getConfigNum(key: string): number {
  const cfg = getConfig();
  if (!(key in cfg)) throw new Error(`config.v1.csv: missing key "${key}"`);
  const n = parseFloat(cfg[key]);
  if (isNaN(n)) throw new Error(`config.v1.csv: key "${key}" = "${cfg[key]}" is not a number`);
  return n;
}

// ─── Services ────────────────────────────────────────────────────────────────

let _services: Service[] | null = null;

export function getServices(): Service[] {
  if (_services) return _services;
  const [, ...rows] = readCsv("services.v1.csv");
  _services = rows
    .filter((r) => r[0] && bool(r[10])) // is_active only
    .map((r) => ({
      service_id: r[0],
      service_name: r[1],
      service_type: r[2] || "",
      unit: r[3] || "",
      default_price: parseFloat(r[4]) || 0,
      min_charge: parseFloat(r[5]) || 0,
      applies_to: r[6] || "",
      pricing_rule_ref: r[7] || "",
      taxable_gst: bool(r[8]),
      taxable_pst: bool(r[9]),
      is_active: bool(r[10]),
      notes: r[11] || "",
      source_ref: r[12] || "",
      pricing_version: r[13] || "",
    }));
  return _services;
}

// ─── Qty Discounts ────────────────────────────────────────────────────────────

export interface QtyDiscount {
  rule_id: string;
  category: string;
  qty_min: number;
  qty_max: number | null;
  discount_pct: number;
  version: string;
}

let _qtyDiscounts: QtyDiscount[] | null = null;

export function getQtyDiscounts(): QtyDiscount[] {
  if (_qtyDiscounts) return _qtyDiscounts;
  const [, ...rows] = readCsv("qty_discounts.v1.csv");
  _qtyDiscounts = rows
    .filter((r) => r[0])
    .map((r) => ({
      rule_id: r[0],
      category: r[1],
      qty_min: parseInt(r[2]) || 1,
      qty_max: r[3] ? parseInt(r[3]) : null,
      discount_pct: parseFloat(r[4]) || 0,
      version: r[5] || "",
    }));
  return _qtyDiscounts;
}
