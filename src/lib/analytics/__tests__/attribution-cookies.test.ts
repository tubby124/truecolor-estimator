import { describe, expect, it } from "vitest";
import {
  buildAttributionSetCookies,
  LATEST_PAID_COOKIE_NAME,
  parseLatestPaidAttributionCookie,
  parseUtmCookie,
  UTM_COOKIE_NAME,
} from "../utm";

const NOW = Date.parse("2026-08-10T12:00:00.000Z");

function build(search: string, cookieHeader?: string | null, referrer?: string | null) {
  return buildAttributionSetCookies(
    new URL(`https://truecolorprinting.ca/coroplast-signs-saskatoon${search}`),
    cookieHeader,
    { now: NOW, referrer },
  );
}

function cookieHeaderFrom(setCookies: string[]): string {
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

describe("buildAttributionSetCookies (middleware server-side click capture)", () => {
  it("sets latest-paid and first-touch cookies for a gclid landing", () => {
    const cookies = build("?gclid=EAIaIQobCh_123&utm_source=google&utm_medium=cpc");

    expect(cookies).toHaveLength(2);
    expect(cookies[0].startsWith(`${LATEST_PAID_COOKIE_NAME}=`)).toBe(true);
    expect(cookies[1].startsWith(`${UTM_COOKIE_NAME}=`)).toBe(true);
  });

  it.each(["gclid", "gbraid", "wbraid"])("captures a %s click", (param) => {
    const cookies = build(`?${param}=Click.123~abc`);
    const touch = parseLatestPaidAttributionCookie(cookieHeaderFrom(cookies));
    expect(touch?.attribution[param as "gclid"]).toBe("Click.123~abc");
  });

  it("sets nothing when the URL carries no click ID", () => {
    expect(build("")).toEqual([]);
    expect(build("?utm_source=google&utm_medium=cpc&utm_campaign=coroplast")).toEqual([]);
  });

  it("sets nothing when the click ID is malformed", () => {
    expect(build("?gclid=not%20a%20click%20id!")).toEqual([]);
  });

  it("never overwrites an existing first-touch cookie", () => {
    const existingFirstTouch = `${UTM_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify({ utm_source: "chatgpt.com", utm_medium: "referral", captured_at: NOW - 1000 }),
    )}`;

    const cookies = build("?gclid=fresh_click", existingFirstTouch);

    expect(cookies).toHaveLength(1);
    expect(cookies[0].startsWith(`${LATEST_PAID_COOKIE_NAME}=`)).toBe(true);
    expect(cookies.some((c) => c.startsWith(`${UTM_COOKIE_NAME}=`))).toBe(false);
  });

  it("replants first touch when the existing cookie is stale or unusable", () => {
    const expired = `${UTM_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify({ utm_source: "google", captured_at: Date.now() - 31 * 24 * 60 * 60 * 1000 }),
    )}`;

    expect(build("?gclid=fresh_click", expired)).toHaveLength(2);
    expect(build("?gclid=fresh_click", `${UTM_COOKIE_NAME}=not-json`)).toHaveLength(2);
  });

  it("overwrites the latest-paid cookie on every new click", () => {
    const olderPaid = `${LATEST_PAID_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify({ gclid: "older_click", captured_at: NOW - 60_000 }),
    )}`;

    const cookies = build("?gclid=newer_click", olderPaid);
    const touch = parseLatestPaidAttributionCookie(cookieHeaderFrom(cookies));

    expect(touch?.attribution.gclid).toBe("newer_click");
  });

  it("round-trips through the existing utm.ts parsers unchanged", () => {
    const cookies = build(
      "?gclid=EAIaIQobCh_123&utm_source=google&utm_medium=cpc&utm_campaign=coroplast&keyword=coroplast%20signs&matchtype=e&device=m&campaignid=42&network=g",
      null,
      "https://www.google.com/",
    );
    const header = cookieHeaderFrom(cookies);

    expect(parseLatestPaidAttributionCookie(header)).toEqual({
      attribution: {
        gclid: "EAIaIQobCh_123",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "coroplast",
        keyword: "coroplast signs",
        matchtype: "e",
        device: "m",
        campaignid: "42",
        network: "g",
        landing_path: "/coroplast-signs-saskatoon",
        landing_referrer: "https://www.google.com",
      },
      capturedAt: new Date(NOW).toISOString(),
    });

    expect(parseUtmCookie(header).gclid).toBe("EAIaIQobCh_123");
    expect(parseUtmCookie(header).landing_referrer).toBe("https://www.google.com");
  });

  it("carries a 90-day latest-paid TTL, a 30-day first-touch TTL, and Lax/Secure/Path flags", () => {
    const [latestPaid, firstTouch] = build("?gclid=fresh_click");

    expect(latestPaid).toContain(`; Max-Age=${90 * 24 * 60 * 60}`);
    expect(firstTouch).toContain(`; Max-Age=${30 * 24 * 60 * 60}`);
    for (const cookie of [latestPaid, firstTouch]) {
      expect(cookie).toContain("; Path=/");
      expect(cookie).toContain("; SameSite=Lax");
      expect(cookie).toContain("; Secure");
      // HttpOnly would make the browser reject UtmCapture's own client-side write
      // to the same cookie name on client-side navigations that skip middleware.
      expect(cookie).not.toContain("HttpOnly");
    }
  });

  it("omits Secure on a non-https origin so local dev still captures", () => {
    const cookies = buildAttributionSetCookies(
      new URL("http://localhost:3000/?gclid=fresh_click"),
      null,
      { now: NOW },
    );
    expect(cookies[0]).not.toContain("Secure");
  });

  it("keeps encoded cookie values under the 4 KB browser limit", () => {
    const cookies = build(
      `?gclid=${"c".repeat(200)}&utm_term=${"t".repeat(300)}&utm_content=${"x".repeat(300)}`,
      null,
      `https://example.com/${"r".repeat(900)}`,
    );
    for (const cookie of cookies) {
      expect(cookie.split(";")[0].length).toBeLessThanOrEqual(3800 + LATEST_PAID_COOKIE_NAME.length + 1);
    }
    expect(parseLatestPaidAttributionCookie(cookieHeaderFrom(cookies))?.attribution.gclid).toHaveLength(200);
  });
});
