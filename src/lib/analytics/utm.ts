export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export const PAID_ATTRIBUTION_KEYS = [
  "gclid", "gbraid", "wbraid", "keyword", "matchtype", "device",
  "loc_physical_ms", "loc_interest_ms", "adgroupid", "creative", "campaignid", "network",
] as const;
export const ATTRIBUTION_KEYS = [...UTM_KEYS, ...PAID_ATTRIBUTION_KEYS] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type PaidAttributionKey = (typeof PAID_ATTRIBUTION_KEYS)[number];
export type UtmAttribution = Partial<Record<UtmKey | PaidAttributionKey, string>> & {
  landing_path?: string;       // first-touch path on this site (e.g. /products/vinyl-banners)
  landing_referrer?: string;   // true upstream document.referrer at first touch (e.g. google.com/...)
};

export const UTM_COOKIE_NAME = "tc_utm_first_touch";
export const UTM_TTL_DAYS = 30;

function clean(value: unknown, maxLength = 100): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return undefined;
  return trimmed.slice(0, maxLength);
}

const CLICK_ID_RE = /^[A-Za-z0-9._~-]{1,200}$/;
const NUMERIC_ID_RE = /^\d{1,30}$/;
const ENUM_VALUES = {
  matchtype: new Set(["e", "p", "b"]),
  device: new Set(["c", "m", "t"]),
  network: new Set(["g", "s", "d", "ytv", "vp", "gtv", "x", "e"]),
} as const;

export function sanitizeUtm(input: Record<string, unknown>): UtmAttribution {
  const out: UtmAttribution = {};
  for (const key of UTM_KEYS) {
    const value = clean(input[key], key === "utm_content" || key === "utm_term" ? 150 : 100);
    if (value) out[key] = value;
  }
  for (const key of ["gclid", "gbraid", "wbraid"] as const) {
    const value = clean(input[key], 200);
    if (value && CLICK_ID_RE.test(value)) out[key] = value;
  }
  const keyword = clean(input.keyword, 150);
  if (keyword) out.keyword = keyword;
  for (const key of ["matchtype", "device", "network"] as const) {
    const value = clean(input[key], 10)?.toLowerCase();
    if (value && ENUM_VALUES[key].has(value as never)) out[key] = value;
  }
  for (const key of ["loc_physical_ms", "loc_interest_ms", "adgroupid", "creative", "campaignid"] as const) {
    const value = clean(input[key], 30);
    if (value && NUMERIC_ID_RE.test(value)) out[key] = value;
  }
  const lp = clean(input.landing_path, 200);
  if (lp) out.landing_path = lp;
  const lr = clean(input.landing_referrer, 500);
  if (lr) out.landing_referrer = lr;
  return out;
}

export function parseStoredAttribution(raw: string | null | undefined): UtmAttribution {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const capturedAt = Number(parsed.captured_at ?? 0);
    const age = Date.now() - capturedAt;
    if (!capturedAt || age < 0 || age > UTM_TTL_DAYS * 24 * 60 * 60 * 1000) return {};
    return sanitizeUtm(parsed);
  } catch {
    return {};
  }
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
    return parseStoredAttribution(decodeURIComponent(encoded));
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

export function appendAttributionToFormData(
  formData: { append(name: string, value: string): void },
  attribution: UtmAttribution | null,
): void {
  if (!attribution) return;
  for (const key of ATTRIBUTION_KEYS) {
    const value = attribution[key];
    if (value) formData.append(key, value);
  }
}
