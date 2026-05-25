/**
 * Flyer catalog — the SINGLE source the staff portal uses for flyer pricing.
 *
 * Why this file exists: the staff manual-order modal used to let staff free-type
 * a flyer price, so it could drift from what the website quotes. There is only ONE
 * pricing engine (src/lib/engine). This helper runs every active FLYER SKU from
 * products.v1.csv THROUGH that same engine, so the staff picker shows exactly the
 * price a customer would see on the site — no parallel logic, no hand-copied numbers.
 *
 * Labels (paper / size) are presentation-only and mapped here; PRICES always come
 * from estimate(). If a flyer SKU is added/removed/repriced in the CSV, this catalog
 * follows automatically.
 */

import { estimate } from "@/lib/engine";
import { getProducts } from "./loader";

export interface FlyerSku {
  productId: string;
  sizeKey: string;       // FULL | HALF | RACK | other
  sizeLabel: string;     // e.g. "Full Letter — 8.5×11″"
  widthIn: number;
  heightIn: number;
  materialCode: string;
  paperLabel: string;    // e.g. "80lb Gloss Text"
  sides: 1 | 2;
  qty: number;
  price: number;         // engine total for the whole lot (CAD, pre-tax)
  unitPrice: number;     // price / qty, rounded to cents
}

const PAPER_LABELS: Record<string, string> = {
  PLACEHOLDER_80LB: "80lb Gloss Text",
  PLACEHOLDER_80LB_HALF: "80lb Gloss Text",
  PLACEHOLDER_100LB: "100lb Gloss Text",
  PLACEHOLDER_100LB_HALF: "100lb Gloss Text",
  PLACEHOLDER_100LB_RACK: "100lb Gloss Text",
  COUDCCDIC1081312FSC: "130lb Cougar Cover",
};

/** Derive a stable size key + display label from a SKU's dimensions. */
function sizeOf(widthIn: number, heightIn: number): { key: string; label: string } {
  // Compare unordered so 9×4 and 4×9 both resolve to the rack card.
  const [a, b] = [widthIn, heightIn].sort((x, y) => x - y);
  if (a === 8.5 && b === 11) return { key: "FULL", label: "Full Letter — 8.5×11″" };
  if (a === 5.5 && b === 8.5) return { key: "HALF", label: "Half Letter — 8.5×5.5″" };
  if (a === 4 && b === 9) return { key: "RACK", label: "Rack Card — 4×9″" };
  return { key: `${widthIn}x${heightIn}`, label: `${widthIn}×${heightIn}″` };
}

let _catalog: FlyerSku[] | null = null;

/**
 * Returns every active FLYER SKU priced through the engine, sorted by
 * size → paper → sides → qty. Memoized for the life of the process
 * (same lifecycle as getProducts — reloads on server restart / redeploy).
 */
export function getFlyerCatalog(): FlyerSku[] {
  if (_catalog) return _catalog;

  const skus: FlyerSku[] = getProducts()
    .filter((p) => p.category === "FLYER")
    .map((p) => {
      const sides = (p.sides === 2 ? 2 : 1) as 1 | 2;
      const result = estimate({
        category: "FLYER",
        material_code: p.material_code,
        width_in: p.width_in,
        height_in: p.height_in,
        sides,
        qty: p.qty,
      });
      const price = result.sell_price ?? p.price;
      const size = sizeOf(p.width_in, p.height_in);
      return {
        productId: p.product_id,
        sizeKey: size.key,
        sizeLabel: size.label,
        widthIn: p.width_in,
        heightIn: p.height_in,
        materialCode: p.material_code ?? "",
        paperLabel: PAPER_LABELS[p.material_code ?? ""] ?? p.material_code ?? "",
        sides,
        qty: p.qty,
        price: Math.round(price * 100) / 100,
        unitPrice: p.qty > 0 ? Math.round((price / p.qty) * 100) / 100 : 0,
      };
    });

  const sizeOrder = (k: string) => ({ FULL: 0, HALF: 1, RACK: 2 } as Record<string, number>)[k] ?? 9;
  skus.sort(
    (x, y) =>
      sizeOrder(x.sizeKey) - sizeOrder(y.sizeKey) ||
      x.paperLabel.localeCompare(y.paperLabel) ||
      x.sides - y.sides ||
      x.qty - y.qty,
  );

  _catalog = skus;
  return _catalog;
}
