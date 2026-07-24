import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "../../sitemap";
import { LICENSED_REVIEW_ROUTE, metadata, PAID_PRODUCTS } from "../page";
import { VERIFIED_REVIEW_CARDS } from "@/components/paid/PaidReviewCards";

const EXPECTED_PRODUCT_HREFS = [
  "/products/coroplast-signs",
  "/products/stickers",
  "/products/vinyl-banners",
  "/products/business-cards",
  "/products/flyers",
  "/products/retractable-banners",
];
const EXPECTED_FROM_PRICES = ["$25", "$25", "$66", "$45", "$45", "$219"];

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

  it("links directly to the Google place instead of embedding a third-party widget", () => {
    expect(LICENSED_REVIEW_ROUTE).toMatch(/^https:\/\/www\.google\.com\/maps\/place/);
  });

  it("uses native review cards backed by named review excerpts", () => {
    expect(VERIFIED_REVIEW_CARDS.map((review) => review.name)).toEqual([
      "David Galaise",
      "LMOR",
      "Richard Lewis",
    ]);
    expect(VERIFIED_REVIEW_CARDS.every((review) => review.quote.length > 0)).toBe(true);
  });

  it("keeps the approved purchase-first section order and paired local proof", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/why-true-color/page.tsx"), "utf8");
    const products = source.indexOf('id="products"');
    const processSection = source.indexOf('aria-labelledby="process-heading"');
    const location = source.indexOf('aria-labelledby="location-heading"');
    const reviews = source.indexOf("<PaidReviewCards />");
    const work = source.indexOf('aria-labelledby="shop-proof-heading"');
    const quote = source.indexOf('id="custom-quote"');
    const closing = source.indexOf('aria-labelledby="closing-cta-heading"');

    expect([products, processSection, location, reviews, work, quote, closing]).toEqual(
      [...[products, processSection, location, reviews, work, quote, closing]].sort((a, b) => a - b),
    );
    expect(source).toContain("/images/about/shop-exterior.webp");
    expect(source).toContain("/images/gallery/gallery-shop-roland-large-format.webp");
    expect(source).toContain("Request My Quote");
  });

  it("prevents edge HTML injection on the paid route without making it cacheable", () => {
    const nextConfig = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");

    expect(nextConfig).toContain('source: "/why-true-color"');
    expect(nextConfig).toContain(
      "private, no-cache, no-store, max-age=0, must-revalidate, no-transform",
    );
  });
});
