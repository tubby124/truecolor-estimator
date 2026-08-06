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
import { getPricingRules } from "@/lib/data/loader";
import { PRODUCTS } from "@/lib/data/products-content";

const BASE_URL = "https://truecolorprinting.ca";
// The original five shipped 2026-07-15 with a fixed publish date. The boat guide
// was added 2026-08-06 and carries its own date, so date assertions are scoped to
// the original set rather than the whole list.
const LAUNCH_SLUGS = [
  "coroplast-sign-template-18x24",
  "die-cut-coroplast-project",
  "coroplast-vs-aluminum-composite",
  "construction-site-signage-kit",
  "trade-show-print-kit",
] as const;

const EXPECTED_SLUGS = [
  ...LAUNCH_SLUGS,
  "saskatchewan-boat-registration-number-rules",
] as const;

const EXPECTED_COUNT = EXPECTED_SLUGS.length;

describe("print resource data contract", () => {
  it("publishes exactly the approved non-location resources", () => {
    expect(PRINT_RESOURCE_SLUGS).toEqual(EXPECTED_SLUGS);
    expect(PRINT_RESOURCES).toHaveLength(EXPECTED_COUNT);
    expect(PRINT_RESOURCES.map(({ slug }) => slug)).toEqual(PRINT_RESOURCE_SLUGS);
    expect(PRINT_RESOURCES.map((resource) => resource.type)).toEqual([
      "template",
      "project",
      "comparison",
      "kit",
      "kit",
      "guide",
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
      expect(new Set(values).size).toBe(EXPECTED_COUNT);
    }

    for (const resource of PRINT_RESOURCES) {
      expect(resource.canonical).toBe(`/print-resources/${resource.slug}`);
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

    expect(PRODUCTS["acp-signs"].sideOptions).toBe(true);
    const acpRules = getPricingRules().filter(
      (rule) => rule.category === "RIGID" && rule.material_code === "RMACP002",
    );
    expect(new Set(acpRules.map((rule) => rule.sides))).toEqual(new Set([1, 2]));
    expect(copy).toMatch(/ACP supports one- or two-sided ordering/i);
    expect(copy).not.toMatch(/ACP configurator is single-sided|Aluminum composite is single-sided/i);
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
  it("builds unique indexable canonical and resource-specific social metadata", () => {
    const finalTitles = new Set<string>();
    for (const resource of PRINT_RESOURCES) {
      const metadata = buildPrintResourceMetadata(resource);
      const finalTitle = `${resource.title} | True Color`;
      expect(metadata.title).toEqual({ absolute: finalTitle });
      expect(finalTitle.length).toBeLessThanOrEqual(60);
      finalTitles.add(finalTitle);
      expect(metadata.description).toBe(resource.description);
      expect(metadata.alternates?.canonical).toBe(resource.canonical);
      expect(metadata.robots).toMatchObject({ index: true, follow: true });
      expect(metadata.openGraph).toMatchObject({
        title: finalTitle,
        description: resource.description,
        url: `${BASE_URL}${resource.canonical}`,
      });
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        title: finalTitle,
        description: resource.description,
        images: ["image" in resource ? resource.image.src : "/og-image.png"],
      });
    }
    expect(finalTitles.size).toBe(EXPECTED_COUNT);
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
  it("includes every resource in the sitemap exactly once", () => {
    const entries = sitemap();
    expect(
      entries.filter(({ url }) => url.includes("/print-resources/")).map(({ url }) => url),
    ).toHaveLength(EXPECTED_COUNT);
    for (const slug of EXPECTED_SLUGS) {
      const matches = entries.filter(
        ({ url }) => url === `${BASE_URL}/print-resources/${slug}`,
      );
      expect(matches).toHaveLength(1);
    }
  });

  it("keeps the launch resources on their fixed publish date and dates newer ones honestly", () => {
    const entries = sitemap();
    const lastModFor = (slug: string) =>
      new Date(
        entries.find(({ url }) => url === `${BASE_URL}/print-resources/${slug}`)!
          .lastModified as string | Date,
      ).toISOString();

    for (const slug of LAUNCH_SLUGS) {
      expect(lastModFor(slug)).toBe("2026-07-15T00:00:00.000Z");
    }

    // A resource added later must not inherit the launch date — sitemap lastmod
    // trust depends on dates reflecting real change.
    expect(lastModFor("saskatchewan-boat-registration-number-rules")).toBe(
      "2026-08-06T00:00:00.000Z",
    );

    // And each resource's own `updated` field must agree with its sitemap entry.
    for (const resource of PRINT_RESOURCES) {
      expect(lastModFor(resource.slug)).toBe(
        new Date(`${resource.updated}T00:00:00.000Z`).toISOString(),
      );
    }
  });

  it("links every resource from the /resources hub so none is orphaned", () => {
    // Each resource's BreadcrumbList declares Home › Resources › [title]. If
    // /resources does not link back, that parent claim is false and the page is
    // orphaned — reachable only via the sitemap, earning no internal link equity.
    // The hub renders from PRINT_RESOURCES, so this guards against someone
    // replacing that with a hand-written list that then goes stale.
    const hubSource = readFileSync(
      path.join(process.cwd(), "src/app/resources/page.tsx"),
      "utf8",
    );
    expect(hubSource).toContain("PRINT_RESOURCES");
    expect(hubSource).toMatch(/PRINT_RESOURCES\.map\(/);
    expect(hubSource).toContain("resource.canonical");

    // And no resource may be reachable ONLY from the sitemap: every one needs at
    // least one in-repo internal link. The hub map satisfies this for all of them.
    for (const resource of PRINT_RESOURCES) {
      expect(resource.canonical).toBe(`/print-resources/${resource.slug}`);
    }
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

  it("uses an accessible brand red for normal text and the download button", () => {
    const pageSource = readFileSync(
      path.join(process.cwd(), "src/app/print-resources/[slug]/page.tsx"),
      "utf8",
    );
    expect(pageSource).not.toContain("text-[#e63020]");
    expect(pageSource).not.toContain("bg-[#e63020]");
    expect(pageSource).toContain("text-[#b42318]");
    expect(pageSource).toContain("bg-[#b42318]");
  });
});
