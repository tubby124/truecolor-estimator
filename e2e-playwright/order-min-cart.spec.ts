import { test, expect, type Page } from "@playwright/test";

// Cart order-minimum surcharge — visual end-to-end validation.
//
// Owner decision 2026-05-20: replaces the per-product min charge killed yesterday
// with a $25 ORDER-TOTAL minimum. Customer sees honest per-piece prices everywhere,
// but if the cart total comes in below $25, a transparent "Small order setup fee"
// tops it up. Above $25, no surcharge.
//
// This spec seeds sessionStorage with a mock cart, loads /cart, and asserts the
// UI surfaces the right line items + nudge based on subtotal.

interface MockCartItem {
  id: string;
  product_name: string;
  product_slug: string;
  category: string;
  label: string;
  config: Record<string, unknown>;
  sell_price: number;
  gst_rate: number;
  qty: number;
}

function makeCartItem(sellPrice: number, label = "Test Sticker"): MockCartItem {
  return {
    id: crypto.randomUUID(),
    product_name: label,
    product_slug: "stickers",
    category: "STICKER",
    label,
    config: { category: "STICKER", qty: 1, width_in: 2, height_in: 3 },
    sell_price: sellPrice,
    gst_rate: 0.05,
    qty: 1,
  };
}

async function seedCart(page: Page, items: MockCartItem[]) {
  // Visit a page on the same origin first so sessionStorage is writable.
  await page.goto("/");
  await page.evaluate((cart) => {
    sessionStorage.setItem("tc_cart", JSON.stringify(cart));
  }, items);
}

test.describe("Cart order-minimum surcharge", () => {
  test("$0.44 cart (1 tiny sticker, Hasan's repro) shows surcharge + nudge", async ({ page }) => {
    await seedCart(page, [makeCartItem(0.44, "1× 2×3\" Sticker")]);
    await page.goto("/cart");

    // The transparent fee line appears
    await expect(page.getByText("Small order setup fee")).toBeVisible();

    // Surcharge amount math: 25 - 0.44 = 24.56
    await expect(page.getByText("+$24.56")).toBeVisible();

    // Effective subtotal shows $25.00 (not $0.44)
    const subtotalRow = page.locator("text=Subtotal").locator("xpath=..");
    await expect(subtotalRow).toContainText("$25.00");

    // Nudge tells customer how to skip the fee
    await expect(page.getByText(/Add\s+\$24\.56\s+more product to skip this setup fee/)).toBeVisible();
  });

  test("$24.99 cart adds tiny $0.01 surcharge to reach exactly $25", async ({ page }) => {
    await seedCart(page, [makeCartItem(24.99, "Almost-minimum order")]);
    await page.goto("/cart");

    await expect(page.getByText("Small order setup fee")).toBeVisible();
    await expect(page.getByText("+$0.01")).toBeVisible();
    await expect(page.locator("text=Subtotal").locator("xpath=..")).toContainText("$25.00");
  });

  test("$25 cart is exactly at minimum — no surcharge, no nudge", async ({ page }) => {
    await seedCart(page, [makeCartItem(25, "At-minimum order")]);
    await page.goto("/cart");

    await expect(page.getByText("Small order setup fee")).not.toBeVisible();
    await expect(page.getByText(/Add .* more product to skip this setup fee/)).not.toBeVisible();
    await expect(page.locator("text=Subtotal").locator("xpath=..")).toContainText("$25.00");
  });

  test("$30 cart is above minimum — no surcharge, no nudge", async ({ page }) => {
    await seedCart(page, [makeCartItem(30, "100× 1×3\" Stickers")]);
    await page.goto("/cart");

    await expect(page.getByText("Small order setup fee")).not.toBeVisible();
    await expect(page.getByText(/Add .* more product to skip this setup fee/)).not.toBeVisible();
    await expect(page.locator("text=Subtotal").locator("xpath=..")).toContainText("$30.00");
  });

  test("multi-item $15 cart adds surcharge based on TOTAL not per-item", async ({ page }) => {
    // Three items at $5 each = $15 subtotal → $10 surcharge to reach $25
    await seedCart(page, [
      makeCartItem(5, "Item 1"),
      makeCartItem(5, "Item 2"),
      makeCartItem(5, "Item 3"),
    ]);
    await page.goto("/cart");

    await expect(page.getByText("Small order setup fee")).toBeVisible();
    await expect(page.getByText("+$10.00")).toBeVisible();
    await expect(page.locator("text=Subtotal").locator("xpath=..")).toContainText("$25.00");
  });

  test("$500 large cart shows clean total, no surcharge UI clutter", async ({ page }) => {
    await seedCart(page, [makeCartItem(500, "Big order")]);
    await page.goto("/cart");

    await expect(page.getByText("Small order setup fee")).not.toBeVisible();
    await expect(page.locator("text=Subtotal").locator("xpath=..")).toContainText("$500.00");
  });
});
