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
    // No historic gallery/representative asset is assumed cleared merely
    // because it is public. The empty register intentionally emits nothing
    // until exact hash, permission, and sitemap-channel evidence is recorded.
    expect(xml.match(/<url>/g)).toBeNull();
    expect(xml.match(/<image:image>/g)).toBeNull();

    const canonicalUrls = new Set(sitemap().map((entry) => entry.url));
    const emittedUrls = [...xml.matchAll(/<loc>(https:\/\/truecolorprinting\.ca\/[^<]*)<\/loc>/g)]
      .map((match) => match[1]);
    expect(emittedUrls.every((url) => canonicalUrls.has(url))).toBe(true);
  });
});
