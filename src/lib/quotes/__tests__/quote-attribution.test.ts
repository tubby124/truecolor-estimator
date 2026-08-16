import { describe, expect, it } from "vitest";
import {
  AUTO_LINK_EXCLUDED_LIFECYCLE_STATUSES,
  AUTO_LINK_WINDOW_DAYS,
  CLICK_ID_COLUMNS,
  QUOTE_ATTRIBUTION_COLUMNS,
  QUOTE_ATTRIBUTION_SELECT,
  autoLinkStaffNote,
  autoLinkWindowStartIso,
  extractQuoteProductTexts,
  hasPaidClickId,
  normalizeQuoteEmail,
  pickQuoteAttributionForOrder,
  productsOverlap,
  resolveAutoLinkCandidate,
  shortQuoteRef,
} from "../quote-attribution";

const QUOTE_ID = "aabbccdd-1111-4111-8111-111111111111";
const OTHER_QUOTE_ID = "eeff0011-2222-4222-8222-222222222222";

/** lifecycle_status CHECK constraint, 20260720100000_quote_conversion_measurement.sql:164 */
const LIFECYCLE_STATUSES = ["requested", "quoted", "checkout_started", "won", "lost", "archived"];

describe("pickQuoteAttributionForOrder", () => {
  it("maps every contract column, nulling the ones the quote never captured", () => {
    const mapped = pickQuoteAttributionForOrder({
      gclid: "Cj0KCQ-first-touch",
      utm_source: "google",
      utm_medium: "cpc",
    });
    expect(Object.keys(mapped).sort()).toEqual([...QUOTE_ATTRIBUTION_COLUMNS].sort());
    expect(mapped.gclid).toBe("Cj0KCQ-first-touch");
    expect(mapped.utm_source).toBe("google");
    expect(mapped.latest_paid_gclid).toBeNull();
    expect(mapped.latest_paid_touch_captured_at).toBeNull();
  });

  it("carries the latest-paid touch across when the quote has one", () => {
    const mapped = pickQuoteAttributionForOrder({
      gclid: "first-touch",
      latest_paid_gclid: "latest-touch",
      latest_paid_utm_campaign: "GOOG_Search_TC_CoreProducts_2026",
      latest_paid_touch_captured_at: "2026-08-13T18:04:00.000Z",
      latest_paid_google_loc_physical_ms: 9061103,
    });
    expect(mapped.latest_paid_gclid).toBe("latest-touch");
    expect(mapped.latest_paid_utm_campaign).toBe("GOOG_Search_TC_CoreProducts_2026");
    expect(mapped.latest_paid_touch_captured_at).toBe("2026-08-13T18:04:00.000Z");
    expect(mapped.latest_paid_google_loc_physical_ms).toBe(9061103);
  });

  it("copies nothing but the contract columns, so client-shaped junk cannot ride along", () => {
    const mapped = pickQuoteAttributionForOrder({
      id: QUOTE_ID,
      email: "buyer@example.com",
      total: 999999,
      conversion_type: "quote_won",
      gclid: "real",
    });
    expect(mapped).not.toHaveProperty("id");
    expect(mapped).not.toHaveProperty("email");
    expect(mapped).not.toHaveProperty("total");
    expect(mapped).not.toHaveProperty("conversion_type");
    expect(mapped.gclid).toBe("real");
  });

  it("returns an empty patch for a missing quote row instead of inventing columns", () => {
    expect(pickQuoteAttributionForOrder(null)).toEqual({});
    expect(pickQuoteAttributionForOrder(undefined)).toEqual({});
  });

  it("exposes the same column set as a PostgREST select list", () => {
    expect(QUOTE_ATTRIBUTION_SELECT.split(", ")).toEqual([...QUOTE_ATTRIBUTION_COLUMNS]);
  });
});

describe("hasPaidClickId", () => {
  it("matches only the six identifiers the outbox trigger reads", () => {
    expect([...CLICK_ID_COLUMNS].sort()).toEqual([
      "gbraid", "gclid", "latest_paid_gbraid", "latest_paid_gclid", "latest_paid_wbraid", "wbraid",
    ]);
  });

  it("is true for a first-touch or latest-paid click identifier", () => {
    expect(hasPaidClickId({ gclid: "abc" })).toBe(true);
    expect(hasPaidClickId({ gbraid: "abc" })).toBe(true);
    expect(hasPaidClickId({ wbraid: "abc" })).toBe(true);
    expect(hasPaidClickId({ latest_paid_gclid: "abc" })).toBe(true);
    expect(hasPaidClickId({ latest_paid_gbraid: "abc" })).toBe(true);
    expect(hasPaidClickId({ latest_paid_wbraid: "abc" })).toBe(true);
  });

  it("is false for UTM-only, blank, or absent attribution", () => {
    expect(hasPaidClickId({ utm_source: "google", utm_medium: "cpc" })).toBe(false);
    expect(hasPaidClickId({ gclid: "", latest_paid_gclid: "   " })).toBe(false);
    expect(hasPaidClickId({ gclid: null, gbraid: undefined })).toBe(false);
    expect(hasPaidClickId({})).toBe(false);
    expect(hasPaidClickId(null)).toBe(false);
  });

  it("detects a copy that dropped the click ID the quote actually had", () => {
    const quote = { gclid: "Cj0KCQ", utm_source: "google" };
    // Simulates schema drift: the fetched row no longer exposes the column.
    const dropped = pickQuoteAttributionForOrder({ utm_source: "google" });
    expect(hasPaidClickId(quote)).toBe(true);
    expect(hasPaidClickId(dropped)).toBe(false);
    expect(hasPaidClickId(pickQuoteAttributionForOrder(quote))).toBe(true);
  });
});

