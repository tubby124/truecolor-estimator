export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmAttribution = Partial<Record<UtmKey, string>>;

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
  if (Object.keys(fromHints).length) return fromHints;
  return parseUtmCookie(cookieHeader);
}
