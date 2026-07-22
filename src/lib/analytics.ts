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

export interface Ga4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

export type AnalyticsPlacement =
  | "hero"
  | "homepage_product"
  | "product_catalogue"
  | "gallery"
  | "product_page"
  | "checkout"
  | "navigation"
  | "footer";

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

export function trackSelectItem(params: {
  item_id: string;
  item_name: string;
  item_category?: string;
  placement: AnalyticsPlacement;
  destination: string;
  item_list_name?: string;
}) {
  gtag("event", "select_item", {
    item_list_name: params.item_list_name ?? params.placement,
    placement: params.placement,
    destination: params.destination,
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      ...(params.item_category ? { item_category: params.item_category } : {}),
    }],
  });
}

export function trackViewItemList(params: {
  item_list_name: string;
  items: Array<{ item_id: string; item_name: string }>;
}) {
  gtag("event", "view_item_list", {
    item_list_name: params.item_list_name,
    items: params.items,
  });
}

export function trackClickToCall(params: { placement: string }) {
  gtag("event", "click_to_call", {
    placement: params.placement,
    page_path: "/why-true-color",
    link_url: "tel:+13069548688",
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

export function trackBeginCheckout(params: { value: number; item_count: number; items?: Ga4Item[] }) {
  gtag("event", "begin_checkout", {
    currency: "CAD",
    value: params.value,
    item_count: params.item_count,
    items: params.items ?? [],
  });
}

export function trackAddPaymentInfo(params: { value: number; payment_type: string; items?: Ga4Item[] }) {
  gtag("event", "add_payment_info", {
    currency: "CAD",
    value: params.value,
    payment_type: params.payment_type,
    items: params.items ?? [],
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  payment_method: string;
  items?: Ga4Item[];
  tax?: number;
}) {
  gtag("event", "purchase", {
    currency: "CAD",
    transaction_id: params.transaction_id,
    value: params.value,
    payment_type: params.payment_method,
    tax: params.tax ?? 0,
    items: params.items ?? [],
  });
}

export function trackRevenueConversion(params: {
  conversion_type: "purchase_online" | "quote_won";
  transaction_id: string;
  value: number;
}) {
  gtag("event", params.conversion_type, {
    currency: "CAD",
    transaction_id: params.transaction_id,
    value: params.value,
  });
}

export function trackGenerateLead(params: { value?: number; lead_source: string; form_id?: string }) {
  gtag("event", "generate_lead", {
    currency: "CAD",
    value: params.value ?? 0,
    lead_source: params.lead_source,
    form_id: params.form_id,
  });
}

export function trackPaidLandingView() {
  gtag("event", "view_paid_landing", {
    page_path: "/why-true-color",
  });
}

export function trackPaidEngagement(params: {
  event_name: "directions_click" | "reviews_click";
  placement: string;
  link_url: string;
}) {
  gtag("event", params.event_name, {
    placement: params.placement,
    link_url: params.link_url,
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

export function trackArtworkUpload(params: {
  file_count: number;
  source: "checkout" | "product_page";
}) {
  gtag("event", "artwork_upload", {
    file_count: params.file_count,
    source: params.source,
  });
}
