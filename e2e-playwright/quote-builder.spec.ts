/**
 * e2e: Quote Builder modal — /staff/quotes
 *
 * Tests:
 * 1. Auth gate: unauthenticated access to /staff/quotes redirects or shows login
 * 2. API guard: /api/staff/quotes/[id]/send-quote returns 401 without session
 * 3. API guard: /api/staff/quotes/[id]/send-reply returns 401 without session
 * 4. Account quotes API: /api/account/quotes returns 401 without session
 * 5. Public site is still up
 */

import { test, expect } from "@playwright/test";

const PROD = "https://truecolorprinting.ca";
const LOCAL = process.env.BASE_URL || "http://localhost:3000";

const base = process.env.TEST_AGAINST_PROD === "1" ? PROD : LOCAL;

test.describe("Quote Builder — security + API guards", () => {
  test("public homepage loads", async ({ page }) => {
    const res = await page.goto(`${base}/`);
    expect(res?.status()).toBe(200);
  });

  test("unauthenticated /staff/quotes redirects to login", async ({ page }) => {
    await page.goto(`${base}/staff/quotes`, { waitUntil: "networkidle" });
    const url = page.url();
    // Should either be on /staff/login or a redirect occurred
    expect(url).toMatch(/\/staff\/login|\/login/);
  });

  test("send-quote API returns 401 without session", async ({ request }) => {
    const res = await request.post(`${base}/api/staff/quotes/fake-id/send-quote`, {
      data: {
        to: "test@example.com",
        customerName: "Test",
        lineItems: [{ description: "Test item", qty: "1", unitPrice: "100" }],
      },
    });
    expect(res.status()).toBe(401);
  });

  test("send-reply API returns 401 without session", async ({ request }) => {
    const res = await request.post(`${base}/api/staff/quotes/fake-id/send-reply`, {
      data: { to: "test@example.com", subject: "Test", body: "Hello" },
    });
    expect(res.status()).toBe(401);
  });

  test("account quotes API returns 401 without session", async ({ request }) => {
    const res = await request.get(`${base}/api/account/quotes`);
    expect(res.status()).toBe(401);
  });

  test("quote-request form endpoint rejects GET", async ({ request }) => {
    const res = await request.get(`${base}/api/quote-request`);
    expect(res.status()).toBe(405);
  });
});

test.describe("Quote Builder — staff flow (requires STAFF_PASSWORD env)", () => {
  const staffPassword = process.env.STAFF_PASSWORD;
  const staffEmail = process.env.STAFF_EMAIL || "albert@true-color.ca";

  test.skip(!staffPassword, "STAFF_PASSWORD not set — skipping authenticated tests");

  test("staff can log in and see /staff/quotes", async ({ page }) => {
    // Navigate to staff login
    await page.goto(`${base}/staff/login`);
    await page.fill('input[type="email"]', staffEmail);
    await page.fill('input[type="password"]', staffPassword!);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${base}/staff/**`, { timeout: 10_000 });

    // Now go to quotes
    await page.goto(`${base}/staff/quotes`);
    await expect(page.locator("h1")).toContainText("Quote Requests");
  });
});
