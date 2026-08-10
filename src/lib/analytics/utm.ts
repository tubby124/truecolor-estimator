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
export const LATEST_PAID_COOKIE_NAME = "tc_utm_latest_paid_touch";
export const UTM_TTL_DAYS = 30;
// Google Ads accepts offline conversions up to 90 days after the click, so a paid
// touch stays usable for three times as long as a first-touch session marker.
export const PAID_TOUCH_TTL_DAYS = 90;
// Client submit payloads carry the latest paid touch under this prefix so it can
// never collide with the flat first-touch fields already in the same payload.
export const LATEST_PAID_HINT_PREFIX = "latest_paid_";
const DAY_MS = 24 * 60 * 60 * 1000;
// Keep below common 4 KB cookie limits (matches the client writer in UtmCapture).
const MAX_ENCODED_COOKIE_LENGTH = 3800;

export interface PaidAttributionTouch {
  attribution: UtmAttribution;
  capturedAt: string;
}

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
    if (value && CLICK_ID_RE.test(value)) {
      out[key] = value;
      break;
    }
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

export function isPaidAttribution(attribution: UtmAttribution): boolean {
  if (attribution.gclid || attribution.gbraid || attribution.wbraid) return true;
  const medium = attribution.utm_medium?.trim().toLowerCase();
  return medium === "cpc" || medium === "ppc" || medium === "paid" ||
    medium === "paid_search" || medium === "search_ads";
}

export function parseStoredPaidAttributionTouch(
  raw: string | null | undefined,
): PaidAttributionTouch | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const capturedAtMs = Number(parsed.captured_at ?? 0);
    const age = Date.now() - capturedAtMs;
    if (!capturedAtMs || age < 0 || age > PAID_TOUCH_TTL_DAYS * DAY_MS) return null;
    const attribution = sanitizeUtm(parsed);
    if (!isPaidAttribution(attribution)) return null;
    return { attribution, capturedAt: new Date(capturedAtMs).toISOString() };
  } catch {
    return null;
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

export function parseLatestPaidAttributionCookie(
  cookieHeader: string | null | undefined,
): PaidAttributionTouch | null {
  if (!cookieHeader) return null;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LATEST_PAID_COOKIE_NAME}=`));
  if (!cookie) return null;
  try {
    return parseStoredPaidAttributionTouch(
      decodeURIComponent(cookie.slice(LATEST_PAID_COOKIE_NAME.length + 1)),
    );
  } catch {
    return null;
  }
}

export function mergeUtmAttribution(
  hints: Record<string, unknown>,
  cookieHeader: string | null | undefined,
): UtmAttribution {
  const fromHints = sanitizeUtm(hints);
  const fromCookie = parseUtmCookie(cookieHeader);
  // Preserve fresh first-touch attribution; request hints only fill fields the
  // cookie does not contain or act as the fallback when the cookie is unusable.
  const merged: Record<string, unknown> = { ...fromHints, ...fromCookie };
  if (Object.keys(fromCookie).length > 0) {
    for (const key of ["gclid", "gbraid", "wbraid"] as const) {
      if (!fromCookie[key]) delete merged[key];
    }
  }
  return sanitizeUtm(merged);
}

function latestPaidTouchFromHints(hints: Record<string, unknown>): {
  touch: PaidAttributionTouch;
  /** Only set when the caller sent a real capture timestamp (prefixed hints). */
  explicitCapturedAt: number | null;
} | null {
  const attribution = sanitizeUtm(hints);
  if (!isPaidAttribution(attribution)) return null;
  const raw = Number(hints.captured_at ?? 0);
  const age = Date.now() - raw;
  const explicitCapturedAt =
    raw > 0 && age >= 0 && age <= PAID_TOUCH_TTL_DAYS * DAY_MS ? raw : null;
  return {
    touch: {
      attribution,
      capturedAt: new Date(explicitCapturedAt ?? Date.now()).toISOString(),
    },
    explicitCapturedAt,
  };
}

export function mergeLatestPaidAttribution(
  hints: Record<string, unknown>,
  cookieHeader: string | null | undefined,
): PaidAttributionTouch | null {
  const fromCookie = parseLatestPaidAttributionCookie(cookieHeader);
  const fromHints = latestPaidTouchFromHints(hints);
  if (!fromCookie) return fromHints?.touch ?? null;
  // The cookie wins by default: legacy callers pass first-touch fields with no
  // capture timestamp, and those must never displace a server-written paid click.
  // A hint only wins when it carries its own timestamp that is provably newer —
  // that happens when localStorage survived an ITP cookie eviction.
  if (
    fromHints?.explicitCapturedAt != null &&
    fromHints.explicitCapturedAt > Date.parse(fromCookie.capturedAt)
  ) {
    return fromHints.touch;
  }
  return fromCookie;
}

export type LatestPaidHintPayload = Partial<
  Record<`${typeof LATEST_PAID_HINT_PREFIX}${(typeof ATTRIBUTION_KEYS)[number]}` | "latest_paid_captured_at", string>
>;

/** Flattens a stored paid touch into prefixed fields for a JSON submit body. */
export function toLatestPaidHintPayload(
  touch: PaidAttributionTouch | null,
): LatestPaidHintPayload {
  if (!touch) return {};
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = touch.attribution[key];
    if (value) out[`${LATEST_PAID_HINT_PREFIX}${key}`] = value;
  }
  if (!Object.keys(out).length) return {};
  const capturedAt = Date.parse(touch.capturedAt);
  if (Number.isFinite(capturedAt)) {
    out[`${LATEST_PAID_HINT_PREFIX}captured_at`] = String(capturedAt);
  }
  return out as LatestPaidHintPayload;
}

/** Same payload as `toLatestPaidHintPayload`, appended to a multipart submit. */
export function appendLatestPaidAttributionToFormData(
  formData: { append(name: string, value: string): void },
  touch: PaidAttributionTouch | null,
): void {
  for (const [key, value] of Object.entries(toLatestPaidHintPayload(touch))) {
    if (value) formData.append(key, value);
  }
}

/**
 * Server-side reader for the prefixed hints above. `get` accepts either a JSON
 * body lookup or `FormData.get`, so both submit shapes share one whitelist.
 */
export function collectLatestPaidHints(
  get: (name: string) => unknown,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = get(`${LATEST_PAID_HINT_PREFIX}${key}`);
    if (value != null && value !== "") out[key] = value;
  }
  if (!Object.keys(out).length) return {};
  const capturedAt = get(`${LATEST_PAID_HINT_PREFIX}captured_at`);
  if (capturedAt != null && capturedAt !== "") out.captured_at = Number(capturedAt);
  return out;
}

function serializeAttributionCookie(
  name: string,
  attribution: UtmAttribution,
  capturedAt: number,
  maxAgeSeconds: number,
  secure: boolean,
): string | null {
  const attempts: UtmAttribution[] = [attribution];
  if (attribution.landing_referrer) {
    const withoutReferrer = { ...attribution };
    delete withoutReferrer.landing_referrer;
    attempts.push(withoutReferrer);
  }
  for (const candidate of attempts) {
    const encoded = encodeURIComponent(
      JSON.stringify({ ...candidate, captured_at: capturedAt }),
    );
    if (encoded.length <= MAX_ENCODED_COOKIE_LENGTH) {
      return `${name}=${encoded}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
    }
  }
  return null;
}

