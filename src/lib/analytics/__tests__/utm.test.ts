import { describe, expect, it } from "vitest";
import { mergeUtmAttribution, parseUtmCookie, UTM_COOKIE_NAME } from "../utm";

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
});
