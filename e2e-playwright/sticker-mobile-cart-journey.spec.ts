import { test, expect, devices, type Page } from "@playwright/test";

// This is intentionally a deployed-environment contract: it proves the actual
// production/staging tag request as well as cart persistence. The deployed
// config has no webServer and defaults to production, so it cannot fall back to
// localhost. PLAYWRIGHT_BASE_URL may override it for a deployed staging host.

const { defaultBrowserType: iPhoneBrowserType, ...iPhone13 } = devices["iPhone 13"];
void iPhoneBrowserType;
test.use(iPhone13);

const ORDERABLE_PRODUCTS = [
  { slug: "stickers", productName: "Vinyl Stickers", expectedConfiguration: /4×4 in · 100/i },
  { slug: "coroplast-signs", productName: "Coroplast Signs", expectedConfiguration: /12×18/i },
  { slug: "business-cards", productName: "Business Cards", expectedConfiguration: /3\.5×2|3\.5×2/i },
] as const;

function isGoogleCollectionRequest(request: { url(): string }) {
  const url = new URL(request.url());
  const host = url.hostname;
  const isGoogleCollectionHost = [
    "google-analytics.com",
    "analytics.google.com",
    "googleads.g.doubleclick.net",
    "doubleclick.net",
    "googleadservices.com",
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));

  return isGoogleCollectionHost && url.searchParams.get("en") === "add_to_cart";
}

async function expectVisibleAndUncovered(page: Page, locator: ReturnType<Page["getByTestId"]>) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  const isTopmostAtCenter = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const topmost = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return topmost === element || element.contains(topmost);
  });
  expect(isTopmostAtCenter).toBe(true);
}

test.describe("Orderable product mobile price-to-cart journey", () => {
  for (const product of ORDERABLE_PRODUCTS) {
    test(`${product.slug} uses the single self-serve CTA path`, async ({ page }, testInfo) => {
      const baseUrl = String(testInfo.project.use.baseURL ?? "");
      test.skip(!baseUrl || new URL(baseUrl).hostname === "localhost", "Requires a deployed base URL");

      await page.goto(`/products/${product.slug}`, { waitUntil: "networkidle" });
      await page.evaluate(() => sessionStorage.removeItem("tc_cart"));
      await page.reload({ waitUntil: "networkidle" });

      const addToCart = page.getByTestId("mobile-add-to-cart");
      await expectVisibleAndUncovered(page, addToCart);
      await expect(page.getByTestId("mobile-config-label")).toContainText(product.expectedConfiguration);
      await expect(page.getByRole("button", { name: "Get My Price" })).toHaveCount(0);

      const box = await addToCart.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);

      const analyticsRequest = page.waitForRequest(isGoogleCollectionRequest, { timeout: 15_000 });
      await addToCart.click();
      await analyticsRequest;

      const cart = await page.evaluate(() => JSON.parse(sessionStorage.getItem("tc_cart") ?? "[]"));
      expect(cart).toHaveLength(1);
      expect(cart[0]).toMatchObject({ product_slug: product.slug });

      await page.goto("/cart", { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Your Cart" })).toBeVisible();
      await expect(page.locator("#main-content").getByText(product.productName, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Proceed to Checkout/i })).toBeVisible();
    });
  }
});
