/**
 * Client-safe BOOKLET config — Wave 2 of Product Configurator Unification.
 *
 * Why standalone (not in product-config.ts): same reason as sticker-config.ts —
 * product-config.ts pulls the CSV loader (node:fs) which can't run in a client
 * bundle. Booklets are SKU-list lot-priced (8 fixed-size SKUs in products.v1.csv),
 * but the catalog is small + stable + owner-locked, so encoding them inline is
 * cleaner than wiring an API route or server-render-pass.
 *
 * Booklet shape (different from stickers):
 *  - TIER chip (Premium = PLACEHOLDER_BOOK_80LB | Ultra Premium = PLACEHOLDER_BOOK_100LB)
 *  - QTY chip (25, 50, 100, 250) — engine has exact-match SKUs at these qtys
 *  - Fixed 8.5×11, sides=2 (encoded in the config, NOT user-editable)
 *  - No custom dimensions, no off-tier qty (booklet runs are bespoke; staff
 *    quotes manually if customer wants something else)
 *
 * Per vault: Projects/true-color/2026-05-29-product-configurator-unification-wave1-plan.md
 */

import type { Category } from "./types";

export interface BookletTier {
  material_code: string;
  label: string;
  description: string;
}

export interface BookletQty {
  qty: number;
  label: string;
}

export interface BookletConfigShape {
  category: Category;
  label: string;
  fixed_width_in: number;
  fixed_height_in: number;
  fixed_sides: 1 | 2;
  tiers: BookletTier[];
  qty_options: BookletQty[];
  default_tier_index: number;
  default_qty_index: number;
}

export const BOOKLET_CONFIG: BookletConfigShape = {
  category: "BOOKLET",
  label: "Coil-bound booklets",
  fixed_width_in: 8.5,
  fixed_height_in: 11,
  fixed_sides: 2,
  default_tier_index: 0,
  default_qty_index: 2, // qty 100 — most common run from quote history
  tiers: [
    {
      material_code: "PLACEHOLDER_BOOK_80LB",
      label: "Premium",
      description: "80lb gloss interior · 14pt unlaminated cover · 12mm black coil",
    },
    {
      material_code: "PLACEHOLDER_BOOK_100LB",
      label: "Ultra Premium",
      description: "100lb gloss interior · 14pt laminated cover · 12mm black coil",
    },
  ],
  qty_options: [
    { qty: 25,  label: "25 books" },
    { qty: 50,  label: "50 books" },
    { qty: 100, label: "100 books" },
    { qty: 250, label: "250 books" },
  ],
};
