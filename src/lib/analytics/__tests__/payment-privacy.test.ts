import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import nextConfig from "../../../../next.config";
import { proxy, config } from "@/proxy";
import { purgeLegacyPaymentAttribution } from "@/components/site/UtmCapture";
import {
  buildAttributionSetCookies,
  buildPaymentPrivacyCookies,
  LATEST_PAID_COOKIE_NAME,
  parseStoredAttribution,
  parseStoredPaidAttributionTouch,
  sanitizeUtm,
  UTM_COOKIE_NAME,
} from "../utm";

const now = Date.now();
const legacy = JSON.stringify({ landing_path: "/pay/private-signed-token?state=retry", gclid: "real_click", captured_at: now - 60_000 });
const legacyCookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(legacy)}`;

afterEach(() => vi.unstubAllGlobals());

describe("payment attribution privacy", () => {
  it.each(["/pay", "/pay/private-token", "/pay/private-token?state=retry", "/%70ay/private-token"])("drops sensitive landing path %s on all ingestion paths", (path) => {
    const raw = JSON.stringify({ landing_path: path, gclid: "real_click", captured_at: now });
    expect(sanitizeUtm(JSON.parse(raw))).toEqual({ gclid: "real_click" });
    expect(parseStoredAttribution(raw)).toEqual({ gclid: "real_click" });
    expect(parseStoredPaidAttributionTouch(raw)?.attribution).toEqual({ gclid: "real_click" });
  });

  it("preserves a public path with a similar prefix", () => {
    expect(sanitizeUtm({ landing_path: "/payment-options?private=1" })).toEqual({ landing_path: "/payment-options" });
  });

  it("does not create attribution on payment URLs even when a click ID is present", () => {
    expect(buildAttributionSetCookies(new URL("https://truecolorprinting.ca/pay/token?gclid=real_click"), null)).toEqual([]);
    expect(buildAttributionSetCookies(new URL("https://truecolorprinting.ca/poster-printing-saskatoon?gclid=real_click"), null)).toHaveLength(2);
  });

  it("rewrites legacy first and latest cookies without extending their original attribution lifetime", () => {
    const cookies = buildPaymentPrivacyCookies(`${legacyCookie}; ${LATEST_PAID_COOKIE_NAME}=${encodeURIComponent(legacy)}`, true, now);
    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(decodeURIComponent(cookie)).not.toContain("private-signed-token");
      expect(decodeURIComponent(cookie)).toContain('"gclid":"real_click"');
      expect(decodeURIComponent(cookie)).toContain(`"captured_at":${now - 60_000}`);
      expect(cookie).toContain("; Secure");
    }
    expect(cookies[0]).toContain(`Max-Age=${30 * 86400 - 60}`);
    expect(cookies[1]).toContain(`Max-Age=${90 * 86400 - 60}`);
    expect(buildPaymentPrivacyCookies("unrelated=value", true, now)).toEqual([]);
  });

  it("expires an already expired legacy cookie instead of reviving it", () => {
    const old = JSON.stringify({ landing_path: "/pay/old-token", captured_at: now - 100 * 86400000 });
    expect(buildPaymentPrivacyCookies(`${UTM_COOKIE_NAME}=${encodeURIComponent(old)}`, true, now)[0]).toContain("=; Max-Age=0;");
  });

  it("purges both browser stores and cookies on a payment page while retaining valid campaign context", () => {
    const data: Record<string, string> = { [UTM_COOKIE_NAME]: legacy, [LATEST_PAID_COOKIE_NAME]: legacy, unrelated: "keep" };
    const writes: string[] = [];
    vi.stubGlobal("window", {
      location: { pathname: "/pay/new-token", protocol: "https:" },
      localStorage: { getItem: (key: string) => data[key], setItem: (key: string, value: string) => { data[key] = value; } },
    });
    vi.stubGlobal("document", { get cookie() { return legacyCookie; }, set cookie(value: string) { writes.push(value); } });
    purgeLegacyPaymentAttribution();
    expect(data.unrelated).toBe("keep");
    for (const key of [UTM_COOKIE_NAME, LATEST_PAID_COOKIE_NAME]) {
      expect(JSON.parse(data[key])).toEqual({ gclid: "real_click", captured_at: now - 60_000 });
    }
    expect(writes).toHaveLength(1);
    expect(decodeURIComponent(writes[0])).not.toContain("private-signed-token");
  });

  it("runs the payment boundary for signed tokens containing a dot but skips static assets", () => {
    expect(unstable_doesMiddlewareMatch({ config, url: "https://truecolorprinting.ca/pay/eyJhbW91bnQiOjEwfQ.signature" })).toBe(true);
    expect(unstable_doesMiddlewareMatch({ config, url: "https://truecolorprinting.ca/_next/static/chunks/app.js" })).toBe(false);
  });

  it("adds payment response privacy headers and only cleans existing cookies in proxy", async () => {
    const response = await proxy(new NextRequest("https://truecolorprinting.ca/pay/token?gclid=new_click", { headers: { cookie: legacyCookie } }));
    expect(response.headers.get("cache-control")).toContain("no-transform");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(decodeURIComponent(response.headers.get("set-cookie") ?? "")).not.toContain("token");
    expect(decodeURIComponent(response.headers.get("set-cookie") ?? "")).not.toContain("new_click");
    expect(decodeURIComponent(response.headers.get("set-cookie") ?? "")).toContain("real_click");
  });

  it("payment CSP blocks external collectors while retaining local Next scripts and Clover navigation", async () => {
    const rules = await nextConfig.headers!();
    const payment = rules.filter((rule) => rule.source === "/pay/:path*").at(-1)!;
    const csp = payment.headers.find((header) => header.key === "Content-Security-Policy")!.value;
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("img-src 'self' data:;");
    expect(csp).not.toMatch(/cloudflareinsights|facebook|google-analytics|googletagmanager/);
    // Hosted checkout is a top-level navigation; restricting form-action to self
    // would incorrectly block Clover redirects after the quote POST.
    expect(csp).not.toContain("form-action");
    expect(csp).not.toContain("navigate-to");
  });
});
