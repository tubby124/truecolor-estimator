/**
 * Quote → order paid-search attribution.
 *
 * `materialize_quote_order`
 * (supabase/migrations/20260720100000_quote_conversion_measurement.sql:485-620)
 * copies these columns from `quote_requests` into the order it materializes.
 * Column names are identical on both tables, so a fetched quote row spreads
 * straight into an `orders` insert.
 *
 * Every TypeScript path that turns a website quote into an order must copy the
 * same set from the SERVER-side quote row — never from client input — or the
 * Google Ads conversion outbox trigger
 * (supabase/migrations/20260720110000_google_ads_conversion_outbox.sql:42-96)
 * classifies real revenue as `not_attributable`.
 *
 * The TS ↔ SQL column contract is pinned by
 * src/lib/payment/__tests__/quote-link-contract.test.ts.
 */
export const QUOTE_ATTRIBUTION_COLUMNS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "gbraid", "wbraid", "google_keyword", "google_matchtype",
  "google_device", "google_loc_physical_ms", "google_loc_interest_ms",
  "google_adgroup_id", "google_creative_id", "google_campaign_id", "google_network",
  "latest_paid_utm_source", "latest_paid_utm_medium", "latest_paid_utm_campaign",
  "latest_paid_utm_content", "latest_paid_utm_term", "latest_paid_gclid",
  "latest_paid_gbraid", "latest_paid_wbraid", "latest_paid_google_keyword",
  "latest_paid_google_matchtype", "latest_paid_google_device",
  "latest_paid_google_loc_physical_ms", "latest_paid_google_loc_interest_ms",
  "latest_paid_google_adgroup_id", "latest_paid_google_creative_id",
  "latest_paid_google_campaign_id", "latest_paid_google_network",
  "latest_paid_touch_captured_at",
] as const;

export type QuoteAttributionColumn = (typeof QUOTE_ATTRIBUTION_COLUMNS)[number];
export type OrderAttributionColumns = Record<QuoteAttributionColumn, unknown>;

/** PostgREST select list for the attribution columns. */
export const QUOTE_ATTRIBUTION_SELECT = QUOTE_ATTRIBUTION_COLUMNS.join(", ");

/**
 * The only columns the outbox trigger reads when deciding `pending` vs
 * `not_attributable`. Latest-paid wins as one atomic group, then first touch.
 */
export const CLICK_ID_COLUMNS = [
  "latest_paid_gclid", "latest_paid_gbraid", "latest_paid_wbraid",
  "gclid", "gbraid", "wbraid",
] as const;

/** Auto-link only looks back this far for the customer's own web quote. */
export const AUTO_LINK_WINDOW_DAYS = 30;

/**
 * lifecycle_status values that must never be auto-linked.
 * Enum (20260720100000_quote_conversion_measurement.sql:164):
 * requested | quoted | checkout_started | won | lost | archived.
 * `won` is already converted; `archived`/`lost` are the same terminal states
 * `materialize_quote_order` refuses to pay (QUOTE_NOT_PAYABLE).
 */
export const AUTO_LINK_EXCLUDED_LIFECYCLE_STATUSES = ["won", "lost", "archived"] as const;

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/**
 * Map a `quote_requests` row onto the attribution columns of an `orders`
 * insert. Pure: the caller loads the row server-side by id.
 */
export function pickQuoteAttributionForOrder(
  quoteRow: Record<string, unknown> | null | undefined,
): Partial<OrderAttributionColumns> {
  if (!quoteRow) return {};
  return Object.fromEntries(
    QUOTE_ATTRIBUTION_COLUMNS.map((column) => [column, quoteRow[column] ?? null]),
  ) as Partial<OrderAttributionColumns>;
}

/** True when a row carries at least one Google click identifier. */
export function hasPaidClickId(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false;
  return CLICK_ID_COLUMNS.some((column) => isPresent(row[column]));
}

