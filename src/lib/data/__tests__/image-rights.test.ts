import { describe, expect, it } from "vitest";
import { findChannelClearedImage, isImageSitemapCleared } from "@/lib/data/image-rights";

describe("image rights register", () => {
  it("clears only the owner-confirmed Economy pilot and defaults to deny otherwise", () => {
    expect(findChannelClearedImage(
      "c1c12c72fca9ae4bd7ab408a2062375af76ffa22c18571e0f458368e7b22eda3",
      "merchant",
      "tc-retractable-banners--33-5x80--1s--q1--mat-rbs33507875s",
    )).toBeDefined();
    expect(findChannelClearedImage("0".repeat(64), "merchant", "tc-example")).toBeUndefined();
    expect(isImageSitemapCleared("https://truecolorprinting.ca/images/example.webp")).toBe(false);
  });
});
