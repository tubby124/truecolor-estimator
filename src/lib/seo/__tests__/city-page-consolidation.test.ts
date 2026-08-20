import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

const BASE_URL = "https://truecolorprinting.ca";
const ROOT = process.cwd();

/**
 * Wave 1 removes the lowest-evidence city matrix pages from the index while
 * preserving a one-hop permanent redirect to the exact Saskatoon service page.
 * Keep this explicit: a future route/sitemap edit must not silently resurrect
 * a retired matrix URL or turn it into a 404.
 */
const WAVE_ONE_REDIRECTS = [
  ["/freezer-labels-regina", "/freezer-labels-saskatoon"],
  ["/freezer-labels-moose-jaw-sk", "/freezer-labels-saskatoon"],
  ["/freezer-labels-prince-albert-sk", "/freezer-labels-saskatoon"],
  ["/product-labels-regina", "/product-labels-saskatoon"],
  ["/product-labels-moose-jaw-sk", "/product-labels-saskatoon"],
  ["/product-labels-prince-albert-sk", "/product-labels-saskatoon"],
  ["/cosmetic-labels-regina", "/cosmetic-labels-saskatoon"],
  ["/cosmetic-labels-moose-jaw-sk", "/cosmetic-labels-saskatoon"],
  ["/cosmetic-labels-prince-albert-sk", "/cosmetic-labels-saskatoon"],
  ["/candle-jar-labels-regina", "/candle-jar-labels-saskatoon"],
  ["/candle-jar-labels-moose-jaw-sk", "/candle-jar-labels-saskatoon"],
  ["/candle-jar-labels-prince-albert-sk", "/candle-jar-labels-saskatoon"],
  ["/image-upscale-regina", "/image-upscale-saskatoon"],
  ["/image-upscale-moose-jaw-sk", "/image-upscale-saskatoon"],
  ["/image-upscale-prince-albert-sk", "/image-upscale-saskatoon"],
  ["/logo-vectorization-regina", "/logo-vectorization-saskatoon"],
  ["/logo-vectorization-moose-jaw-sk", "/logo-vectorization-saskatoon"],
  ["/logo-vectorization-prince-albert-sk", "/logo-vectorization-saskatoon"],
] as const;

describe("city page consolidation — Wave 1", () => {
  it("keeps every retired matrix URL out of the sitemap", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    for (const [source] of WAVE_ONE_REDIRECTS) {
      expect(urls).not.toContain(`${BASE_URL}${source}`);
    }
  });

  it("keeps the exact Saskatoon equivalents indexed in the sitemap", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    for (const [, destination] of WAVE_ONE_REDIRECTS) {
      expect(urls).toContain(`${BASE_URL}${destination}`);
    }
  });

  it("defines a permanent one-hop redirect for every retired matrix URL", () => {
    const config = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
    for (const [source, destination] of WAVE_ONE_REDIRECTS) {
      expect(config).toContain(`["${source}", "${destination}"]`);
    }
    expect(config).toContain("permanent: true");
  });
});
