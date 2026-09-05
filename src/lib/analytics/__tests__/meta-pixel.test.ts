import { afterEach, describe, expect, it, vi } from "vitest";
import { metaTrackLead, metaTrackPurchase } from "../metaPixel";

describe("Meta browser events", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not send an event before marketing consent", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });
    vi.stubGlobal("document", { cookie: "tc_marketing_consent=denied" });

    metaTrackLead({ content_name: "Quote Request" }, { eventId: "quote-1" });

    expect(fbq).not.toHaveBeenCalled();
  });

  it("blocks events on a payment path even after consent and pixel initialization", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq, location: { pathname: "/pay/private-token" } });
    vi.stubGlobal("document", { cookie: "tc_marketing_consent=granted" });
    metaTrackLead({ content_name: "Quote Request" });
    metaTrackPurchase({ content_ids: ["vinyl-banners"], value: 100 });
    expect(fbq).not.toHaveBeenCalled();
  });

  it("sends a single browser purchase event with the server deduplication ID", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq });
    vi.stubGlobal("document", { cookie: "tc_marketing_consent=granted" });

    metaTrackPurchase({ content_ids: ["vinyl-banners"], value: 100 }, { eventId: "TC-2026-0001" });

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({ currency: "CAD", value: 100 }),
      { eventID: "TC-2026-0001" },
    );
  });
});
