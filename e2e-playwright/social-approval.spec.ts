import { test, expect } from "@playwright/test";

const id = "12345678-1234-1234-1234-123456789abc";
const caption = "A precise saved caption.\n\n#Saskatoon";
const review = (status = "draft") => ({
  post: { id, status, approval_hash: status === "ready" ? "test-fingerprint" : null, caption_instagram: "  A precise saved caption.  ", hashtags: "#Saskatoon", schedule_time: "2027-01-12T21:00:00Z", image_urls: [], alt_text: "Synthetic image" },
  fingerprint: "test-fingerprint", target: { platform: "instagram", accountId: "synthetic-ig", pageId: "synthetic-page" }, blockers: [], publishingEnabled: false,
  content: { caption, imageUrls: ["/images/logo.png"] },
});

test.beforeEach(async ({ context, page, baseURL }) => {
  // Local UI fixture only. Staff APIs are intercepted; no production session or secret.
  if (!baseURL?.startsWith("http://localhost:")) throw new Error("Social UI fixtures must run on localhost");
  const session = { access_token: "fixture.header.signature", refresh_token: "fixture", token_type: "bearer", expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "fixture-owner", email: "info@true-color.ca" } };
  await context.addCookies([{ name: "sb-example-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: baseURL }]);
  await page.route("**/api/staff/**", route => route.fulfill({ json: [] }));
});

test("mobile review persists by URL and approves the canonical saved version", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let approved = false;
  let postedBody: unknown;
  await page.route(`**/api/staff/social/posts/${id}/approval`, async route => {
    if (route.request().method() === "POST") { postedBody = route.request().postDataJSON(); approved = true; return route.fulfill({ json: { post: review("ready").post } }); }
    return route.fulfill({ json: review(approved ? "ready" : "draft") });
  });
  await page.goto(`/staff/social/review?ids=${id}`);
  await expect(page.getByRole("heading", { name: "Review saved batch" })).toBeVisible();
  await expect(page.getByText(caption, { exact: true })).toBeVisible();
  await expect(page.getByText(/January 12, 2027/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Approve 1 posts" }).click();
  expect(postedBody).toEqual({ fingerprint: "test-fingerprint", rightsConfirmed: true });
  await expect(page.getByText("Approval saved for this version.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Approval saved for this version.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Batch approval saved" })).toBeDisabled();
});

test("account or media blockers prevent approval", async ({ page }) => {
  await page.route(`**/api/staff/social/posts/${id}/approval`, route => route.fulfill({ json: { ...review(), target: null, blockers: ["Instagram target credentials are not configured"] } }));
  await page.goto(`/staff/social/review?ids=${id}`);
  await expect(page.getByText("Instagram target credentials are not configured")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await expect(page.getByRole("button", { name: "Approve 1 posts" })).toBeDisabled();
});
