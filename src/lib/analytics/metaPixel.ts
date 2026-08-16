import { hasMarketingConsent } from "@/lib/analytics/metaConsent";

declare global {
  interface Window {
    fbq?: (action: string, ...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "2456385404880011";

export interface MetaItem {
  id: string;
  quantity?: number;
  item_price?: number;
}

type EventOptions = { eventId?: string };

function fbq(eventName: string, params: Record<string, unknown>, options?: EventOptions) {
  if (!hasMarketingConsent()) return;
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName, params, options?.eventId ? { eventID: options.eventId } : undefined);
  }
}

// ── Client-side wrappers ──────────────────────────────────────────────

export function metaTrackViewContent(p: { content_ids: string[]; content_name?: string; value?: number; currency?: string; content_category?: string }, options?: EventOptions) {
  fbq("ViewContent", { content_type: "product", currency: "CAD", ...p }, options);
}

export function metaTrackAddToCart(p: { content_ids: string[]; content_name?: string; value: number; currency?: string; contents?: MetaItem[] }, options?: EventOptions) {
  fbq("AddToCart", { content_type: "product", currency: "CAD", ...p }, options);
}

export function metaTrackInitiateCheckout(p: { content_ids: string[]; value: number; currency?: string; num_items: number; contents?: MetaItem[] }, options?: EventOptions) {
  fbq("InitiateCheckout", { content_type: "product", currency: "CAD", ...p }, options);
}

export function metaTrackPurchase(p: { content_ids: string[]; value: number; currency?: string; contents?: MetaItem[]; num_items?: number }, options?: EventOptions) {
  fbq("Purchase", { content_type: "product", currency: "CAD", ...p }, options);
}

export function metaTrackLead(p: { content_name?: string; value?: number; currency?: string }, options?: EventOptions) {
  // Leads carry no value: an unpriced quote/contact has no honest revenue figure (see quote-link-contract test).
  fbq("Lead", { ...p }, options);
}
