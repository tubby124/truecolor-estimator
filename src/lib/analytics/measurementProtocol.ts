// GA4 Measurement Protocol — server-side event sender
// Fires events directly to GA4 from server context, bypassing client gtag.
// Captures orders that client-side gtag misses (ad blockers, ITP, corp networks).

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

export interface MpPurchaseParams {
  transaction_id: string;
  value: number;
  customer_id?: string | null;
  ga_client_id?: string | null;
  ga_session_id?: string | null;
  ga_session_number?: string | null;
  ga_context_captured_at?: string | null;
  payment_type?: string;
  tax?: number;
  items?: MpItem[];
}

const GA_CLIENT_ID_RE = /^\d{1,20}\.\d{1,20}$/;
const GA_SESSION_ID_RE = /^\d{1,20}$/;
const SESSION_CONTEXT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function sendMeasurementProtocolEvent(input: MpEventParams & { debug?: boolean }): Promise<boolean> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn("[ga4-mp] missing NEXT_PUBLIC_GA4_MEASUREMENT_ID or GA4_API_SECRET — skipping event", input.event_name);
    return false;
  }

  if (!input.client_id || !GA_CLIENT_ID_RE.test(input.client_id)) {
    console.warn("[ga4-mp] missing or invalid client_id — skipping event", input.event_name);
    return false;
  }
  const clientId = input.client_id;

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

export function sendMeasurementProtocolPurchase(input: MpPurchaseParams): Promise<boolean> {
  const clientId = input.ga_client_id?.trim();
  if (!clientId || !GA_CLIENT_ID_RE.test(clientId)) {
    // A made-up client ID turns legitimate server purchases into "Unassigned"
    // revenue. A legacy/manual order with no browser context is intentionally
    // omitted from GA4 instead; accounting and the durable order ledger remain
    // the source of truth for those sales.
    console.info("[ga4-mp] purchase has no browser GA context — intentionally omitted");
    return Promise.resolve(true);
  }

  const capturedAt = input.ga_context_captured_at ? new Date(input.ga_context_captured_at).getTime() : Number.NaN;
  const sessionFresh = Number.isFinite(capturedAt) && Date.now() - capturedAt <= SESSION_CONTEXT_MAX_AGE_MS;
  const sessionId = input.ga_session_id?.trim();
  const sessionNumber = input.ga_session_number?.trim();
  return sendMeasurementProtocolEvent({
    event_name: "purchase",
    client_id: clientId,
    params: {
      transaction_id: input.transaction_id,
      value: input.value,
      currency: "CAD",
      ...(sessionFresh && sessionId && GA_SESSION_ID_RE.test(sessionId) ? { session_id: sessionId } : {}),
      ...(sessionFresh && sessionNumber && GA_SESSION_ID_RE.test(sessionNumber) ? { session_number: sessionNumber } : {}),
      ...(sessionFresh && sessionId && GA_SESSION_ID_RE.test(sessionId) ? { engagement_time_msec: 1 } : {}),
      ...(input.payment_type ? { payment_type: input.payment_type } : {}),
      ...(input.tax !== undefined ? { tax: input.tax } : {}),
      items: input.items ?? [],
    },
  });
}
