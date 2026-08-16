import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getProduct } from "@/lib/data/products-content";

/**
 * /products/* is noindex and is the destination for 8 paid ad groups. Google Ads
 * scored landing-page experience BELOW_AVERAGE on ~85% of keywords while the H1
 * and the from-price lived inside the client configurator, below the gallery and
 * under the mobile fold. These are the invariants that fix depends on; the DOM
 * ordering itself is asserted live in e2e-playwright/seo-paid-journeys.spec.ts.
 */
// Block comments are stripped so prose about the h1 rule cannot satisfy — or
// break — the h1 count it documents.
const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const PAID_SLUGS = [
  "stickers",
  "window-decals",
  "business-cards",
  "vinyl-banners",
  "coroplast-signs",
  "retractable-banners",
  "flyers",
] as const;

function approvedPriceTokens(): Set<string> {
  const source = read("docs/paid-search/approved-claims.mjs");
  const registry = source.slice(source.indexOf("export const SOURCED_FACTS"));
  return new Set(
    [...registry.matchAll(/"([^"]+)":\s*\{\s*kind:\s*"price"/g)].map((match) => match[1]),
  );
}

describe("paid product page fold contract", () => {
  it("renders exactly one server-side h1 in the product template", () => {
    const template = read("src/app/products/[slug]/page.tsx");
    expect(template.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
    expect(template).toContain("product.paidHeadline");
    expect(template).toContain("product.paidSubline");
    expect(template).toContain("From {product.fromPrice}");
  });

  it("keeps both configurators free of a competing h1", () => {
    for (const file of [
      "src/components/product/ProductConfigurator.tsx",
      "src/components/product/UnifiedConfigurator.tsx",
    ]) {
      expect(read(file).match(/<h1[\s>]/g) ?? [], file).toHaveLength(0);
    }
  });

  it("gives every paid ad-group destination a keyword-bearing subline", () => {
    for (const slug of PAID_SLUGS) {
      const product = getProduct(slug);
      expect(product, slug).toBeDefined();
      expect(product?.paidSubline?.length ?? 0, slug).toBeGreaterThan(0);
    }
  });

  it("renders only approved from-price tokens on paid destinations", () => {
    const approved = approvedPriceTokens();
    for (const slug of PAID_SLUGS) {
      expect(approved.has(getProduct(slug)!.fromPrice), `${slug} from-price`).toBe(true);
    }
  });

  it("defaults the h1 to a Saskatoon-bearing headline", () => {
    for (const slug of PAID_SLUGS) {
      const product = getProduct(slug)!;
      expect(product.paidHeadline ?? `${product.name} Saskatoon`).toContain("Saskatoon");
    }
  });
});
