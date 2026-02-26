// Cart state manager — sessionStorage based, no login required
// Items persist across page navigation within the same browser tab

export interface LineItem {
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  rule_id: string;
}

export interface CartItem {
  id: string;
  product_name: string;
  product_slug: string;
  category: string;
  label: string; // e.g. "24×36\" Coroplast Sign — 1-sided × 3"
  config: {
    category: string;
    width_in?: number;
    height_in?: number;
    sides?: number;
    qty?: number;
    material_code?: string;
    design_status?: string;
    addons?: string[];
  };
  sell_price: number; // pre-tax total (all units) — engine sell_price, includes addons
  gst_rate: number; // e.g. 0.05 — stored at add-to-cart time so display never hardcodes
  qty: number;
  line_items?: LineItem[]; // engine breakdown: base product + addon sub-lines
}

const CART_KEY = "tc_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function addToCart(item: Omit<CartItem, "id">): CartItem[] {
  const cart = getCart();
  const newItem: CartItem = { ...item, id: crypto.randomUUID() };
  const updated = [...cart, newItem];
  sessionStorage.setItem(CART_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("tc_cart_updated"));
  return updated;
}

export function removeFromCart(id: string): CartItem[] {
  const updated = getCart().filter((i) => i.id !== id);
  sessionStorage.setItem(CART_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("tc_cart_updated"));
  return updated;
}

export function clearCart(): void {
  sessionStorage.removeItem(CART_KEY);
}

export function getCartCount(): number {
  return getCart().length;
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, item) => sum + item.sell_price, 0);
}
