import { test, expect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  generateMagicLink,
  generatePasswordResetLink,
  testEmail,
} from "./helpers/supabase-admin";

const SUFFIX = "magic-link";
const PW_SUFFIX = "magic-link-pw";

test.describe("Magic link authentication flows", () => {
  test.beforeAll(async () => {
    await createTestUser(SUFFIX);
    await createTestUser(PW_SUFFIX);
  });

  test.afterAll(async () => {
    await deleteTestUser(SUFFIX);
    await deleteTestUser(PW_SUFFIX);
  });

  test("admin-generated magic link signs user in", async ({ page }) => {
    const magicLink = await generateMagicLink(SUFFIX);
    await page.goto(magicLink, { waitUntil: "networkidle" });
    await page.waitForURL("**/account", { timeout: 15_000 });

    const email = testEmail(SUFFIX);
    const pageContent = page.locator("body");
    await expect(
      pageContent.getByText(email).or(pageContent.getByText("Sign out"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("expired/reused magic link shows error with retry CTA", async ({
    page,
  }) => {
    const magicLink = await generateMagicLink(SUFFIX);

    // First use -- should succeed
    await page.goto(magicLink, { waitUntil: "networkidle" });
    await page.waitForURL("**/account", { timeout: 15_000 });

    // Second use -- same link is now consumed
    await page.goto(magicLink, { waitUntil: "networkidle" });

    // Should show the error message (stays on /account/callback)
    await expect(
      page.getByText("Link expired or already used")
    ).toBeVisible({ timeout: 15_000 });

    // Retry CTA should link back to /account
    const backLink = page.getByRole("link", { name: /back to sign in/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/account");
  });

  test("password recovery link lands on reset form", async ({ page }) => {
    const resetLink = await generatePasswordResetLink(PW_SUFFIX);
    await page.goto(resetLink, { waitUntil: "networkidle" });
    await page.waitForURL("**/account?reset=1", { timeout: 15_000 });

    await expect(
      page.getByText("Set your new password")
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("#newpw")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /save password/i })
    ).toBeVisible();
  });

  test("after setting password, can sign in with email+password", async ({
    page,
  }) => {
    const newPassword = "NewSecurePass456!";

    // Step 1: Use recovery link to get to password reset form
    const resetLink = await generatePasswordResetLink(PW_SUFFIX);
    await page.goto(resetLink, { waitUntil: "networkidle" });
    await page.waitForURL("**/account?reset=1", { timeout: 15_000 });

    // Step 2: Set a new password
    await page.locator("#newpw").fill(newPassword);
    await page.getByRole("button", { name: /save password/i }).click();
    await expect(page.getByText("Password updated!")).toBeVisible({
      timeout: 10_000,
    });

    // Step 3: Sign out — navigate to /account which should show the sign-out state
    await page.goto("/account");
    await page.waitForURL("**/account", { timeout: 10_000 });

    const signOutBtn = page.getByText("Sign out");
    if (await signOutBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signOutBtn.click();
      await page.waitForURL("**/account", { timeout: 10_000 });
    }

    // Step 4: Sign in with email + new password
    await expect(page.locator("#pw-email")).toBeVisible({ timeout: 10_000 });
    const email = testEmail(PW_SUFFIX);
    await page.locator("#pw-email").fill(email);
    await page.locator("#pw-password").fill(newPassword);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should land on authenticated account page
    await expect(page.getByText("Your orders")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(email).or(page.getByText("Sign out"))
    ).toBeVisible({ timeout: 10_000 });
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
