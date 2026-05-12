"use client";

import { useEffect } from "react";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const LS_KEY = "tc_utm_first_touch";
const TTL_DAYS = 30;

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

    try {
      const existing = window.localStorage.getItem(LS_KEY);
      if (existing) {
        const parsed = JSON.parse(existing) as { captured_at: number };
        const ageMs = Date.now() - parsed.captured_at;
        if (ageMs < TTL_DAYS * 24 * 60 * 60 * 1000) {
          // First-touch attribution — keep the original. Skip overwrite.
          return;
        }
      }
      window.localStorage.setItem(
        LS_KEY,
        JSON.stringify({ ...captured, captured_at: Date.now() })
      );
    } catch {
      // localStorage may be blocked — fail silent
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
    if (ageMs > TTL_DAYS * 24 * 60 * 60 * 1000) return null;
    const out: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      if (typeof parsed[k] === "string") out[k] = parsed[k] as string;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
