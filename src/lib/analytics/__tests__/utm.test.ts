import { describe, expect, it } from "vitest";
import {
  appendAttributionToFormData,
  mergeUtmAttribution,
  parseStoredAttribution,
  parseUtmCookie,
  sanitizeUtm,
  UTM_COOKIE_NAME,
} from "../utm";

describe("UTM attribution helpers", () => {
  it("prefers explicit request hints over the first-touch cookie", () => {
    const cookiePayload = encodeURIComponent(JSON.stringify({
      utm_source: "google_business",
      utm_medium: "gbp_product",
      utm_campaign: "stickers",
      captured_at: Date.now(),
    }));

    const result = mergeUtmAttribution(
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "sticker_post" },
      `${UTM_COOKIE_NAME}=${cookiePayload}`,
    );

    expect(result).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "sticker_post",
    });
  });

  it("falls back to a valid first-touch cookie when no request hints exist", () => {
    const cookiePayload = encodeURIComponent(JSON.stringify({
      utm_source: "google_business",
      utm_medium: "gbp_product",
      utm_campaign: "vehicle_magnets",
      captured_at: Date.now(),
    }));

    expect(parseUtmCookie(`other=1; ${UTM_COOKIE_NAME}=${cookiePayload}`)).toEqual({
      utm_source: "google_business",
      utm_medium: "gbp_product",
      utm_campaign: "vehicle_magnets",
    });
  });

  it("drops expired first-touch cookies", () => {
    const expired = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const cookiePayload = encodeURIComponent(JSON.stringify({
      utm_source: "google_business",
      captured_at: expired,
    }));

    expect(parseUtmCookie(`${UTM_COOKIE_NAME}=${cookiePayload}`)).toEqual({});
  });

  it("preserves landing_path and landing_referrer from the first-touch cookie", () => {
    const cookiePayload = encodeURIComponent(JSON.stringify({
      landing_path: "/products/vinyl-banners",
      landing_referrer: "https://www.google.com/",
      captured_at: Date.now(),
    }));

    expect(parseUtmCookie(`${UTM_COOKIE_NAME}=${cookiePayload}`)).toEqual({
      landing_path: "/products/vinyl-banners",
      landing_referrer: "https://www.google.com/",
    });
  });

  it("merges landing_referrer from cookie alongside explicit utm hints", () => {
    const cookiePayload = encodeURIComponent(JSON.stringify({
      landing_path: "/coroplast-signs-saskatoon",
      landing_referrer: "https://maps.google.com/",
      captured_at: Date.now(),
    }));

    const merged = mergeUtmAttribution(
      { utm_source: "brevo", utm_campaign: "spring_drip" },
      `${UTM_COOKIE_NAME}=${cookiePayload}`,
    );

    expect(merged.utm_source).toBe("brevo");
    expect(merged.utm_campaign).toBe("spring_drip");
    expect(merged.landing_path).toBe("/coroplast-signs-saskatoon");
    expect(merged.landing_referrer).toBe("https://maps.google.com/");
  });

  it("sanitizes click IDs and supported Google ValueTrack fields", () => {
    expect(sanitizeUtm({
      gclid: "  abc_DEF-123  ",
      gbraid: "GBraid.123",
      wbraid: "WBraid~456",
      keyword: "  coroplast signs  ",
      matchtype: "e",
      device: "m",
      loc_physical_ms: "123456",
      loc_interest_ms: "654321",
      adgroupid: "987",
      creative: "456",
      campaignid: "123",
      network: "g",
    })).toEqual({
      gclid: "abc_DEF-123",
      gbraid: "GBraid.123",
      wbraid: "WBraid~456",
      keyword: "coroplast signs",
      matchtype: "e",
      device: "m",
      loc_physical_ms: "123456",
      loc_interest_ms: "654321",
      adgroupid: "987",
      creative: "456",
      campaignid: "123",
      network: "g",
    });
  });

  it("rejects malformed constrained values and non-string values", () => {
    expect(sanitizeUtm({
      gclid: "bad click id!",
      matchtype: "exact",
      device: "phone",
      network: "arbitrary",
      campaignid: "12x",
      adgroupid: 123,
      creative: "",
      loc_physical_ms: "-1",
    })).toEqual({});
  });

  it("truncates free-text attribution fields to their limits", () => {
    const result = sanitizeUtm({ keyword: "k".repeat(200), utm_term: "t".repeat(200) });
    expect(result.keyword).toHaveLength(150);
    expect(result.utm_term).toHaveLength(150);
  });

  it("reads every persisted paid field while the first touch is fresh", () => {
    const result = parseStoredAttribution(JSON.stringify({
      utm_source: "google",
      gclid: "click_123",
      keyword: "yard signs",
      matchtype: "p",
      campaignid: "42",
      captured_at: Date.now(),
    }));

    expect(result).toEqual({
      utm_source: "google",
      gclid: "click_123",
      keyword: "yard signs",
      matchtype: "p",
      campaignid: "42",
    });
  });

  it("rejects expired or malformed persisted attribution", () => {
    const expired = Date.now() - 31 * 24 * 60 * 60 * 1000;
    expect(parseStoredAttribution(JSON.stringify({ gclid: "click_123", captured_at: expired }))).toEqual({});
    expect(parseStoredAttribution("not-json")).toEqual({});
  });

  it("lets explicit paid hints override cookie values while retaining first-touch landing data", () => {
    const cookiePayload = encodeURIComponent(JSON.stringify({
      gclid: "cookie-click",
      keyword: "cookie keyword",
      landing_path: "/signs",
      captured_at: Date.now(),
    }));

    expect(mergeUtmAttribution(
      { gclid: "request-click", keyword: "request keyword" },
      `${UTM_COOKIE_NAME}=${cookiePayload}`,
    )).toEqual({
      gclid: "request-click",
      keyword: "request keyword",
      landing_path: "/signs",
    });
  });

  it.each(["g", "s", "d", "ytv", "vp", "gtv", "x", "e"])("accepts official network value %s", (network) => {
    expect(sanitizeUtm({ network })).toEqual({ network });
  });

  it("rejects non-output network aliases", () => {
    expect(sanitizeUtm({ network: "youtube" })).toEqual({});
  });

  it("appends every sanitized attribution field to form data", () => {
    const appended: Array<[string, string]> = [];
    appendAttributionToFormData({
      append: (key, value) => { appended.push([key, value]); },
    }, {
      utm_source: "google",
      gclid: "click_123",
      keyword: "yard signs",
      campaignid: "42",
      landing_path: "/ignored",
    });

    expect(appended).toEqual([
      ["utm_source", "google"],
      ["gclid", "click_123"],
      ["keyword", "yard signs"],
      ["campaignid", "42"],
    ]);
  });
});
