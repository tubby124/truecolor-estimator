import { test, expect } from "@playwright/test";
import { getProductDisplayGallery } from "../src/lib/data/product-display-galleries";

// Real optimizer requests: never substitute public originals for /_next/image.
for (const { slug, offer } of [
  { slug: "coroplast-signs", offer: "tc-coroplast-signs-0ace18fa203c" },
  { slug: "postcards", offer: "tc-postcards-5f8ac3be2a8e" },
  { slug: "retractable-banners", offer: "tc-retractable-banners-85e2542c9a34" },
]) {
const images = getProductDisplayGallery(slug)!;
for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`${slug} gallery has stable explicit views and keyboard modal at ${viewport.width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize(viewport);
    const origin = new URL(baseURL!).origin;
    await page.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const safe = ["GET", "HEAD"].includes(request.method()) || (url.origin === origin && url.pathname === "/api/estimate");
      return url.origin === origin && safe ? route.continue() : route.abort();
    });
    await page.goto(`/products/${slug}?merchant=${offer}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    const gallery = page.locator("[data-product-display-gallery]");
    const main = gallery.locator(":scope > button");
    await expect(main).toBeVisible();
    await expect(main.locator("img")).toHaveAttribute("fetchpriority", "high");
    await expect(main.locator("img")).not.toHaveAttribute("loading", "lazy");
    const box = await main.boundingBox();
    expect(box).not.toBeNull();
    const thumbnails = gallery.getByRole("group").getByRole("button");
    await expect(thumbnails).toHaveCount(4);
    for (let index = 0; index < images.length; index++) {
      await thumbnails.nth(index).click();
      await expect(main.locator("img")).toHaveAttribute("alt", images[index].alt);
      await expect(thumbnails.nth(index).locator("img")).toHaveAttribute("alt", images[index].alt);
      await expect.poll(() => main.locator("img").evaluate((image: HTMLImageElement) => ({
        ready: image.complete && image.naturalWidth > 0,
        source: image.currentSrc ? new URL(image.currentSrc).searchParams.get("url") : null,
      }))).toEqual({ ready: true, source: images[index].src });
      const delivered = await main.locator("img").evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        return { width: image.naturalWidth, src: image.currentSrc, srcset: image.srcset, sizes: image.sizes };
      });
      expect(delivered.width).toBeGreaterThan(0);
      expect(delivered.src).toContain("/_next/image?");
      expect(delivered.srcset).toContain("w");
      expect(delivered.sizes).toContain("386px");
      const selectedBox = await main.boundingBox();
      expect(selectedBox?.width).toBe(box?.width);
      expect(selectedBox?.height).toBe(box?.height);
      await main.focus();
      await page.keyboard.press("Enter");
      const dialog = gallery.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("img")).toHaveAttribute("alt", images[index].alt);
      await expect.poll(() => dialog.locator("img").evaluate((image: HTMLImageElement) => ({
        ready: image.complete && image.naturalWidth > 0,
        source: image.currentSrc ? new URL(image.currentSrc).searchParams.get("url") : null,
      }))).toEqual({ ready: true, source: images[index].src });
      await dialog.locator("img").evaluate((image: HTMLImageElement) => image.decode());
      await expect(dialog.getByRole("button", { name: "Close image" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: "Close image" })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: "Close image" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(main).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
}
