import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import {
  PRINT_RESOURCE_SLUGS,
  PRINT_RESOURCES,
  buildPrintResourceMetadata,
  buildPrintResourceSchemas,
  getPrintResource,
} from "@/lib/data/print-resources";
import { PRODUCTS } from "@/lib/data/products-content";

const BASE_URL = "https://truecolorprinting.ca";
const EXPECTED_SLUGS = [
  "coroplast-sign-template-18x24",
  "die-cut-coroplast-project",
  "coroplast-vs-aluminum-composite",
  "construction-site-signage-kit",
  "trade-show-print-kit",
] as const;

describe("print resource data contract", () => {
  it("publishes exactly the five approved non-location resources", () => {
    expect(PRINT_RESOURCE_SLUGS).toEqual(EXPECTED_SLUGS);
    expect(PRINT_RESOURCES).toHaveLength(5);
    expect(PRINT_RESOURCES.map(({ slug }) => slug)).toEqual(PRINT_RESOURCE_SLUGS);
    expect(PRINT_RESOURCES.map((resource) => resource.type)).toEqual([
      "template",
      "project",
      "comparison",
      "kit",
      "kit",
    ]);

    const routeText = PRINT_RESOURCES.map(
      ({ slug, canonical }) => `${slug} ${canonical}`,
    ).join(" ");
    expect(routeText).not.toMatch(
      /saskatoon|regina|moose-jaw|prince-albert|yorkton|estevan|weyburn|lloydminster|north-battleford|swift-current/i,
    );
  });

  it("keeps slugs, titles, descriptions, and canonicals unique", () => {
    for (const values of [
      PRINT_RESOURCES.map(({ slug }) => slug),
      PRINT_RESOURCES.map(({ title }) => title),
      PRINT_RESOURCES.map(({ description }) => description),
      PRINT_RESOURCES.map(({ canonical }) => canonical),
    ]) {
      expect(new Set(values).size).toBe(5);
    }

    for (const resource of PRINT_RESOURCES) {
      expect(resource.canonical).toBe(`/print-resources/${resource.slug}`);
      expect(resource.title.length).toBeLessThan(60);
      expect(resource.description.length).toBeGreaterThanOrEqual(140);
      expect(resource.description.length).toBeLessThanOrEqual(155);
      const wordCount =
        resource.sections
          .flatMap((section) => [
            section.heading,
            ...section.paragraphs,
            ...("bullets" in section ? section.bullets : []),
          ])
          .join(" ")
          .split(/\s+/).length;
      expect(wordCount).toBeGreaterThan(400);
    }
  });

  it("links each resource to at least two active product configurators", () => {
    for (const resource of PRINT_RESOURCES) {
      expect(resource.productLinks.length).toBeGreaterThanOrEqual(2);
      for (const productLink of resource.productLinks) {
        expect(productLink.href).toBe(`/products/${productLink.slug}`);
        expect(PRODUCTS[productLink.slug]).toBeDefined();
        expect(PRODUCTS[productLink.slug].comingSoon).not.toBe(true);
        expect(productLink.label.toLowerCase()).not.toBe("learn more");
      }
    }
  });

  it("contains no unsupported offer, turnaround, consent, or placeholder claims", () => {
    const copy = JSON.stringify(PRINT_RESOURCES);
    expect(copy).not.toMatch(
      /\$\d|from \d|same[- ]day|business days|turnaround|bundle (price|discount)|customer said|customer review|testimonial|permission|PLACEHOLDER/i,
    );
  });

  it("returns undefined for unknown slugs", () => {
    expect(getPrintResource("not-a-real-resource")).toBeUndefined();
  });

  it("keeps material and stand specifications aligned to active products", () => {
    const comparison = getPrintResource("coroplast-vs-aluminum-composite");
    const tradeShowKit = getPrintResource("trade-show-print-kit");
    const copy = JSON.stringify([comparison, tradeShowKit]);

    expect(PRODUCTS["acp-signs"].sideOptions).toBe(false);
    expect(copy).not.toMatch(/both products support single- and double-sided/i);
    expect(copy).toContain("12×18, 18×24, 24×36, and 4×8 feet");
    expect(copy).not.toContain("36×48");
    expect(copy).toContain("33.5×80 inches");
    expect(copy).not.toContain("33×79 inches");
  });

  it("does not misattribute CNC cutting to active product specifications", () => {
    const copy = JSON.stringify(PRINT_RESOURCES);
    expect(copy).toContain("printed, CNC-cut giveaway sign");
    expect(copy).not.toMatch(/custom-shape signs as CNC-cut|CNC routing/i);
    expect(copy).toContain("plotter-cut rigid signage");
  });
});

describe("print resource metadata and schemas", () => {
  it("builds unique indexable canonical and open graph metadata", () => {
    for (const resource of PRINT_RESOURCES) {
      const metadata = buildPrintResourceMetadata(resource);
      expect(metadata.title).toBe(resource.title);
      expect(metadata.description).toBe(resource.description);
      expect(metadata.alternates?.canonical).toBe(resource.canonical);
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.openGraph).toMatchObject({
        title: resource.title,
        description: resource.description,
        url: `${BASE_URL}${resource.canonical}`,
      });
    }
  });

  it("builds breadcrumbs plus an appropriate visible-content schema with unique ids", () => {
    const ids = new Set<string>();
    for (const resource of PRINT_RESOURCES) {
      const schemas = buildPrintResourceSchemas(resource);
      expect(schemas).toHaveLength(2);
      expect(schemas[0]["@type"]).toBe("BreadcrumbList");
      expect(["Article", "DigitalDocument", "ItemList"]).toContain(
        schemas[1]["@type"],
      );
      for (const schema of schemas) {
        const id = String(schema["@id"]);
        expect(id).toContain(`${BASE_URL}${resource.canonical}#`);
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    }
  });
});

describe("print resource indexing and download", () => {
  it("includes all five resources exactly once with the fixed publish date", () => {
    const entries = sitemap();
    expect(
      entries.filter(({ url }) => url.includes("/print-resources/")).map(({ url }) => url),
    ).toHaveLength(5);
    for (const slug of EXPECTED_SLUGS) {
      const matches = entries.filter(
        ({ url }) => url === `${BASE_URL}/print-resources/${slug}`,
      );
      expect(matches).toHaveLength(1);
      expect(new Date(matches[0].lastModified as string | Date).toISOString()).toBe(
        "2026-07-15T00:00:00.000Z",
      );
    }
    expect(entries.map(({ url }) => url)).not.toContain(
      `${BASE_URL}/why-true-color`,
    );
  });

  it("ships an explicit 18 by 24 inch SVG template", () => {
    const downloadPath = path.join(
      process.cwd(),
      "public/downloads/print-templates/coroplast-sign-18x24.svg",
    );
    expect(existsSync(downloadPath)).toBe(true);
    const svg = readFileSync(downloadPath, "utf8");
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/<desc(?:\s[^>]*)?>[\s\S]*<\/desc>/);
    expect(svg).not.toContain("<description");
    expect(svg).toContain('width="18in"');
    expect(svg).toContain('height="24in"');
    expect(svg).toContain('viewBox="0 0 1800 2400"');
    expect(svg).toContain("CONFIRM PRODUCTION TOLERANCES");
  });
});
