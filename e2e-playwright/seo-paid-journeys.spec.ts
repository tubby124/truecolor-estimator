import { expect, test } from "@playwright/test";

const paidProductRoutes = [
  "/products/coroplast-signs",
  "/products/stickers",
  "/products/vinyl-banners",
  "/products/business-cards",
  "/products/flyers",
  "/products/retractable-banners",
] as const;

const resourceRoutes = [
  "/print-resources/coroplast-sign-template-18x24",
  "/print-resources/die-cut-coroplast-project",
  "/print-resources/coroplast-vs-aluminum-composite",
  "/print-resources/construction-site-signage-kit",
  "/print-resources/trade-show-print-kit",
] as const;

test.describe("paid and organic ordering journeys", () => {
  test("paid landing page preserves first-touch attribution and routes to configurators", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto(
      "/why-true-color?utm_source=google&utm_medium=cpc&utm_campaign=tc_core&gclid=test-click-123&keyword=coroplast%20signs&matchtype=e&device=m",
    );

    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    for (const href of paidProductRoutes) {
      await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
    }

    await expect(page.locator('main a[href="/reviews-widget"]')).toHaveCount(1);

    await page.locator('main a[href="/products/coroplast-signs"]').click();
    await expect(page).toHaveURL(/\/products\/coroplast-signs$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Coroplast/i);

    const firstTouch = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tc_utm_first_touch") ?? "null"),
    );
    expect(firstTouch).toMatchObject({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "tc_core",
      gclid: "test-click-123",
      keyword: "coroplast signs",
      matchtype: "e",
      device: "m",
    });
  });

  test("paid landing page has no horizontal overflow on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/why-true-color");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("all five real-data resources render and lead to product ordering", async ({ page }) => {
    for (const route of resourceRoutes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}$`));
      await expect(page.locator('main a[href^="/products/"]')).not.toHaveCount(0);
    }
  });

  test("template is downloadable and unknown resources are true 404s", async ({ page }) => {
    await page.goto(resourceRoutes[0]);
    const template = page.locator(
      'a[href="/downloads/print-templates/coroplast-sign-18x24.svg"]',
    );
    await expect(template).toHaveAttribute("download", "coroplast-sign-18x24.svg");

    const downloadResponse = await page.request.get(
      "/downloads/print-templates/coroplast-sign-18x24.svg",
    );
    expect(downloadResponse.status()).toBe(200);
    expect(downloadResponse.headers()["content-type"]).toContain("image/svg+xml");

    const missingResponse = await page.goto("/print-resources/not-a-real-resource");
    expect(missingResponse?.status()).toBe(404);
    expect(missingResponse?.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("ACP configurator exposes both maintained side choices", async ({ page }) => {
    await page.goto("/products/acp-signs");
    const single = page.getByRole("button", { name: "Single-sided" });
    const double = page.getByRole("button", { name: "Double-sided" });

    await expect(single).toHaveAttribute("aria-pressed", "true");
    await double.evaluate((button) => (button as HTMLButtonElement).click());
    await expect(double).toHaveAttribute("aria-pressed", "true");
    await expect(single).toHaveAttribute("aria-pressed", "false");
  });
});