export interface AttributionCookieContext {
  /** Upstream referrer for the landing hit (request `Referer` header). */
  referrer?: string | null;
  now?: number;
  secure?: boolean;
}

/**
 * Server-side click capture. Produces raw `Set-Cookie` strings in exactly the
 * format `parseLatestPaidAttributionCookie` / `parseUtmCookie` already read, so
 * the middleware never needs a second cookie or a second parser.
 *
 * Returns `[]` unless the URL carries a click ID. That gate is what makes a plain
 * overwrite of the latest-paid cookie correct: a URL-borne gclid/gbraid/wbraid IS
 * the click that just happened, so no stored value can be fresher than it.
 * First touch keeps its opposite semantics — written only when absent.
 */
export function buildAttributionSetCookies(
  url: URL,
  cookieHeader: string | null | undefined,
  context: AttributionCookieContext = {},
): string[] {
  const input: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = url.searchParams.get(key);
    if (value) input[key] = value;
  }

  const clickOnly = sanitizeUtm(input);
  if (!clickOnly.gclid && !clickOnly.gbraid && !clickOnly.wbraid) return [];

  const now = context.now ?? Date.now();
  const secure = context.secure ?? url.protocol === "https:";
  const attribution = sanitizeUtm({
    ...input,
    landing_path: url.pathname + url.search,
    landing_referrer: context.referrer ?? undefined,
  });

  const cookies: string[] = [];
  const latestPaid = serializeAttributionCookie(
    LATEST_PAID_COOKIE_NAME,
    attribution,
    now,
    PAID_TOUCH_TTL_DAYS * 24 * 60 * 60,
    secure,
  );
  if (latestPaid) cookies.push(latestPaid);

  // First touch is never overwritten — only planted when the visitor has none
  // that still parses (matches UtmCapture's client-side semantics).
  if (Object.keys(parseUtmCookie(cookieHeader)).length === 0) {
    const firstTouch = serializeAttributionCookie(
      UTM_COOKIE_NAME,
      attribution,
      now,
      UTM_TTL_DAYS * 24 * 60 * 60,
      secure,
    );
    if (firstTouch) cookies.push(firstTouch);
  }

  return cookies;
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
