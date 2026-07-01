import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  generateMagicLink,
  testEmail,
} from "./helpers/supabase-admin";

const SUFFIX = "magic-link";

test.describe("Magic link authentication flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await createTestUser(SUFFIX);
  });

  test.afterAll(async () => {
    await deleteTestUser(SUFFIX);
  });

  test("admin-generated magic link signs user in", async ({ page }) => {
    const magicLink = await generateMagicLink(SUFFIX);
    await page.goto(magicLink, { waitUntil: "networkidle" });
    await page.waitForURL("**/account", { timeout: 15_000 });

    const email = testEmail(SUFFIX);
    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });
  });

  test("invalid magic link shows error with retry CTA", async ({ page }) => {
    await page.goto("/account/callback?token_hash=invalid&type=magiclink", {
      waitUntil: "networkidle",
    });

    await expect(
      page.getByText("Link expired or already used")
    ).toBeVisible({ timeout: 15_000 });

    // Retry CTA should link back to /account
    const backLink = page.getByRole("link", { name: /back to sign in/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/account");
  });

  test("callback page with no params redirects to /account", async ({
    page,
  }) => {
    await page.goto("/account/callback");
    await page.waitForURL("**/account", { timeout: 15_000 });

    // Should not be on the callback page anymore
    expect(page.url()).not.toContain("/callback");
  });
});
