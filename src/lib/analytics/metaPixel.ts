// Meta Pixel + Conversions API helper
//
// Pixel ID: 1413637299787953 (dataset name: "truecolor")
//
// Client-side: window.fbq('track', 'EventName', params)
// Server-side: POST https://graph.facebook.com/v18.0/{pixel_id}/events
//
// Both fire in tandem so iOS 14+ / ad-blocker traffic is captured server-side.

import { createHash } from "crypto";

declare global {
  interface Window {
    fbq?: (action: string, ...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1413637299787953";
const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const CAPI_TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE; // for Events Manager Test Events tab

const SHA = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

export interface MetaItem {
  id: string;
  quantity?: number;
  item_price?: number;
}

function fbq(action: string, ...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(action, ...args);
  }
}

// ── Client-side wrappers ──────────────────────────────────────────────

export function metaTrackViewContent(p: { content_ids: string[]; content_name?: string; value?: number; currency?: string; content_category?: string }) {
  fbq("track", "ViewContent", { content_type: "product", currency: "CAD", ...p });
}

export function metaTrackAddToCart(p: { content_ids: string[]; content_name?: string; value: number; currency?: string; contents?: MetaItem[] }) {
  fbq("track", "AddToCart", { content_type: "product", currency: "CAD", ...p });
}

export function metaTrackInitiateCheckout(p: { content_ids: string[]; value: number; currency?: string; num_items: number; contents?: MetaItem[] }) {
  fbq("track", "InitiateCheckout", { content_type: "product", currency: "CAD", ...p });
}

export function metaTrackPurchase(p: { content_ids: string[]; value: number; currency?: string; contents?: MetaItem[]; num_items?: number }) {
  fbq("track", "Purchase", { content_type: "product", currency: "CAD", ...p });
}

export function metaTrackLead(p: { content_name?: string; value?: number; currency?: string }) {
  fbq("track", "Lead", { currency: "CAD", ...p });
}

// ── Server-side (Conversions API) ─────────────────────────────────────

export interface CapiUserData {
  email?: string;
  phone?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;  // _fbp cookie value
  fbc?: string;  // _fbc cookie value (set from fbclid)
  external_id?: string; // customer_id, hashed server-side
}

export interface CapiEvent {
  event_name: "Purchase" | "Lead" | "AddToCart" | "InitiateCheckout" | "ViewContent";
  event_time?: number; // unix seconds
  event_id?: string;   // for client+server dedup — use order_number for Purchase
  action_source?: "website" | "system_generated";
  event_source_url?: string;
  user_data: CapiUserData;
  custom_data?: Record<string, unknown>;
}

export async function sendMetaCapiEvent(event: CapiEvent): Promise<boolean> {
  if (!CAPI_TOKEN) {
    console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN not set — skipping", event.event_name);
    return false;
  }

  const userData: Record<string, unknown> = {};
  if (event.user_data.email) userData.em = [SHA(event.user_data.email)];
  if (event.user_data.phone) userData.ph = [SHA(event.user_data.phone.replace(/\D/g, ""))];
  if (event.user_data.external_id) userData.external_id = [SHA(event.user_data.external_id)];
  if (event.user_data.client_ip_address) userData.client_ip_address = event.user_data.client_ip_address;
  if (event.user_data.client_user_agent) userData.client_user_agent = event.user_data.client_user_agent;
  if (event.user_data.fbp) userData.fbp = event.user_data.fbp;
  if (event.user_data.fbc) userData.fbc = event.user_data.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        event_id: event.event_id,
        action_source: event.action_source ?? "website",
        event_source_url: event.event_source_url ?? "https://truecolorprinting.ca",
        user_data: userData,
        custom_data: event.custom_data ?? {},
      },
    ],
  };
  if (CAPI_TEST_CODE) payload.test_event_code = CAPI_TEST_CODE;

  const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[meta-capi] ${res.status} ${txt}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[meta-capi] fetch failed:", err);
    return false;
  }
}
