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
      await expect(page.locator(`main a[href="${href}"]`)).not.toHaveCount(0);
    }

    await expect(page.locator('main a[href^="https://www.google.com/maps/dir"]')).toHaveCount(1);

    await page.locator('main a[href="/products/coroplast-signs"]').first().click();
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

  test("paid landing page is stable at every launch viewport", async ({ page }) => {
    await page.route(/trustindex|cdn\.trustindex/i, (route) => route.abort());
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/why-true-color", { waitUntil: "domcontentloaded" });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
        `${viewport.width}x${viewport.height} horizontal overflow`,
      ).toBe(false);
      await expect(page.getByRole("heading", { name: "Real printing. Clear pricing. Local pickup." })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Google reviews from local customers" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Printed here. Pick up here." })).toBeVisible();
      await expect(page.getByRole("link", { name: "Get Directions" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Request My Quote" })).toBeVisible();
      await expect(page.getByText("4.9 out of 5 from 43 Google reviews.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Read all reviews" })).toHaveAttribute("href", /google\.com\/maps\/place/);

      for (const testId of ["storefront-frame", "roland-frame"]) {
        const frame = page.getByTestId(testId);
        await frame.scrollIntoViewIfNeeded();
        await expect(frame.locator("img")).toBeVisible();
        await expect.poll(() => frame.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
    }
  });

  test("compact quote form submits its exact no-quantity UX successfully", async ({ page }) => {
    let quoteRequests = 0;
    await page.route("**/api/quote-request", async (route) => {
      quoteRequests += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sent: true }) });
    });
    await page.goto("/why-true-color");
    await page.locator("#custom-quote").scrollIntoViewIfNeeded();
    await page.getByLabel("Name *").fill("Paid Test Buyer");
    await page.getByLabel("Email *").fill("paid-test@example.com");
    await page.getByLabel("Product *").selectOption("Vinyl Banners");
    await page.getByLabel(/Size, material, deadline/).fill("Custom 8 foot event banner");
    await page.getByRole("button", { name: "Request My Quote" }).click();
    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
    expect(quoteRequests).toBe(1);
  });

  test("paid landing exposes meaningful image text and visible keyboard focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/why-true-color", { waitUntil: "domcontentloaded" });
    const imageAlts = await page.locator("main img").evaluateAll((images) =>
      images.map((image) => image.getAttribute("alt")?.trim() ?? ""),
    );
    expect(imageAlts.length).toBeGreaterThan(0);
    expect(imageAlts.every(Boolean)).toBe(true);

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/Skip to content/i);
    await expect(focused).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  for (const route of paidProductRoutes) {
    test(`${route} can be configured and added to cart with persistent next steps`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const qtyButtons = page.getByRole("radiogroup", { name: "Quantity" }).getByRole("radio");
      await expect(qtyButtons.nth(1)).toBeVisible();
      const addButton = page.getByRole("button", { name: /Add to Cart/i });
      // The first accepted estimate proves hydration and pricing are ready
      // before exercising a real configuration change.
      await expect(addButton).toBeEnabled();
      const selectedQty = Number((await qtyButtons.nth(1).innerText()).trim());
      await qtyButtons.nth(1).click();
      await expect(qtyButtons.nth(1)).toHaveAttribute("aria-checked", "true");
      await expect(addButton).toBeEnabled();
      await addButton.click();
      await expect(page.getByRole("link", { name: "Continue shopping" })).toBeVisible();
      await expect(page.getByRole("link", { name: "View cart", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Checkout", exact: true })).toHaveAttribute("href", "/checkout");
      expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("tc_cart") ?? "[]")[0]?.qty)).toBe(selectedQty);
      await page.getByRole("link", { name: "Checkout", exact: true }).click();
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(page.getByText(new RegExp(`×\\s*${selectedQty}`)).first()).toBeVisible();
    });
  }

  test("checkout blocks invalid email and failed selected artwork before order creation", async ({ page }) => {
    await page.route("**/api/checkout-sessions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ captured: true }),
      });
    });
    await page.goto("/");
    await page.evaluate(() => {
      sessionStorage.setItem("tc_cart", JSON.stringify([{
        id: "paid-e2e-item",
        product_name: "Coroplast Signs",
        product_slug: "coroplast-signs",
        category: "SIGN",
        label: "18×24 Coroplast Sign — 1-sided × 1",
        config: { category: "SIGN", width_in: 18, height_in: 24, sides: 1, qty: 1, material_code: "CORO-4MM", design_status: "PRINT_READY", addons: [] },
        sell_price: 25,
        gst_rate: 0.05,
        qty: 1,
      }]));
    });
    await page.goto("/checkout");
    await page.getByLabel("Name *").fill("Paid Test Buyer");
    await page.getByLabel("Email *").fill("not-an-email");
    let orderRequests = 0;
    await page.route("**/api/orders", async (route) => {
      orderRequests += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "unexpected" }) });
    });
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    expect(orderRequests).toBe(0);

    await page.getByLabel("Email *").fill("paid-test@example.com");
    const uploadTarget = page.getByRole("button", { name: "Choose artwork files" });
    await uploadTarget.focus();
    await expect(uploadTarget).toBeFocused();
    const chooserPromise = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: "customer-artwork.pdf", mimeType: "application/pdf", buffer: Buffer.from("test") });
    await page.route("**/api/upload", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "UPLOAD_FAILED" }) });
    });
    await page.getByRole("button", { name: /^Pay \$/ }).click();
    await expect(page.getByText(/Artwork upload failed for customer-artwork\.pdf/)).toBeVisible();
    await expect(page.getByText(/No order or payment was started/)).toBeVisible();
    expect(orderRequests).toBe(0);
  });

  test("quantity radio groups support arrow-key selection", async ({ page }) => {
    for (const route of ["/products/coroplast-signs", "/products/stickers"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const group = page.getByRole("radiogroup", { name: "Quantity" });
      const radios = group.getByRole("radio");
      await expect(radios.first()).toBeVisible();
      const selected = group.locator('[role="radio"][aria-checked="true"]');
      await expect(selected).toHaveCount(1);
      await selected.focus();
      await page.keyboard.press("ArrowRight");
      const moved = group.locator('[role="radio"][aria-checked="true"]');
      await expect(moved).toHaveCount(1);
      await expect(moved).toBeFocused();
      expect(await radios.evaluateAll((items) => items.filter((item) => item.tabIndex === 0).length)).toBe(1);
    }
  });

  test("only the latest estimate can be added and empty custom dimensions clear price", async ({ page }) => {
    await page.route("**/api/estimate", async (route) => {
      const qty = Number(route.request().postDataJSON()?.qty ?? 1);
      await new Promise((resolve) => setTimeout(resolve, qty === 5 ? 250 : qty === 10 ? 25 : 5));
      try {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ sell_price: qty * 10, line_items: [], gst_rate: 0.05 }),
        });
      } catch {
        // An aborted stale request is the expected result.
      }
    });
    await page.goto("/products/coroplast-signs", { waitUntil: "domcontentloaded" });
    // Wait for hydration and the initial estimate before exercising the rapid
    // quantity changes. A pre-hydration click can update the DOM without ever
    // reaching React when this suite runs several product journeys in parallel.
    await expect(page.getByRole("button", { name: /Add to Cart/i })).toBeEnabled();
    const quantity = page.getByRole("radiogroup", { name: "Quantity" });
    await quantity.getByRole("radio", { name: "5", exact: true }).click();
    await expect(quantity.getByRole("radio", { name: "5", exact: true })).toHaveAttribute("aria-checked", "true");
    await quantity.getByRole("radio", { name: "10", exact: true }).click();
    await expect(quantity.getByRole("radio", { name: "10", exact: true })).toHaveAttribute("aria-checked", "true");
    const addButton = page.getByRole("button", { name: /Add to Cart/i });
    await expect(addButton).toBeEnabled();
    await addButton.click();
    const cartItem = await page.evaluate(() => JSON.parse(sessionStorage.getItem("tc_cart") ?? "[]")[0]);
    expect(cartItem).toMatchObject({ qty: 10, sell_price: 100 });

    await page.goto("/products/coroplast-signs", { waitUntil: "domcontentloaded" });
    await page.getByRole("radiogroup", { name: "Size" }).getByRole("button", { name: "Custom", exact: true }).click();
    await expect(page.getByRole("button", { name: /Add to Cart/i })).toBeDisabled();
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
