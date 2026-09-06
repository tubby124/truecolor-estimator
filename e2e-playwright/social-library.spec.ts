import { test, expect } from "@playwright/test";

const asset = {
  id: "synthetic-banner", sha256: "a".repeat(64), filename: "fixture.png", title: "Synthetic banner",
  description: "Synthetic fixture only; no customer artwork.", alt: "Synthetic library preview",
  category: "banners", kind: "photo", sourceUrl: "https://truecolorprinting.ca/fixture.png",
  sourcePage: "https://truecolorprinting.ca/gallery", sourceType: "website-gallery", width: 320, height: 240,
  bytes: 100, rightsStatus: "review-required", privacyStatus: "review-required", sourcePublished: true,
  tags: ["banner"], previewUrl: "/synthetic-library-preview.svg",
};

test.beforeEach(async ({ context, page, baseURL }) => {
  if (!baseURL?.startsWith("http://localhost:")) throw new Error("Social library fixtures must run on localhost");
  const session = { access_token: "fixture.header.signature", refresh_token: "fixture", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "fixture-owner", email: "info@true-color.ca" } };
  await context.addCookies([{ name: `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co").hostname.split(".")[0]}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: baseURL }]);
  await page.route("**/api/staff/**", route => route.fulfill({ json: [] }));
  await page.route("**/synthetic-library-preview.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#eeeeee"/><text x="20" y="120" font-size="20">Synthetic preview</text></svg>' }));
  await page.setViewportSize({ width: 390, height: 844 });
});

test("mobile private library browses and filters without publishing controls", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/staff/") && request.method() !== "GET") mutations.push(request.method()); });
  await page.route("**/api/staff/social/library", route => route.fulfill({ json: { state: "ready", collectedAt: "2026-09-06T00:00:00Z", assets: [asset, { ...asset, id: "synthetic-held", title: "Synthetic held sign", category: "signs", sourceType: "google-business-profile", rightsStatus: "hold", tags: ["sign"] }] } }));
  await page.goto("/staff/social/library");
  await expect(page.getByRole("heading", { name: "Private asset library" })).toBeVisible();
  await expect(page.getByText("Held — do not use", { exact: true })).toBeVisible();
  await expect(page.getByText("Rights and privacy need review", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const headingBounds = await page.getByRole("heading", { name: "Private asset library" }).boundingBox();
  expect(headingBounds?.width).toBeGreaterThanOrEqual(320);
  expect(headingBounds?.x).toBeLessThan(40);
  await expect(page.getByRole("img", { name: "Synthetic library preview" }).first()).toBeVisible();
  await expect.poll(() => page.getByRole("img", { name: "Synthetic library preview" }).first().evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /approve|publish|schedule|post now/i })).toHaveCount(0);
  await page.getByLabel("Search photos").fill("held");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Synthetic held sign" })).toBeVisible();
  await page.getByLabel("Search photos").fill("");
  await page.getByRole("combobox", { name: /^Category/ }).selectOption("banners");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Synthetic banner", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: /^Category/ }).selectOption("");
  await page.getByRole("combobox", { name: /^Source/ }).selectOption("google-business-profile");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByText("Held — do not use", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("private-library-mobile.png"), fullPage: true });
  expect(mutations).toEqual([]);
});

test("missing catalog and provider failure remain recoverable on phone", async ({ page }) => {
  let fail = false;
  await page.route("**/api/staff/social/library", route => route.fulfill(fail
    ? { status: 503, json: { error: "The private library could not be loaded." } }
    : { json: { state: "unavailable", assets: [], message: "No catalog is available yet." } }));
  await page.goto("/staff/social/library");
  await expect(page.getByRole("status")).toHaveText("No catalog is available yet.");
  fail = true;
  await page.getByRole("button", { name: "Refresh previews" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The private library could not be loaded." })).toHaveText("The private library could not be loaded.");
  await expect(page.getByRole("button", { name: "Refresh previews" })).toBeEnabled();
});