describe("auto-link candidate resolution", () => {
  it("links when exactly one open quote matches", () => {
    const decision = resolveAutoLinkCandidate([{ id: QUOTE_ID, gclid: "abc" }]);
    expect(decision).toEqual({ kind: "linked", quote: { id: QUOTE_ID, gclid: "abc" } });
  });

  it("links nothing when the customer has no open quote", () => {
    expect(resolveAutoLinkCandidate([])).toEqual({ kind: "none" });
    expect(resolveAutoLinkCandidate(null)).toEqual({ kind: "none" });
    expect(resolveAutoLinkCandidate(undefined)).toEqual({ kind: "none" });
  });

  it("refuses to guess between multiple open quotes and reports every id", () => {
    const decision = resolveAutoLinkCandidate([
      { id: QUOTE_ID },
      { id: OTHER_QUOTE_ID },
    ]);
    expect(decision).toEqual({
      kind: "ambiguous",
      quoteRequestIds: [QUOTE_ID, OTHER_QUOTE_ID],
    });
  });

  it("ignores rows without a usable id rather than linking to them", () => {
    const decision = resolveAutoLinkCandidate([
      { id: "" } as { id: string },
      { id: QUOTE_ID },
    ]);
    expect(decision).toEqual({ kind: "linked", quote: { id: QUOTE_ID } });
  });
});

describe("auto-link window and provenance", () => {
  it("looks back exactly 30 days", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    expect(AUTO_LINK_WINDOW_DAYS).toBe(30);
    expect(autoLinkWindowStartIso(now)).toBe("2026-07-16T12:00:00.000Z");
  });

  it("excludes only real lifecycle_status values, and never an open one", () => {
    for (const status of AUTO_LINK_EXCLUDED_LIFECYCLE_STATUSES) {
      expect(LIFECYCLE_STATUSES).toContain(status);
    }
    for (const open of ["requested", "quoted", "checkout_started"]) {
      expect(AUTO_LINK_EXCLUDED_LIFECYCLE_STATUSES).not.toContain(open);
    }
  });

  it("stamps a short, non-PII provenance note staff can read on the order", () => {
    expect(shortQuoteRef(QUOTE_ID)).toBe("aabbccdd");
    expect(autoLinkStaffNote(QUOTE_ID)).toBe(" · auto-linked to web quote aabbccdd by email match");
    expect(autoLinkStaffNote(QUOTE_ID)).not.toContain(QUOTE_ID);
  });

  it("normalizes emails the same way the customer upsert does", () => {
    expect(normalizeQuoteEmail("  Buyer@Example.COM ")).toBe("buyer@example.com");
    expect(normalizeQuoteEmail(null)).toBe("");
  });
});

/**
 * The email match only proves the customer. Product overlap is what keeps a
 * walk-in order for an unrelated job from inheriting a quote's click ID.
 */
describe("productsOverlap", () => {
  it("links when the order and the quote name the same product", () => {
    expect(productsOverlap(["Stickers / Vinyl Decals"], ["Custom Stickers"])).toBe(true);
  });

  it("treats known synonyms as the same product family", () => {
    expect(productsOverlap(["Vinyl Decals"], ["stickers"])).toBe(true);
    expect(productsOverlap(["Coroplast Yard Signs"], ["ACP sign"])).toBe(true);
  });

  it("refuses to link two unrelated jobs by the same customer", () => {
    expect(productsOverlap(["Retractable Banner"], ["Business Cards"])).toBe(false);
  });

  it("never matches on filler words every job description shares", () => {
    expect(productsOverlap(["Custom Printing"], ["custom printing job"])).toBe(false);
  });

  it("is false when either side has no product words at all", () => {
    expect(productsOverlap(["Stickers"], [])).toBe(false);
    expect(productsOverlap([], ["Stickers"])).toBe(false);
    expect(productsOverlap(["Other"], ["Stickers"])).toBe(false);
  });
});

describe("extractQuoteProductTexts", () => {
  /** Shape written by src/app/api/quote-request/route.ts — all values strings. */
  const quoteItems = [
    {
      product: "Vinyl Banners",
      qty: "2",
      material: "13oz vinyl",
      dimensions: "3ft x 6ft",
      sides: "1",
      notes: "grommets",
    },
  ];

  it("reads the product names out of the stored items JSON", () => {
    expect(extractQuoteProductTexts({ id: QUOTE_ID, items: quoteItems })).toEqual(["Vinyl Banners"]);
  });

  it("ignores the customer name and other non-product columns", () => {
    const texts = extractQuoteProductTexts({
      id: QUOTE_ID,
      name: "Business Card Signs Ltd",
      email: "buyer@example.com",
      items: quoteItems,
    });
    expect(texts).toEqual(["Vinyl Banners"]);
  });

  it("returns nothing for a quote with no usable items", () => {
    expect(extractQuoteProductTexts({ id: QUOTE_ID, items: [] })).toEqual([]);
    expect(extractQuoteProductTexts({ id: QUOTE_ID })).toEqual([]);
    expect(extractQuoteProductTexts({ id: QUOTE_ID, items: [null, "x", { qty: "2" }] })).toEqual([]);
    expect(extractQuoteProductTexts(null)).toEqual([]);
  });

  it("feeds the overlap guard straight from a candidate row", () => {
    const quote = { id: QUOTE_ID, items: quoteItems };
    expect(productsOverlap(["Vinyl Banner"], extractQuoteProductTexts(quote))).toBe(true);
    expect(productsOverlap(["Business Cards"], extractQuoteProductTexts(quote))).toBe(false);
  });
});
