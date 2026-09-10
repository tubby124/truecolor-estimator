import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../products-content";
import { getProductDisplayGallery } from "../product-display-galleries";
import { findChannelClearedImageForOffer, isImageSitemapCleared } from "../image-rights";
import receipt from "../../../../docs/operations/COROPLAST-PILOT-ASSETS-20260909.json";

describe("isolated coroplast display gallery", () => {
  it("retains the original first and excludes the held material detail", () => {
    const images = getProductDisplayGallery("coroplast-signs")!;
    expect(images).toHaveLength(4);
    expect(images[0].src).toBe(PRODUCTS["coroplast-signs"].heroImage);
    expect(images.map((image) => image.src)).toEqual([
      "/images/products/product/coroplast-yard-sign-800x600.webp",
      "/images/products/gallery/coroplast-signs/coroplast-signs-overview-v1-1200w.webp",
      "/images/products/gallery/coroplast-signs/coroplast-signs-application-v1-1200w.webp",
      "/images/products/gallery/coroplast-signs/coroplast-signs-alternate-design-v1-1200w.webp",
    ]);
    expect(PRODUCTS["coroplast-signs"].galleryImages).toHaveLength(14);
  });

  it("leaves every other catalogue product and the standalone vehicle route on the existing path", () => {
    for (const slug of [...Object.keys(PRODUCTS).filter((slug) => slug !== "coroplast-signs"), "vehicle-decals", "unknown"])
      expect(getProductDisplayGallery(slug)).toBeUndefined();
  });

  it("binds explicit alt, actual dimensions and exact approved bytes", async () => {
    const images = getProductDisplayGallery("coroplast-signs")!;
    for (const image of images) {
      expect(image.alt.length).toBeGreaterThanOrEqual(10);
      expect(image.alt.length).toBeLessThanOrEqual(125);
      expect(image.alt).not.toMatch(/\.webp|1200w|v1/);
      const bytes = await readFile(path.join(process.cwd(), "public", image.src));
      const metadata = await sharp(bytes).metadata();
      expect([metadata.width, metadata.height, metadata.format]).toEqual([image.width, image.height, "webp"]);
      const hash = createHash("sha256").update(bytes).digest("hex");
      const approved = receipt.assets.find((asset) => asset.public_path === image.src);
      expect(hash).toBe(approved?.delivery_sha256 ?? receipt.merchant_hero_preserved.image_sha256);
      if (approved) expect(bytes.length).toBe(approved.bytes);
    }
  });

  it("preserves exact Merchant clearance without granting new distribution", () => {
    const kept = receipt.merchant_hero_preserved;
    expect(findChannelClearedImageForOffer(kept.image_url, "merchant", kept.offer_id, kept.image_sha256)).toBeDefined();
    for (const asset of receipt.assets) {
      const url = `https://truecolorprinting.ca${asset.public_path}`;
      expect(findChannelClearedImageForOffer(url, "merchant", kept.offer_id, asset.delivery_sha256)).toBeUndefined();
      expect(isImageSitemapCleared(url)).toBe(false);
    }
  });
});
