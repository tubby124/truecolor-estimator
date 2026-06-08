export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmAttribution = Partial<Record<UtmKey, string>> & {
  landing_path?: string;       // first-touch path on this site (e.g. /products/vinyl-banners)
  landing_referrer?: string;   // true upstream document.referrer at first touch (e.g. google.com/...)
};

export const UTM_COOKIE_NAME = "tc_utm_first_touch";
export const UTM_TTL_DAYS = 30;

function clean(value: unknown, maxLength = 100): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

export function sanitizeUtm(input: Record<string, unknown>): UtmAttribution {
  const out: UtmAttribution = {};
  for (const key of UTM_KEYS) {
    const value = clean(input[key], key === "utm_content" || key === "utm_term" ? 150 : 100);
    if (value) out[key] = value;
  }
  const lp = clean(input.landing_path, 200);
  if (lp) out.landing_path = lp;
  const lr = clean(input.landing_referrer, 500);
  if (lr) out.landing_referrer = lr;
  return out;
}

export function parseUtmCookie(cookieHeader: string | null | undefined): UtmAttribution {
  if (!cookieHeader) return {};

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${UTM_COOKIE_NAME}=`));

  if (!cookie) return {};

  try {
    const encoded = cookie.slice(UTM_COOKIE_NAME.length + 1);
    const parsed = JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
    const capturedAt = Number(parsed.captured_at ?? 0);
    if (!capturedAt || Date.now() - capturedAt > UTM_TTL_DAYS * 24 * 60 * 60 * 1000) return {};
    return sanitizeUtm(parsed);
  } catch {
    return {};
  }
}

export function mergeUtmAttribution(
  hints: Record<string, unknown>,
  cookieHeader: string | null | undefined,
): UtmAttribution {
  const fromHints = sanitizeUtm(hints);
  const fromCookie = parseUtmCookie(cookieHeader);
  // Merge: explicit hints win for utm_* keys, cookie fills landing_path/landing_referrer
  // (those only ever come from the cookie set client-side on first visit).
  return { ...fromCookie, ...fromHints };
}
