import { afterEach, describe, expect, it, vi } from "vitest";
import {
  trackArtworkUpload,
  trackSelectItem,
} from "../../analytics";

describe("conversion analytics events", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits catalogue selection with placement and destination", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackSelectItem({
      item_id: "coroplast-signs",
      item_name: "Coroplast Signs",
      item_category: "Signs",
      placement: "gallery",
      destination: "/products/coroplast-signs",
    });

    expect(gtag).toHaveBeenCalledWith("event", "select_item", {
      item_list_name: "gallery",
      placement: "gallery",
      destination: "/products/coroplast-signs",
      items: [{
        item_id: "coroplast-signs",
        item_name: "Coroplast Signs",
        item_category: "Signs",
      }],
    });
  });

  it("emits an artwork upload event", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackArtworkUpload({ file_count: 2, source: "checkout" });

    expect(gtag).toHaveBeenCalledWith("event", "artwork_upload", {
      file_count: 2,
      source: "checkout",
    });
  });

  it("is a safe no-op when GA4 is unavailable", () => {
    vi.stubGlobal("window", {});

    expect(() => trackArtworkUpload({ file_count: 1, source: "checkout" })).not.toThrow();
  });
});
