import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("image sitemap", () => {
  it("emits canonical page URLs with only supported image sitemap tags", async () => {
    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(xml).toContain("<loc>https://truecolorprinting.ca/</loc>");
    expect(xml).not.toContain("<image:title>");
    expect(xml).not.toContain("<image:caption>");
    expect(xml.match(/<url>/g)).toHaveLength(111);
    expect(xml.match(/<image:image>/g)).toHaveLength(336);
  });
});