/** Same normalization the customer upsert uses, so emails join reliably. */
export function normalizeQuoteEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** ISO timestamp for the start of the auto-link lookback window. */
export function autoLinkWindowStartIso(now: Date = new Date()): string {
  return new Date(now.getTime() - AUTO_LINK_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** Short human reference used in staff notes and logs (never the full UUID). */
export function shortQuoteRef(quoteId: string): string {
  return quoteId.slice(0, 8);
}

/** Appended to staff_notes so the linkage is visible without a DB query. */
export function autoLinkStaffNote(quoteId: string): string {
  return ` · auto-linked to web quote ${shortQuoteRef(quoteId)} by email match`;
}

export type QuoteLinkSource = "explicit" | "auto_email_match" | "none";

export interface QuoteCandidate {
  id: string;
  [column: string]: unknown;
}

export type AutoLinkDecision =
  | { kind: "linked"; quote: QuoteCandidate }
  | { kind: "ambiguous"; quoteRequestIds: string[] }
  | { kind: "none" };

/**
 * Decide from the open candidate set. Exactly one open quote links; more than
 * one is reported back to staff instead of guessed at, because picking the
 * wrong quote would move a real click ID onto the wrong sale.
 */
export function resolveAutoLinkCandidate(
  candidates: readonly QuoteCandidate[] | null | undefined,
): AutoLinkDecision {
  const open = (candidates ?? []).filter((row) => typeof row?.id === "string" && row.id !== "");
  if (open.length === 0) return { kind: "none" };
  if (open.length === 1) return { kind: "linked", quote: open[0] };
  return { kind: "ambiguous", quoteRequestIds: open.map((row) => row.id) };
}

/**
 * Product text stored on a `quote_requests` row.
 *
 * The quote form writes `items` as a JSON array of
 * `{ product, qty, material, dimensions, sides, notes }` — every value a string
 * (src/app/api/quote-request/route.ts). `product` is the only product-naming key
 * it has ever written; `category`/`name`/`title` are read defensively so a form
 * change degrades to a missed link instead of a wrong one. The table has no
 * top-level product or category column, and its top-level `name` is the
 * customer's name, so nothing outside `items` is read here.
 */
const QUOTE_ITEM_PRODUCT_KEYS = ["product", "category", "name", "title"] as const;

export function extractQuoteProductTexts(
  quoteRow: Record<string, unknown> | null | undefined,
): string[] {
  const items = quoteRow?.items;
  if (!Array.isArray(items)) return [];
  const texts: string[] = [];
  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    for (const key of QUOTE_ITEM_PRODUCT_KEYS) {
      const value = item[key];
      if (typeof value === "string" && value.trim() !== "") texts.push(value);
    }
  }
  return texts;
}

/**
 * Words that carry no product identity, so "Custom Printing" cannot match
 * "Custom Stickers" on the word every job description shares.
 */
const PRODUCT_STOPWORDS = new Set([
  "and", "the", "for", "with", "custom", "print", "printing", "printed",
  "order", "item", "other", "quote", "job",
]);

/**
 * Words customers and staff use interchangeably for the same product family.
 * Deliberately tiny: a missing alias costs one link, a wrong alias costs a
 * mis-credited conversion.
 */
const PRODUCT_TOKEN_ALIASES: Record<string, string> = {
  sticker: "sticker", decal: "sticker",
  banner: "banner", vinyl: "banner",
  sign: "sign", coroplast: "sign", acp: "sign", aluminum: "sign", aluminium: "sign",
  card: "card", business: "card",
};

function productTokens(texts: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const text of texts) {
    for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 3) continue;
      const singular =
        raw.length > 3 && raw.endsWith("s") && !raw.endsWith("ss") ? raw.slice(0, -1) : raw;
      if (PRODUCT_STOPWORDS.has(singular)) continue;
      tokens.add(PRODUCT_TOKEN_ALIASES[singular] ?? singular);
    }
  }
  return tokens;
}

/**
 * Guard on the email-only auto-link. A shared email proves the customer, not
 * the job: the same buyer can ask online about a banner and walk in for
 * business cards. With no product word in common the manual order would inherit
 * the quote's click ID and credit paid search for a sale the ad never produced,
 * so no overlap means no link.
 */
export function productsOverlap(
  orderProducts: readonly string[],
  quoteProducts: readonly string[],
): boolean {
  const quoteTokens = productTokens(quoteProducts);
  if (quoteTokens.size === 0) return false;
  const orderTokens = productTokens(orderProducts);
  if (orderTokens.size === 0) return false;
  for (const token of quoteTokens) {
    if (orderTokens.has(token)) return true;
  }
  return false;
}

export type AttributionWarning =
  /** Two or more open quotes matched the email — staff decides, we never guess. */
  | { code: "MULTIPLE_OPEN_QUOTES"; quoteRequestIds: string[] }
  /** One open quote matched the email but shares no product with the order. */
  | { code: "POSSIBLE_QUOTE_MATCH_NO_PRODUCT_OVERLAP"; quoteRequestId: string }
  /** A concurrent insert claimed the auto-linked quote; order kept, link dropped. */
  | { code: "AUTO_LINK_LOST_RACE"; quoteRequestId: string };
