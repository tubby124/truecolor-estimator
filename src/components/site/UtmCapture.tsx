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

    const captured: Record<string, string> = {};
    let hasAny = false;
    for (const k of UTM_KEYS) {
      const v = sp.get(k);
      if (v) {
        captured[k] = v;
        hasAny = true;
      }
    }

    if (!hasAny) return;

    let existing: string | null = null;
    try {
      existing = window.localStorage.getItem(LS_KEY);
      if (existing) {
        const parsed = JSON.parse(existing) as Record<string, string | number> & { captured_at: number };
        const ageMs = Date.now() - parsed.captured_at;
        if (ageMs < UTM_TTL_DAYS * 24 * 60 * 60 * 1000) {
          // First-touch attribution — keep the original and refresh the cookie fallback.
          persistAttribution(parsed);
          return;
        }
      }
    } catch {
      // localStorage may be blocked — still try the cookie fallback below.
    }

    try {
      persistAttribution({ ...captured, captured_at: Date.now() });
    } catch {
      // Browser storage may be blocked — attribution capture should never block browsing.
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
