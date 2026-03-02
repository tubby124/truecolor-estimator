// GA4 event utility — wraps window.gtag safely (no-ops if GA4 not loaded yet)
// Measurement ID: G-6HMQT7MNLL

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

// Standard ecommerce events

export function trackViewItem(params: {
  item_id: string;
  item_name: string;
  item_category: string;
  price?: number;
}) {
  gtag("event", "view_item", {
    currency: "CAD",
    value: params.price ?? 0,
    items: [{ item_id: params.item_id, item_name: params.item_name, item_category: params.item_category, price: params.price ?? 0 }],
  });
}

export function trackAddToCart(params: {
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity: number;
}) {
  gtag("event", "add_to_cart", {
    currency: "CAD",
    value: params.price,
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      item_category: params.item_category,
      price: params.price,
      quantity: params.quantity,
    }],
  });
}

export function trackBeginCheckout(params: { value: number; item_count: number }) {
  gtag("event", "begin_checkout", { currency: "CAD", value: params.value, item_count: params.item_count });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  payment_method: string;
}) {
  gtag("event", "purchase", {
    currency: "CAD",
    transaction_id: params.transaction_id,
    value: params.value,
    payment_type: params.payment_method,
  });
}

export function trackPriceCalculated(params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}) {
  gtag("event", "price_calculated", {
    currency: "CAD",
    item_id: params.item_id,
    item_name: params.item_name,
    price: params.price,
    quantity: params.quantity,
  });
}

export function trackViewQuote() {
  gtag("event", "view_quote_page");
}
