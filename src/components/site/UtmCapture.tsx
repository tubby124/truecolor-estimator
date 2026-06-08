"use client";

import { useEffect } from "react";
import { UTM_COOKIE_NAME, UTM_KEYS, UTM_TTL_DAYS } from "@/lib/analytics/utm";

const LS_KEY = "tc_utm_first_touch";

function persistAttribution(payload: Record<string, string | number>) {
  const maxAge = UTM_TTL_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;

  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    // Cookie fallback above is enough for server-side attribution.
  }
}

export function UtmCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);

    // 1. Collect any UTM params present on the URL.
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = sp.get(k);
      if (v) utm[k] = v;
    }

    // 2. Always capture landing path + true upstream referrer on first visit,
    //    even when no UTM params are present. This is what fixes "referrer_source
    //    = internal" on organic-search / direct arrivals: by the time the order
    //    POST fires from /checkout, the Referer header is self-domain. The cookie
    //    we set here preserves the actual entry point for the whole session.
    const landingPath = window.location.pathname + window.location.search;
    const referrer = document.referrer ?? "";

    // 3. If a first-touch already exists and is still fresh, only refresh the cookie
    //    (don't overwrite — first-touch attribution wins).
    let existing: Record<string, unknown> | null = null;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown> & { captured_at?: number };
        const ageMs = Date.now() - Number(parsed.captured_at ?? 0);
        if (ageMs < UTM_TTL_DAYS * 24 * 60 * 60 * 1000) {
          existing = parsed;
        }
      }
    } catch {
      // localStorage may be blocked — proceed to fresh capture.
    }

    if (existing) {
      // Refresh cookie TTL with the existing payload — never overwrite first touch.
      persistAttribution(existing as Record<string, string | number>);
      return;
    }

    // 4. Fresh first-touch — write the cookie even if utm is empty.
    try {
      persistAttribution({
        ...utm,
        landing_path: landingPath,
        landing_referrer: referrer,
        captured_at: Date.now(),
      });
    } catch {
      // Browser storage may be blocked — attribution capture must never block browsing.
    }
  }, []);

  return null;
}

export function readUtmFromStorage(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string | number>;
    const ageMs = Date.now() - Number(parsed.captured_at ?? 0);
    if (ageMs > UTM_TTL_DAYS * 24 * 60 * 60 * 1000) return null;
    const out: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      if (typeof parsed[k] === "string") out[k] = parsed[k] as string;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
