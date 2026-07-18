import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "../../sitemap";
import { GET as getReviewsWidget } from "../../reviews-widget/route";
import { LICENSED_REVIEW_ROUTE, metadata, PAID_PRODUCTS } from "../page";

const EXPECTED_PRODUCT_HREFS = [
  "/products/coroplast-signs",
  "/products/stickers",
  "/products/vinyl-banners",
  "/products/business-cards",
  "/products/flyers",
  "/products/retractable-banners",
];
const EXPECTED_FROM_PRICES = ["$25", "$25", "$66", "$45", "$45", "$219"];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("paid-only why True Color page contract", () => {
  it("uses a non-duplicated title and is noindex, follow", () => {
    expect(metadata.title).toBe("Compare Print Options & Order Online");
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });

  it("stays excluded from the generated sitemap", () => {
    expect(sitemap().map((entry) => entry.url)).not.toContain(
      "https://truecolorprinting.ca/why-true-color",
    );
  });

  it("exposes exactly the six direct product CTA destinations", () => {
    expect(PAID_PRODUCTS.map((product) => product.href)).toEqual(EXPECTED_PRODUCT_HREFS);
    expect(PAID_PRODUCTS.map((product) => product.fromPrice)).toEqual(EXPECTED_FROM_PRICES);
    expect(PAID_PRODUCTS.every((product) => product.heroImage.startsWith("/images/"))).toBe(true);
  });

  it("links to and preserves the licensed review route", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("<div>Licensed reviews</div>"))
      .mockResolvedValueOnce(new Response(".ti-widget{}"));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getReviewsWidget();

    expect(LICENSED_REVIEW_ROUTE).toBe("/reviews-widget");
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(
      /^https:\/\/cdn\.trustindex\.io\/widgets\//,
    );
  });
});
