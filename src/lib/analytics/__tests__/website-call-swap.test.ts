import { describe, expect, it } from "vitest";
import { BUSINESS_INFO } from "@/lib/business-info";
import {
  WEBSITE_CALL_DISPLAY_NUMBER,
  WEBSITE_CALL_SWAP_CSS_CLASS,
  WEBSITE_CALL_SWAP_GLOBAL,
  buildGoogleTagBootstrapScript,
  buildWebsiteCallSwapScript,
  websiteCallSwapParams,
} from "../google-ads";

const VALID_LABEL = "AW-18330693756/AbCdEf-1_2";

interface FakeWindow {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  [key: string]: unknown;
}

function run(script: string) {
  const fakeWindow: FakeWindow = {};
  Function("window", script)(fakeWindow);
  const calls = (fakeWindow.dataLayer ?? []).map((args) => Array.from(args));
  return { fakeWindow, calls };
}

function phoneConfig(script: string) {
  return run(script).calls.find(
    (args) => args[0] === "config" && typeof args[2] === "object" && args[2] !== null
      && "phone_conversion_number" in (args[2] as object),
  );
}

describe("website call conversion number swap", () => {
  it("configures the swap against the conversion label when one is set", () => {
    const config = phoneConfig(buildGoogleTagBootstrapScript(undefined, "AW-18330693756", VALID_LABEL));
    expect(config?.[1]).toBe(VALID_LABEL);
    expect(config?.[2]).toMatchObject({
      phone_conversion_number: "(306) 954-8688",
      phone_conversion_css_class: WEBSITE_CALL_SWAP_CSS_CLASS,
      phone_conversion_options: { cache: true },
    });
    expect(typeof (config?.[2] as Record<string, unknown>).phone_conversion_callback).toBe("function");
  });

  it("emits nothing at all when the label is absent", () => {
    expect(buildWebsiteCallSwapScript(undefined)).toBe("");
    expect(buildWebsiteCallSwapScript("")).toBe("");
    expect(phoneConfig(buildGoogleTagBootstrapScript(undefined, "AW-18330693756"))).toBeUndefined();
  });

  it("rejects a malformed label rather than escaping it into the inline script", () => {
    // The label is the only dynamic value reaching a <script> body, so validation
    // is the boundary — exactly the posture normalizeGoogleAdsTagId already takes.
    for (const bad of [
      "AW-18330693756/x');alert(1)//",
      "AW-18330693756",
      "G-6HMQT7MNLL",
      "AW-18330693756/lab el",
      "18330693756/label",
    ]) {
      expect(buildWebsiteCallSwapScript(bad), bad).toBe("");
    }
    expect(phoneConfig(buildGoogleTagBootstrapScript(undefined, "AW-18330693756", "AW-1/x');alert(1)//")))
      .toBeUndefined();
  });

  it("still configures GA4 and the account tag alongside the swap", () => {
    const { calls } = run(buildGoogleTagBootstrapScript(undefined, "AW-18330693756", VALID_LABEL));
    const destinations = calls.filter((args) => args[0] === "config").map((args) => String(args[1]));
    expect(destinations).toEqual(["G-6HMQT7MNLL", "AW-18330693756", VALID_LABEL]);
  });

  it("parks Google's two numbers where the client component can read them", () => {
    const script = buildGoogleTagBootstrapScript(undefined, "AW-18330693756", VALID_LABEL);
    const { fakeWindow, calls } = run(script);
    const config = calls.find((args) => args[1] === VALID_LABEL);
    const callback = (config?.[2] as Record<string, unknown>).phone_conversion_callback as
      (formatted: string, mobile: string) => void;

    // dispatchEvent is absent on this fake window; the shim must survive that and
    // still park the numbers, because the component reads them on mount anyway.
    callback("(306) 555-0134", "+13065550134");
    expect(fakeWindow[WEBSITE_CALL_SWAP_GLOBAL]).toEqual({
      formatted: "(306) 555-0134",
      mobile: "+13065550134",
    });
  });

  it("keeps the inline number and the client param object on the same shape", () => {
    const params = websiteCallSwapParams(() => {});
    const script = buildWebsiteCallSwapScript(VALID_LABEL);
    for (const key of Object.keys(params)) {
      expect(script, key).toContain(`${key}:`);
    }
    expect(params.phone_conversion_number).toBe(WEBSITE_CALL_DISPLAY_NUMBER);
  });

  it("never drifts from the published business number", () => {
    // The literal exists because this module is interpolated into an inline
    // script and must stay dependency-free; this is the guard that keeps it true.
    expect(WEBSITE_CALL_DISPLAY_NUMBER).toBe(BUSINESS_INFO.phone.display);
  });
});
