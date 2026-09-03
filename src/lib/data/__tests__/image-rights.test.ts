import { describe, expect, it } from "vitest";
import { findChannelClearedImage, isImageSitemapCleared } from "@/lib/data/image-rights";

describe("image rights register", () => {
  it("defaults to deny when no exact hash/channel clearance exists", () => {
    expect(findChannelClearedImage("0".repeat(64), "merchant", "tc-example")).toBeUndefined();
    expect(isImageSitemapCleared("https://truecolorprinting.ca/images/example.webp")).toBe(false);
  });
});
