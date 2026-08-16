import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetClickToCallDedupeForTests, sendGoogleAdsClickToCall } from "../google-ads";
import { trackClickToCall, trackPaidLandingView } from "@/lib/analytics";

const LABEL = "AW-18330693756/CtC-Label_1";

function fakeWindow(options: { coarse?: boolean; pathname?: string } = {}) {
  const store = new Map<string, string>();
  const gtag = vi.fn();
  return {
    gtag,
    store,
    win: {
      gtag,
      matchMedia: (query: string) => ({ matches: query === "(pointer: coarse)" && options.coarse !== false }),
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
      },
      localStorage: {
        getItem: () => null,
        setItem: () => { throw new Error("localStorage must not be used for call intent"); },
      },
      location: { pathname: options.pathname ?? "/products/vinyl-banners" },
    },
  };
}

const conversions = (gtag: ReturnType<typeof vi.fn>) =>
  gtag.mock.calls.filter((call) => call[0] === "event" && call[1] === "conversion");

beforeEach(() => {
  resetClickToCallDedupeForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("click-to-call Google Ads conversion", () => {
  it("stays inert when no conversion label is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL", "");
    const { win, gtag } = fakeWindow({ coarse: true });
    vi.stubGlobal("window", win);

    expect(sendGoogleAdsClickToCall()).toBe(false);
    expect(conversions(gtag)).toHaveLength(0);
  });

  it("stays inert on a malformed label rather than sending to a wrong destination", () => {
    const { win, gtag } = fakeWindow({ coarse: true });
    vi.stubGlobal("window", win);

    for (const bad of ["AW-18330693756", "G-6HMQT7MNLL", "AW-1/x');alert(1)//", "   "]) {
      expect(sendGoogleAdsClickToCall({ label: bad }), bad).toBe(false);
    }
    expect(conversions(gtag)).toHaveLength(0);
  });

  it("does not fire on a fine pointer, where tel: does nothing", () => {
    const { win, gtag } = fakeWindow({ coarse: false });
    vi.stubGlobal("window", win);

    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(false);
    expect(conversions(gtag)).toHaveLength(0);
  });

  it("sends an intent conversion with no value and no transaction_id", () => {
    const { win, gtag } = fakeWindow({ coarse: true });
    vi.stubGlobal("window", win);

    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(true);
    expect(conversions(gtag)).toEqual([["event", "conversion", { send_to: LABEL }]]);
  });

  it("counts one intent per session however many times the link is tapped", () => {
    const { win, gtag } = fakeWindow({ coarse: true });
    vi.stubGlobal("window", win);

    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(true);
    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(false);
    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(false);
    expect(conversions(gtag)).toHaveLength(1);
  });

  it("honours a mark left by an earlier page load in the same session", () => {
    const { win, gtag, store } = fakeWindow({ coarse: true });
    store.set(`tc_google_ads_click_to_call_sent:${LABEL}`, "1");
    vi.stubGlobal("window", win);

    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(false);
    expect(conversions(gtag)).toHaveLength(0);
  });

  it("still counts once when browser storage is blocked entirely", () => {
    const { win, gtag } = fakeWindow({ coarse: true });
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    vi.stubGlobal("window", { ...win, sessionStorage: blocked, localStorage: blocked });

    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(true);
    expect(sendGoogleAdsClickToCall({ label: LABEL })).toBe(false);
    expect(conversions(gtag)).toHaveLength(1);
  });
});

describe("trackClickToCall", () => {
  it("reports the GA4 event on every device, label or not", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL", "");
    const { win, gtag } = fakeWindow({ coarse: false });
    vi.stubGlobal("window", win);

    trackClickToCall({ placement: "paid_header", page_path: "/why-true-color", link_url: "tel:+13069548688" });

    expect(gtag).toHaveBeenCalledWith("event", "click_to_call", {
      placement: "paid_header",
      page_path: "/why-true-color",
      link_url: "tel:+13069548688",
    });
    expect(conversions(gtag)).toHaveLength(0);
  });

  it("adds the Ads conversion once a valid label is configured on a phone", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CLICK_TO_CALL_LABEL", LABEL);
    const { win, gtag } = fakeWindow({ coarse: true });
    vi.stubGlobal("window", win);

    trackClickToCall({ placement: "paid_header", page_path: "/why-true-color", link_url: "tel:+13069548688" });
    trackClickToCall({ placement: "paid_footer", page_path: "/why-true-color", link_url: "tel:+13069548688" });

    expect(gtag.mock.calls.filter((call) => call[1] === "click_to_call")).toHaveLength(2);
    expect(conversions(gtag)).toEqual([["event", "conversion", { send_to: LABEL }]]);
  });
});

describe("trackPaidLandingView", () => {
  it("defaults to the page it actually fired on", () => {
    const { win, gtag } = fakeWindow({ pathname: "/products/coroplast-signs" });
    vi.stubGlobal("window", win);

    trackPaidLandingView();

    expect(gtag).toHaveBeenCalledWith("event", "view_paid_landing", {
      page_path: "/products/coroplast-signs",
    });
  });

  it("accepts an explicit path", () => {
    const { win, gtag } = fakeWindow({ pathname: "/products/coroplast-signs" });
    vi.stubGlobal("window", win);

    trackPaidLandingView("/why-true-color");

    expect(gtag).toHaveBeenCalledWith("event", "view_paid_landing", { page_path: "/why-true-color" });
  });
});
