import { test, expect } from "./helpers/auth-fixtures";
import { test as base, expect as baseExpect } from "@playwright/test";
import {
  createTestUser,
  deleteTestUser,
  testEmail,
} from "./helpers/supabase-admin";

const STAFF_EMAIL = "info@true-color.ca";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const TEST_SUFFIXES = {
  signup: "auth-signup",
  signin: "auth-signin",
  wrongpw: "auth-wrongpw",
  staff: "auth-staff",
};

async function fillSignIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.locator("#pw-email").fill(email);
  await page.locator("#pw-password").fill(password);
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

base.describe("Auth — Sign Up / Sign In", () => {
  base.afterAll(async () => {
    for (const suffix of Object.values(TEST_SUFFIXES)) {
      await deleteTestUser(suffix).catch(() => {});
    }
  });

  // 1. Sign up new account -> "Check your inbox" confirmation
  base("sign up shows check-your-inbox confirmation", async ({ page }) => {
    const email = testEmail(TEST_SUFFIXES.signup);

    // Ensure clean state
    await deleteTestUser(TEST_SUFFIXES.signup).catch(() => {});

    await page.goto("/account");
    await page.waitForSelector("#pw-email");

    // Switch to sign-up mode
    await page.getByText("New here? Create account").click();
    await baseExpect(page.getByText("Create your account")).toBeVisible();

    // Fill sign-up form
    await page.locator("#pw-email").fill(email);
    await page.locator("#pw-password").fill("TestPass123!");
    await page.locator("#pw-confirm").fill("TestPass123!");

    // Submit
    await page.getByRole("button", { name: /Create account/i }).click();

    // Expect confirmation
    await baseExpect(page.getByText("Check your inbox!")).toBeVisible({
      timeout: 10_000,
    });
    await baseExpect(page.getByText(email)).toBeVisible();
  });

  // 2. Sign in with correct password -> orders page loads
  base("sign in with correct password loads account", async ({ page }) => {
    await createTestUser(TEST_SUFFIXES.signin);
    const email = testEmail(TEST_SUFFIXES.signin);

    await page.goto("/account");
    await page.waitForSelector("#pw-email");

    await fillSignIn(page, email, "TestPass123!");
    await page.getByRole("button", { name: /Sign in/i }).click();

    // After sign-in, the account page shows "Your orders" with email visible
    await baseExpect(page.getByText(email)).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.getByText("Sign out")).toBeVisible();
  });

  // 3. Sign in with wrong password -> error message
  base("sign in with wrong password shows error", async ({ page }) => {
    await createTestUser(TEST_SUFFIXES.wrongpw);
    const email = testEmail(TEST_SUFFIXES.wrongpw);

    await page.goto("/account");
    await page.waitForSelector("#pw-email");

    await fillSignIn(page, email, "WrongPassword999!");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await baseExpect(
      page.getByText(/Invalid (login )?credentials/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  // 5. Staff email sign-in -> redirects to /staff/orders
  base("staff email redirects to /staff/orders", async ({ page }) => {
    const staffPassword = process.env.E2E_STAFF_PASSWORD;
    base.skip(!staffPassword, "E2E_STAFF_PASSWORD not set");

    await page.goto("/account");
    await page.waitForSelector("#pw-email");

    await fillSignIn(page, STAFF_EMAIL, staffPassword!);
    await page.getByRole("button", { name: /Sign in/i }).click();

    await page.waitForURL("**/staff/orders", { timeout: 15_000 });
    await baseExpect(page).toHaveURL(/\/staff\/orders/);
  });

  // 6. Forgot password -> "Check your email" screen
  base("forgot password shows check-your-email screen", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForSelector("#fp-email");

    await page.locator("#fp-email").fill("someone@example.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();

    await baseExpect(page.getByText("Check your email")).toBeVisible({
      timeout: 10_000,
    });
    await baseExpect(page.getByText("someone@example.com")).toBeVisible();
  });

  // 7. Pre-filled email from URL param
  base("URL param pre-fills email and switches to sign-up", async ({ page }) => {
    const prefillEmail = "test@example.com";
    await page.goto(
      `/account?signup=1&email=${encodeURIComponent(prefillEmail)}`
    );
    await page.waitForSelector("#pw-email");

    // Should be in sign-up mode
    await baseExpect(page.getByText("Create your account")).toBeVisible();

    // Email should be pre-filled
    await baseExpect(page.locator("#pw-email")).toHaveValue(prefillEmail);

    // Confirm password field should be visible (sign-up mode)
    await baseExpect(page.locator("#pw-confirm")).toBeVisible();
  });

  // 8. Empty field validation — form does not submit
  base("empty fields prevent submission", async ({ page }) => {
    await page.goto("/account");
    await page.waitForSelector("#pw-email");

    // Click sign in with empty fields
    await page.getByRole("button", { name: /Sign in/i }).click();

    // Should still be on the login form (no loading state, no navigation)
    await baseExpect(page.getByText("Sign in to your account")).toBeVisible();

    // Fill email but leave password empty
    await page.locator("#pw-email").fill("test@example.com");
    await page.getByRole("button", { name: /Sign in/i }).click();

    // Still on login form
    await baseExpect(page.getByText("Sign in to your account")).toBeVisible();

    // Switch to sign-up, fill email+password but not confirm
    await page.getByText("New here? Create account").click();
    await page.locator("#pw-email").fill("test@example.com");
    await page.locator("#pw-password").fill("TestPass123!");
    // Leave confirm empty — passwords won't match
    await page.getByRole("button", { name: /Create account/i }).click();

    // Should show password mismatch error
    await baseExpect(
      page.getByText("Passwords don't match.")
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ── Test #4 uses the authenticated fixture ──────────────────────────────────────

test.describe("Auth — Authenticated User", () => {
  // 4. Sign out -> returns to login form
  test("sign out returns to login form", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByText("Sign out")).toBeVisible();

    await authenticatedPage.getByText("Sign out").click();

    // After sign out, the login form should reappear
    await expect(
      authenticatedPage.getByText("Sign in to your account")
    ).toBeVisible({ timeout: 10_000 });

    // The Sign out button should be gone
    await expect(authenticatedPage.getByText("Sign out")).not.toBeVisible();
  });
});
