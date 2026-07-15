import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeDir = join(process.cwd(), "src/app/why-true-color");
const pagePath = join(routeDir, "page.tsx");
const layoutPath = join(routeDir, "layout.tsx");

function source(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

describe("paid-only why True Color page contract", () => {
  it("is noindex, follow", () => {
    const page = source(pagePath);

    expect(page).toMatch(/robots:\s*{[\s\S]*index:\s*false[\s\S]*follow:\s*true[\s\S]*}/);
  });

  it("stays excluded from the sitemap and global navigation", () => {
    const sitemap = source(join(process.cwd(), "src/app/sitemap.ts"));
    const siteNav = source(join(process.cwd(), "src/components/site/SiteNav.tsx"));
    const siteFooter = source(join(process.cwd(), "src/components/site/SiteFooter.tsx"));

    expect(sitemap).not.toContain("/why-true-color");
    expect(siteNav).not.toContain("/why-true-color");
    expect(siteFooter).not.toContain("/why-true-color");
  });

  it("links every paid-traffic product card directly to its order page", () => {
    const page = source(pagePath);
    const destinations = [
      "/products/coroplast-signs",
      "/products/stickers",
      "/products/vinyl-banners",
      "/products/business-cards",
      "/products/flyers",
      "/products/retractable-banners",
    ];

    for (const destination of destinations) {
      expect(page).toContain(`href: "${destination}"`);
    }
  });

  it("reuses the site chrome and links to the licensed review route", () => {
    const page = source(pagePath);
    const layout = source(layoutPath);
    const reviewRoute = source(join(process.cwd(), "src/app/reviews-widget/route.ts"));

    expect(layout).toContain("<SiteNav />");
    expect(layout).toContain("<SiteFooter />");
    expect(page).toContain('href="/reviews-widget"');
    expect(reviewRoute).toContain("https://cdn.trustindex.io/widgets/");
    expect(reviewRoute).toContain("export async function GET()");
  });
});
