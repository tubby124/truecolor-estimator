import { afterEach, describe, expect, it, vi } from "vitest";
import { readLatestPaidFromStorage } from "@/components/site/UtmCapture";
import {
  collectLatestPaidHints,
  mergeLatestPaidAttribution,
  toLatestPaidHintPayload,
} from "@/lib/analytics/utm";

const LATEST_PAID_LS_KEY = "tc_utm_latest_paid_touch";

function stubStorage(entries: Record<string, string | null>, throws = false) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem(key: string) {
        if (throws) throw new Error("storage blocked");
        return entries[key] ?? null;
      },
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readLatestPaidFromStorage", () => {
  it("returns the stored paid touch when present and fresh", () => {
    const capturedAt = Date.now() - 60_000;
    stubStorage({
      [LATEST_PAID_LS_KEY]: JSON.stringify({
        utm_source: "google",
        utm_medium: "cpc",
        gclid: "stored_click",
        campaignid: "42",
        captured_at: capturedAt,
      }),
    });

    expect(readLatestPaidFromStorage()).toEqual({
      attribution: {
        utm_source: "google",
        utm_medium: "cpc",
        gclid: "stored_click",
        campaignid: "42",
      },
      capturedAt: new Date(capturedAt).toISOString(),
    });
  });

  it("returns null when the key is absent", () => {
    stubStorage({});
    expect(readLatestPaidFromStorage()).toBeNull();
  });

  it("returns null on corrupt JSON", () => {
    stubStorage({ [LATEST_PAID_LS_KEY]: "{not-json" });
    expect(readLatestPaidFromStorage()).toBeNull();
  });

  it("returns null when the stored touch is not paid or has no timestamp", () => {
    stubStorage({
      [LATEST_PAID_LS_KEY]: JSON.stringify({
        utm_source: "google",
        utm_medium: "organic",
        captured_at: Date.now(),
      }),
    });
    expect(readLatestPaidFromStorage()).toBeNull();

    stubStorage({ [LATEST_PAID_LS_KEY]: JSON.stringify({ gclid: "no_timestamp" }) });
    expect(readLatestPaidFromStorage()).toBeNull();
  });

  it("returns null past the 90-day paid-touch window", () => {
    stubStorage({
      [LATEST_PAID_LS_KEY]: JSON.stringify({
        gclid: "ancient_click",
        captured_at: Date.now() - 91 * 24 * 60 * 60 * 1000,
      }),
    });
    expect(readLatestPaidFromStorage()).toBeNull();
  });

  it("returns null when storage access throws", () => {
    stubStorage({}, true);
    expect(readLatestPaidFromStorage()).toBeNull();
  });

  it("returns null during SSR", () => {
    vi.stubGlobal("window", undefined);
    expect(readLatestPaidFromStorage()).toBeNull();
  });
});

describe("latest-paid hint round trip (client storage → submit payload → server merge)", () => {
  it("survives the prefixed payload and rebuilds the same touch server-side", () => {
    const capturedAt = Date.now() - 5 * 24 * 60 * 60 * 1000;
    stubStorage({
      [LATEST_PAID_LS_KEY]: JSON.stringify({
        utm_source: "google",
        utm_medium: "cpc",
        gclid: "ls_click",
        captured_at: capturedAt,
      }),
    });

    const payload = toLatestPaidHintPayload(readLatestPaidFromStorage());
    expect(payload).toEqual({
      latest_paid_utm_source: "google",
      latest_paid_utm_medium: "cpc",
      latest_paid_gclid: "ls_click",
      latest_paid_captured_at: String(capturedAt),
    });

    const hints = collectLatestPaidHints((name) => (payload as Record<string, string>)[name]);
    expect(mergeLatestPaidAttribution(hints, null)).toEqual({
      attribution: { utm_source: "google", utm_medium: "cpc", gclid: "ls_click" },
      capturedAt: new Date(capturedAt).toISOString(),
    });
  });

  it("produces no hints when there is no stored paid touch", () => {
    stubStorage({});
    expect(toLatestPaidHintPayload(readLatestPaidFromStorage())).toEqual({});
    expect(collectLatestPaidHints(() => null)).toEqual({});
  });

  it("lets a cookie win over an older storage hint but not a newer one", () => {
    const cookieCapturedAt = Date.now() - 60_000;
    const cookie = `tc_utm_latest_paid_touch=${encodeURIComponent(
      JSON.stringify({ gclid: "cookie_click", captured_at: cookieCapturedAt }),
    )}`;

    const older = collectLatestPaidHints((name) =>
      ({ latest_paid_gclid: "old_click", latest_paid_captured_at: String(cookieCapturedAt - 60_000) })[name],
    );
    expect(mergeLatestPaidAttribution(older, cookie)?.attribution.gclid).toBe("cookie_click");

    const newer = collectLatestPaidHints((name) =>
      ({ latest_paid_gclid: "new_click", latest_paid_captured_at: String(cookieCapturedAt + 60_000) })[name],
    );
    expect(mergeLatestPaidAttribution(newer, cookie)?.attribution.gclid).toBe("new_click");
  });

  it("keeps ignoring untimestamped first-touch hints when a paid cookie exists", () => {
    const cookie = `tc_utm_latest_paid_touch=${encodeURIComponent(
      JSON.stringify({ gclid: "cookie_click", captured_at: Date.now() - 60_000 }),
    )}`;
    expect(mergeLatestPaidAttribution({ gclid: "flat_first_touch_click" }, cookie)?.attribution.gclid)
      .toBe("cookie_click");
  });
});
