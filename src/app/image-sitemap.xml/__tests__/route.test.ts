import { describe, expect, it } from "vitest";
import { GET } from "../route";
import sitemap from "@/app/sitemap";

describe("image sitemap", () => {
  it("emits canonical page URLs with only supported image sitemap tags", async () => {
    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(xml).not.toContain("<image:title>");
    expect(xml).not.toContain("<image:caption>");
    // The September 10 catalogue leads are distributed only after an exact
    // hash, explicit owner permission, and a matching canonical-page gallery.
    expect(xml.match(/<url>/g)).toHaveLength(7);
    expect(xml.match(/<image:image>/g)).toHaveLength(7);
    expect(xml).toContain("/images/products/gallery/acp-signs/acp-signs-application-v1-1200w.webp");
    expect(xml).toContain("/images/products/gallery/vinyl-lettering/vinyl-lettering-overview-v1-1200w.webp");

    const canonicalUrls = new Set(sitemap().map((entry) => entry.url));
    const emittedUrls = [...xml.matchAll(/<loc>(https:\/\/truecolorprinting\.ca\/[^<]*)<\/loc>/g)]
      .map((match) => match[1]);
    expect(emittedUrls.every((url) => canonicalUrls.has(url))).toBe(true);
  });
});
