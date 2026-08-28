import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Google Ads browser CSP", () => {
  it("allows the production tag loader and conversion request origins", () => {
    const config = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");

    expect(config).toContain("script-src");
    expect(config).toContain("https://www.gstatic.com");
    expect(config).toContain("connect-src");
    expect(config).toContain("https://ad.doubleclick.net");
    expect(config).toContain("https://www.google.ca");
  });
});
