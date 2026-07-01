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
 *
 * Note: `use` here is the Playwright fixture param, not React's use hook.
 */
/* eslint-disable react-hooks/rules-of-hooks */
import {
  test as base,
  expect,
  type Page,
  type BrowserContext,
  type TestInfo,
} from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  deleteTestOrders,
} from "./supabase-admin";

export interface AuthFixtures {
  /** A Page that is already authenticated as a test customer */
  authenticatedPage: Page;
  /** The test user's email */
  testUserEmail: string;
  /** Unique test user suffix for this Playwright test */
  testUserSuffix: string;
}

function safeSuffix(testInfo: TestInfo): string {
  const raw = [
    "pw-fixture",
    `w${testInfo.workerIndex}`,
    `r${testInfo.retry}`,
    ...testInfo.titlePath.slice(-3),
  ].join("-");

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export const test = base.extend<AuthFixtures>({
  testUserSuffix: async ({}, use, testInfo) => {
    await use(safeSuffix(testInfo));
  },

  authenticatedPage: async ({ browser, testUserSuffix }, use) => {
    // Create test user
    const testUser = await createTestUser(testUserSuffix);

    // Create a fresh context (isolated cookies)
    const context: BrowserContext = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/account");
    await page.locator("#pw-email").fill(testUser.email);
    await page.locator("#pw-password").fill("TestPass123!");
    await page.getByRole("button", { name: "Sign in \u2192", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sign out", exact: true }))
      .toBeVisible({ timeout: 15_000 });

    // Hand the authenticated page to the test
    await use(page);

    // Cleanup
    await context.close();
    await deleteTestOrders(testUserSuffix);
    await deleteTestUser(testUserSuffix);
  },

  testUserEmail: async ({ testUserSuffix }, use) => {
    const testUser = await createTestUser(testUserSuffix);
    await use(testUser.email);
  },
});

export { expect };
