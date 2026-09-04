import { describe, expect, it } from "vitest";
import { findChannelClearedImage, findChannelClearedImageForOffer, isImageSitemapCleared } from "@/lib/data/image-rights";
import { getMerchantOffers } from "@/lib/merchant/merchant-catalog";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("image rights register", () => {
  it("clears the owner-directed store catalog for Merchant and defaults to deny otherwise", () => {
    expect(findChannelClearedImage(
      "c1c12c72fca9ae4bd7ab408a2062375af76ffa22c18571e0f458368e7b22eda3",
      "merchant",
      "tc-retractable-banners-85e2542c9a34",
    )).toBeDefined();
    for (const offer of getMerchantOffers("https://truecolorprinting.ca")) {
      const imagePath = new URL(offer.imageLink).pathname.replace(/^\/+/, "");
      const sha256 = createHash("sha256").update(readFileSync(join(process.cwd(), "public", imagePath))).digest("hex");
      expect(findChannelClearedImageForOffer(offer.imageLink, "merchant", offer.offerId, sha256)).toBeDefined();
      expect(findChannelClearedImageForOffer(offer.imageLink, "merchant", offer.offerId, "0".repeat(64))).toBeUndefined();
    }
    expect(findChannelClearedImage("0".repeat(64), "merchant", "tc-example")).toBeUndefined();
    expect(isImageSitemapCleared("https://truecolorprinting.ca/images/example.webp")).toBe(false);
  });
});
