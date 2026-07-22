"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_KEYS,
  isPaidAttribution,
  LATEST_PAID_COOKIE_NAME,
  parseStoredAttribution,
  sanitizeUtm,
  type UtmAttribution,
  UTM_COOKIE_NAME,
  UTM_TTL_DAYS,
} from "@/lib/analytics/utm";

const LS_KEY = "tc_utm_first_touch";
const LATEST_PAID_LS_KEY = "tc_utm_latest_paid_touch";

function persistAttribution(
  payload: Record<string, string | number>,
  cookieName = UTM_COOKIE_NAME,
  storageKey = LS_KEY,
) {
  const maxAge = UTM_TTL_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(JSON.stringify(payload));
  // Keep below common 4 KB cookie limits. localStorage still retains the full,
  // sanitized payload when an unusually long encoded referrer exceeds this bound.
  if (encoded.length <= 3800) {
    document.cookie = `${cookieName}=${encoded}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Cookie fallback above is enough for server-side attribution.
  }
}

export function UtmCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);

    // 1. Collect any UTM params present on the URL.
    const attributionInput: Record<string, string> = {};
    for (const k of ATTRIBUTION_KEYS) {
      const v = sp.get(k);
      if (v) attributionInput[k] = v;
    }

    // 2. Always capture landing path + true upstream referrer on first visit,
    //    even when no UTM params are present. This is what fixes "referrer_source
    //    = internal" on organic-search / direct arrivals: by the time the order
    //    POST fires from /checkout, the Referer header is self-domain. The cookie
    //    we set here preserves the actual entry point for the whole session.
    const landingPath = window.location.pathname + window.location.search;
    const referrer = document.referrer ?? "";
    const currentAttribution = sanitizeUtm({
      ...attributionInput,
      landing_path: landingPath,
      landing_referrer: referrer,
    });

    // Latest paid touch is intentionally independent of first touch. A returning
    // visitor's new paid click must not be suppressed by an older organic/direct
    // arrival that still lives in first-touch storage.
    if (isPaidAttribution(currentAttribution)) {
      persistAttribution(
        { ...currentAttribution, captured_at: Date.now() },
        LATEST_PAID_COOKIE_NAME,
        LATEST_PAID_LS_KEY,
      );
    }

    // 3. If a first-touch already exists and is still fresh, only refresh the cookie
    //    (don't overwrite — first-touch attribution wins).
    let existing: Record<string, string | number> | null = null;
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown> & { captured_at?: number };
        const sanitized = parseStoredAttribution(raw);
        if (Object.keys(sanitized).length > 0) {
          existing = { ...sanitized, captured_at: Number(parsed.captured_at) };
        }
      }
    } catch {
      // localStorage may be blocked — proceed to fresh capture.
    }

    if (existing) {
      // Refresh cookie TTL with the existing payload — never overwrite first touch.
      persistAttribution(existing);
      return;
    }

    // 4. Fresh first-touch — write the cookie even if utm is empty.
    try {
      persistAttribution({
        ...currentAttribution,
        captured_at: Date.now(),
      });
    } catch {
      // Browser storage may be blocked — attribution capture must never block browsing.
    }
  }, []);

  return null;
}

export function readUtmFromStorage(): UtmAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const out = parseStoredAttribution(raw);
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
