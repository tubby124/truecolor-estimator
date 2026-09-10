import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../products-content";
import { getProductDisplayGallery } from "../product-display-galleries";
import { findChannelClearedImageForOffer, isImageSitemapCleared } from "../image-rights";
import batchReceipt from "../../../../docs/operations/GALLERY-BATCH-TWO-ASSETS-20260909.json";
import batchThreeReceipt from "../../../../docs/operations/GALLERY-BATCH-THREE-ASSETS-20260910.json";
import fullNoindexReceipt from "../../../../docs/operations/GALLERY-FULL-NOINDEX-ASSETS-20260910.json";
import receipt from "../../../../docs/operations/COROPLAST-PILOT-ASSETS-20260909.json";

const PROMOTED_LEADS: Readonly<Record<string, string>> = {
  "acp-signs": "/images/products/gallery/acp-signs/acp-signs-application-v1-1200w.webp",
  "business-cards": "/images/products/gallery/business-cards/business-cards-application-v1-1200w.webp",
  "flyers": "/images/products/gallery/flyers/flyers-application-v1-1200w.webp",
  "foamboard-displays": "/images/products/gallery/foamboard-displays/foamboard-displays-application-v1-1200w.webp",
  "vehicle-magnets": "/images/products/gallery/vehicle-magnets/vehicle-magnets-application-v1-1200w.webp",
  "vinyl-banners": "/images/products/gallery/vinyl-banners/vinyl-banners-application-v1-1200w.webp",
  "vinyl-lettering": "/images/products/gallery/vinyl-lettering/vinyl-lettering-overview-v1-1200w.webp",
};

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

  it("keeps the standalone vehicle route and unknown values out of the product-display registry", () => {
    for (const slug of ["vehicle-decals", "unknown", "__proto__"])
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


for (const product of batchReceipt.products) {
  describe(`${product.slug} display gallery batch two`, () => {
    it("preserves the hero and old data while using only the cleared three additional views", () => {
      const images = getProductDisplayGallery(product.slug)!;
      expect(images).toHaveLength(4);
      expect(images.map((image) => image.src)).toEqual([product.hero.public_path, ...product.assets.map((asset) => asset.public_path)]);
      expect(images[0].src).toBe(PRODUCTS[product.slug].heroImage);
      expect(PRODUCTS[product.slug].galleryImages).toHaveLength(product.preserved_old_gallery_count);
      expect(images.some((image) => image.src.includes(`${product.slug}-${product.excluded_slot}-v1`))).toBe(false);
    });

    it("binds visible descriptions and decoded dimensions to exact source-approved delivery bytes", async () => {
      const images = getProductDisplayGallery(product.slug)!;
      for (const [index, image] of images.entries()) {
        const bound = index === 0 ? product.hero : product.assets[index - 1];
        expect(image.alt).toBe(bound.alt);
        expect(image.alt.length).toBeGreaterThanOrEqual(10);
        expect(image.alt.length).toBeLessThanOrEqual(125);
        const bytes = await readFile(path.join(process.cwd(), "public", image.src));
        const metadata = await sharp(bytes).metadata();
        expect([metadata.width, metadata.height, metadata.format]).toEqual([image.width, image.height, "webp"]);
        expect(bytes.length).toBe(bound.bytes);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(index === 0 ? product.hero.sha256 : product.assets[index - 1].delivery_sha256);
      }
    });

    it("keeps the original Merchant clearance and grants no new Merchant or sitemap images", () => {
      const heroUrl = `https://truecolorprinting.ca${product.hero.public_path}`;
      expect(findChannelClearedImageForOffer(heroUrl, "merchant", product.hero.offer_id, product.hero.sha256)).toBeDefined();
      for (const asset of product.assets) {
        const url = `https://truecolorprinting.ca${asset.public_path}`;
        expect(findChannelClearedImageForOffer(url, "merchant", product.hero.offer_id, asset.delivery_sha256)).toBeUndefined();
        expect(isImageSitemapCleared(url)).toBe(false);
      }
    });
  });
}

for (const product of batchThreeReceipt.products) {
  describe(`${product.slug} display gallery batch three`, () => {
    it("preserves the Merchant-cleared hero while binding four website-only illustrations", () => {
      const images = getProductDisplayGallery(product.slug)!;
      expect(images).toHaveLength(5);
      expect(images.map((image) => image.src)).toEqual([product.hero.public_path, ...product.assets.map((asset) => asset.public_path)]);
      expect(images[0].src).toBe(PRODUCTS[product.slug].heroImage);
      expect(PRODUCTS[product.slug].galleryImages).toHaveLength(product.preserved_old_gallery_count);
    });

    it("binds visible descriptions and exact reviewed delivery bytes without widening distribution", async () => {
      const images = getProductDisplayGallery(product.slug)!;
      for (const [index, image] of images.entries()) {
        const bound = index === 0 ? product.hero : product.assets[index - 1];
        expect(image.alt).toBe(bound.alt);
        expect(image.alt.length).toBeGreaterThanOrEqual(10);
        expect(image.alt.length).toBeLessThanOrEqual(125);
        const bytes = await readFile(path.join(process.cwd(), "public", image.src));
        const metadata = await sharp(bytes).metadata();
        expect([metadata.width, metadata.height, metadata.format]).toEqual([image.width, image.height, "webp"]);
        expect(bytes.length).toBe(bound.bytes);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(index === 0 ? product.hero.sha256 : product.assets[index - 1].delivery_sha256);
      }
      const heroUrl = `https://truecolorprinting.ca${product.hero.public_path}`;
      expect(findChannelClearedImageForOffer(heroUrl, "merchant", product.hero.offer_id, product.hero.sha256)).toBeDefined();
      for (const asset of product.assets) {
        const url = `https://truecolorprinting.ca${asset.public_path}`;
        expect(findChannelClearedImageForOffer(url, "merchant", product.hero.offer_id, asset.delivery_sha256)).toBeUndefined();
        expect(isImageSitemapCleared(url)).toBe(false);
      }
    });
  });
}

for (const product of fullNoindexReceipt.products) {
  describe(`${product.slug} full noindex gallery`, () => {
    it("keeps the Merchant hero while putting only selected visual leads first", () => {
      const images = getProductDisplayGallery(product.slug)!;
      expect(images[0].src).toBe(PROMOTED_LEADS[product.slug] ?? product.hero.public_path);
      expect(images.map((image) => image.src).sort()).toEqual(
        [product.hero.public_path, ...product.assets.map((asset) => asset.public_path)].sort(),
      );
      expect(PRODUCTS[product.slug].heroImage).toBe(product.hero.public_path);
    });

    it("uses decoded, hash-bound WebP files without granting Merchant or sitemap distribution", async () => {
      const images = getProductDisplayGallery(product.slug)!;
      for (const image of images) {
        const bound = image.src === product.hero.public_path
          ? product.hero
          : product.assets.find((asset) => asset.public_path === image.src);
        expect(bound).toBeDefined();
        expect(image.alt).toBe(bound!.alt);
        expect(image.alt.length).toBeGreaterThanOrEqual(10);
        expect(image.alt.length).toBeLessThanOrEqual(125);
        const bytes = await readFile(path.join(process.cwd(), "public", image.src));
        const metadata = await sharp(bytes).metadata();
        expect([metadata.width, metadata.height, metadata.format]).toEqual([image.width, image.height, "webp"]);
        expect(bytes.length).toBe(bound!.bytes);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(
          "sha256" in bound! ? bound!.sha256 : bound!.delivery_sha256,
        );
      }
      for (const asset of product.assets) {
        const url = `https://truecolorprinting.ca${asset.public_path}`;
        expect(findChannelClearedImageForOffer(url, "merchant", "", asset.delivery_sha256)).toBeUndefined();
        expect(isImageSitemapCleared(url)).toBe(false);
      }
    });
  });
}
