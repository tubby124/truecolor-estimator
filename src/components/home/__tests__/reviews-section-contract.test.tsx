import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReviewsSection } from "../ReviewsSection";
import { TRUSTINDEX_LOADER_URL, TRUSTINDEX_WIDGET_ID } from "@/lib/trustindex";

describe("homepage reviews section", () => {
  it("uses the newest Trustindex widget", () => {
    expect(TRUSTINDEX_WIDGET_ID).toBe("3cf628477849449f85861d8c1c6");
    expect(TRUSTINDEX_LOADER_URL).toBe(
      "https://cdn.trustindex.io/loader.js?3cf628477849449f85861d8c1c6",
    );
  });

  it("renders an accessible review section with Google fallbacks", () => {
    const html = renderToStaticMarkup(<ReviewsSection />);

    expect(html).toContain('aria-labelledby="customer-reviews-heading"');
    expect(html).toContain("Local work. Real feedback.");
    expect(html).toContain("See all on Google");
    expect(html).toContain("Leave a review");
    expect(html).toContain("JavaScript is required for the review slider");
  });

  it("suppresses duplicate Trustindex schema and cleans up vendor instances", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/home/ReviewsSection.tsx"),
      "utf8",
    );

    expect(source).toContain('schemaGuard.dataset.trustindex = "1"');
    expect(source).toContain('"@graph": []');
    expect(source).toContain("instance.destroy?.()");
    expect(source).toContain("tiWidgetInstances");
    expect(source).toContain('window.dispatchEvent(new Event("mousemove"))');
    expect(source).toContain('window.dispatchEvent(new Event("scroll"))');
  });
});
