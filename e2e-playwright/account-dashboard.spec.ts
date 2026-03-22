import { test, expect } from "./helpers/auth-fixtures";
import {
  createTestOrder,
  deleteTestOrders,
} from "./helpers/supabase-admin";

test.describe("Account dashboard — authenticated", () => {
  test.describe("with orders", () => {
    let orderNumber: string;
    let orderId: string;

    test.beforeEach(async () => {
      const result = await createTestOrder("pw-fixture");
      orderNumber = result.orderNumber;
      orderId = result.orderId;
    });

    test.afterEach(async () => {
      await deleteTestOrders("pw-fixture");
    });

    test("authenticated user sees order list", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector("text=Your orders");

      const orderCard = authenticatedPage.locator(`text=${orderNumber}`);
      await expect(orderCard).toBeVisible({ timeout: 10_000 });
    });

    test("order card shows status stepper, items count, total, and date", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector(`text=${orderNumber}`, {
        timeout: 10_000,
      });

      const card = authenticatedPage
        .locator("div")
        .filter({ hasText: orderNumber })
        .first();

      // Status badge — order is created with status "payment_received"
      await expect(card.getByText("Payment received")).toBeVisible();

      // Items count and total in the summary line: "... · 1 item · $111.00 CAD"
      const summaryLine = card.locator("text=/\\d+ items?/");
      await expect(summaryLine).toBeVisible();
      await expect(card.locator("text=/\\$\\d+\\.\\d{2} CAD/")).toBeVisible();

      // Date rendered (format: "Mon DD, YYYY" — e.g. "Mar 21, 2026")
      await expect(card.locator("text=/[A-Z][a-z]{2} \\d{1,2}, \\d{4}/")).toBeVisible();

      // StatusStepper — check for step labels
      await expect(card.getByText("Paid")).toBeVisible();
      await expect(card.getByText("Printing")).toBeVisible();
    });

    test("expand order shows item details — product name, qty, dimensions", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector(`text=${orderNumber}`, {
        timeout: 10_000,
      });

      // Click the order card to expand
      await authenticatedPage
        .locator("div.cursor-pointer")
        .filter({ hasText: orderNumber })
        .first()
        .click();

      // Expanded section should show item details
      const expanded = authenticatedPage.locator("div.bg-gray-50");
      await expect(expanded).toBeVisible({ timeout: 5_000 });

      // Product name from createTestOrder
      await expect(expanded.getByText("E2E Test Product")).toBeVisible();

      // Qty — "Qty 2"
      await expect(expanded.getByText(/Qty 2/)).toBeVisible();

      // Dimensions — "24×18"" (24 width × 18 height from createTestOrder)
      await expect(expanded.getByText(/24.*18/)).toBeVisible();

      // Sides — "Single-sided" (sides=1 from createTestOrder)
      await expect(expanded.getByText("Single-sided")).toBeVisible();
    });

    test("reorder button adds items to cart and redirects to /cart", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector(`text=${orderNumber}`, {
        timeout: 10_000,
      });

      // Click the Reorder button (visible on card header for non-pending_payment orders)
      const reorderBtn = authenticatedPage.getByRole("button", {
        name: "Reorder",
      });
      await expect(reorderBtn.first()).toBeVisible();
      await reorderBtn.first().click();

      // Button text changes to confirm
      await expect(
        authenticatedPage.getByText(/Going to cart/)
      ).toBeVisible();

      // Redirects to /cart
      await authenticatedPage.waitForURL("**/cart", { timeout: 10_000 });
    });

    test("file upload on pending_payment order shows success feedback", async ({
      authenticatedPage,
    }) => {
      // Delete the payment_received order and create a pending_payment one
      await deleteTestOrders("pw-fixture");
      const pendingOrder = await createTestOrder("pw-fixture", {
        status: "pending_payment",
      });

      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector(
        `text=${pendingOrder.orderNumber}`,
        { timeout: 10_000 }
      );

      // Expand the order to see upload section
      await authenticatedPage
        .locator("div.cursor-pointer")
        .filter({ hasText: pendingOrder.orderNumber })
        .first()
        .click();

      // File upload section should be visible
      const uploadSection = authenticatedPage.locator(
        "text=Your artwork file"
      );
      await expect(uploadSection).toBeVisible({ timeout: 5_000 });

      // Mock the upload API to avoid needing real Supabase storage in E2E
      await authenticatedPage.route(
        `**/api/account/orders/${pendingOrder.orderId}/upload-file`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              filePath: "customer-uploads/test/mock-file.pdf",
            }),
          });
        }
      );

      // Also mock the subsequent fetchOrders call so it doesn't error
      await authenticatedPage.route("**/api/account/orders", async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response });
      });

      // Upload a test file
      const fileInput = authenticatedPage.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test-artwork.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("fake-pdf-content"),
      });

      // Success message
      await expect(
        authenticatedPage.getByText(/File uploaded/)
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("empty state", () => {
    test.beforeEach(async () => {
      await deleteTestOrders("pw-fixture");
    });

    test("shows empty state when no orders exist", async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto("/account");
      await authenticatedPage.waitForSelector("text=Your orders");

      // Empty state message
      await expect(
        authenticatedPage.getByText("No orders yet.")
      ).toBeVisible({ timeout: 10_000 });

      // CTA link to products
      await expect(
        authenticatedPage.getByRole("link", { name: /Get a price/ })
      ).toBeVisible();
    });
  });

  test("sign out returns to login form", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/account");
    await authenticatedPage.waitForSelector("text=Your orders");

    // Click sign out
    const signOutBtn = authenticatedPage.getByRole("button", {
      name: "Sign out",
    });
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Login form should appear — "Sign in to your account" heading
    await expect(
      authenticatedPage.getByText("Sign in to your account")
    ).toBeVisible({ timeout: 10_000 });

    // Email and password inputs should be present
    await expect(
      authenticatedPage.locator('input[type="email"]')
    ).toBeVisible();
    await expect(
      authenticatedPage.locator('input[type="password"]')
    ).toBeVisible();
  });
});
