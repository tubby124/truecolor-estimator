/**
 * Playwright fixtures with authenticated page support.
 *
 * Usage in test files:
 *   import { test, expect } from "../helpers/auth-fixtures";
 *
 *   test("sees orders", async ({ authenticatedPage }) => {
 *     await authenticatedPage.goto("/account");
 *     // ... user is already logged in
 *   });
 */
import { test as base, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  deleteTestOrders,
  generateMagicLink,
  getSiteUrl,
} from "./supabase-admin";

export interface AuthFixtures {
  /** A Page that is already authenticated as a test customer */
  authenticatedPage: Page;
  /** The test user's email */
  testUserEmail: string;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create test user
    const testUser = await createTestUser("pw-fixture");

    // Get magic link
    const magicLink = await generateMagicLink("pw-fixture");

    // Create a fresh context (isolated cookies)
    const context: BrowserContext = await browser.newContext();
    const page = await context.newPage();

    // Navigate to magic link to authenticate
    // The magic link redirects through /account/callback which sets the session
    await page.goto(magicLink, { waitUntil: "networkidle" });

    // Wait for redirect to /account (authenticated state)
    await page.waitForURL("**/account", { timeout: 15_000 });

    // Hand the authenticated page to the test
    await use(page);

    // Cleanup
    await context.close();
    await deleteTestOrders("pw-fixture");
    await deleteTestUser("pw-fixture");
  },

  testUserEmail: async ({}, use) => {
    const testUser = await createTestUser("pw-fixture");
    await use(testUser.email);
  },
});

export { expect };
