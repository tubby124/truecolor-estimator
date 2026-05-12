// GA4 Measurement Protocol — server-side event sender
// Fires events directly to GA4 from server context, bypassing client gtag.
// Captures orders that client-side gtag misses (ad blockers, ITP, corp networks).

import { createHash } from "crypto";

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

export interface MpItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

export interface MpEventParams {
  event_name: string;
  client_id?: string;
  user_id?: string;
  event_timestamp_micros?: number;
  params: Record<string, unknown> & { items?: MpItem[] };
}

// Deterministic client_id when no cookie is available — keeps a single customer
// stable across server-side events even without their browser fingerprint.
function deriveClientId(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  // GA4 client_id format: <random>.<timestamp> — 10 digits each is enough
  return `${hash.slice(0, 10)}.${hash.slice(10, 20)}`;
}

export async function sendMeasurementProtocolEvent(input: MpEventParams & { debug?: boolean }): Promise<boolean> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn("[ga4-mp] missing NEXT_PUBLIC_GA4_MEASUREMENT_ID or GA4_API_SECRET — skipping event", input.event_name);
    return false;
  }

  const clientId = input.client_id ?? deriveClientId(input.user_id ?? input.event_name + Date.now().toString());

  const body: Record<string, unknown> = {
    client_id: clientId,
    events: [
      {
        name: input.event_name,
        params: input.params,
      },
    ],
  };

  if (input.user_id) body.user_id = input.user_id;
  if (input.event_timestamp_micros) {
    (body.events as Array<Record<string, unknown>>)[0].timestamp_micros = input.event_timestamp_micros;
  }

  const endpoint = input.debug ? DEBUG_ENDPOINT : MP_ENDPOINT;
  const url = `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (input.debug) {
      const text = await res.text();
      console.log("[ga4-mp-debug]", res.status, text);
      return res.ok;
    }

    // Non-debug endpoint always returns 204 No Content — fire-and-forget
    return res.ok;
  } catch (err) {
    console.error("[ga4-mp] fetch failed:", err);
    return false;
  }
}

export function deriveClientIdFromCustomer(customerId: string): string {
  return deriveClientId(`tc-customer:${customerId}`);
}
