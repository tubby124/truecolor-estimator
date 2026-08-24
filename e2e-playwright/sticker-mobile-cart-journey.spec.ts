import { test, expect, devices } from "@playwright/test";

// This is intentionally a deployed-environment contract: it proves the actual
// production/staging tag request as well as cart persistence. Run with
// PLAYWRIGHT_BASE_URL=https://<staging-or-production-host>; the config then
// does not start localhost (avoids the external-base-url socket hang-up).
const deployedBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

test.use({ ...devices["iPhone 13"] });

test.describe("Sticker mobile price-to-cart journey", () => {
  test.skip(!deployedBaseUrl, "Requires PLAYWRIGHT_BASE_URL for staging/production analytics verification");

  test("shows one enabled CTA, creates exactly one cart item, and emits add_to_cart", async ({ page }) => {
    await page.goto("/products/stickers", { waitUntil: "networkidle" });
    await page.evaluate(() => sessionStorage.removeItem("tc_cart"));
    await page.reload({ waitUntil: "networkidle" });

    const addToCart = page.getByTestId("mobile-add-to-cart");
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
    await expect(page.getByTestId("mobile-add-to-cart-bar")).toContainText(/4×4 in · 100 stickers/);
    await expect(page.getByRole("button", { name: "Get My Price" })).toHaveCount(0);

    const box = await addToCart.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);

    const analyticsRequest = page.waitForRequest(
      (request) => /google-analytics\.com\/(g\/)?collect/.test(request.url())
        && new URL(request.url()).searchParams.get("en") === "add_to_cart",
      { timeout: 15_000 },
    );
    await addToCart.click();
    await analyticsRequest;

    const cart = await page.evaluate(() => JSON.parse(sessionStorage.getItem("tc_cart") ?? "[]"));
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ product_slug: "stickers" });

    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Your Cart" })).toBeVisible();
    await expect(page.getByText("Stickers", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Proceed to Checkout/i })).toBeVisible();
  });
});
