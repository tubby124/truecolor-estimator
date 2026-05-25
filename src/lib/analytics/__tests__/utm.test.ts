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
});
