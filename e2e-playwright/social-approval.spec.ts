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

test("editing approved draft revokes to draft without shifting Regina schedule", async ({ page }) => {
  let saved: Record<string, unknown> | undefined;
  await page.route(`**/api/staff/social/posts/${id}`, async route => {
    if (route.request().method() === "PATCH") { saved = route.request().postDataJSON(); return route.fulfill({ json: { ...review().post, ...saved } }); }
    return route.fulfill({ json: { ...review("ready").post, caption_raw: "Original", platforms: ["instagram"], image_url: "/images/logo.png", created_at: "2026-09-05T12:00:00Z" } });
  });
  await page.route(`**/api/staff/social/posts/${id}/approval`, route => route.fulfill({ json: review() }));
  await page.goto(`/staff/social/${id}`);
  await expect(page.locator('input[type="time"]')).toHaveValue("15:00");
  await page.getByRole("button", { name: "Save & Review" }).click();
  await expect(page).toHaveURL(new RegExp(`/staff/social/review\\?ids=${id}`));
  expect(saved?.status).toBe("draft");
  expect(saved?.schedule_time).toBe("2027-01-12T21:00:00.000Z");
});

test("phone image captioning uses the converted JPEG and saves an unapproved draft", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp({ create: { width: 600, height: 600, channels: 3, background: "#fff" } }).jpeg().toBuffer();
  const imageUrl = "https://dczbgraekmzirxknjvwe.supabase.co/storage/v1/object/public/social-images/social/2026/1234.jpg";
  await page.route(imageUrl, route => route.fulfill({ contentType: "image/jpeg", body: jpeg }));
  await page.route("**/api/staff/social/upload", route => {
    expect(route.request().postData()).toContain('name="format"');
    return route.fulfill({ json: { url: imageUrl } });
  });
  await page.route("**/api/staff/social/captions", route => {
    expect(route.request().postDataJSON().image_type).toBe("image/jpeg");
    return route.fulfill({ json: { instagram: "A converted photo", facebook: "A converted photo", twitter: "A converted photo" } });
  });
  let saved: { posts: Array<{ schedule_time: string; platforms: string[] }> } | undefined;
  await page.route("**/api/staff/social/batch", route => {
    saved = route.request().postDataJSON();
    return route.fulfill({ json: { created: 1, posts: [{ id, status: "draft" }] } });
  });
  await page.route(`**/api/staff/social/posts/${id}/approval`, route => route.fulfill({ json: review() }));
  await page.goto("/staff/social/batch");
  await page.locator('input[type="date"]').fill("2027-01-12");
  await page.locator('input[type="file"]').setInputFiles({ name: "phone.heic", mimeType: "image/heic", buffer: Buffer.from("synthetic undecodable original") });
  await page.getByRole("button", { name: /Generate 1 caption/ }).click();
  await expect(page.getByRole("button", { name: "Save 1 posts · 2 deliveries" }).first()).toBeVisible();
  // Clearing a slot date is recoverable and does not crash the review.
  await page.locator('input[type="datetime-local"]').fill("");
  await expect(page.getByRole("button", { name: "Save 1 posts · 2 deliveries" }).first()).toBeVisible();
  await page.locator('input[type="datetime-local"]').fill("2027-01-12T15:00");
  await page.getByRole("button", { name: "Save 1 posts · 2 deliveries" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/staff/social/review\\?ids=${id}`));
  expect(saved?.posts[0].schedule_time).toBe("2027-01-12T21:00:00.000Z");
  expect(saved?.posts[0].platforms).toEqual(["instagram", "facebook"]);
});


test("Facebook review displays its exact caption and Page destination", async ({ page }) => {
  await page.route(`**/api/staff/social/posts/${id}/approval`, route => route.fulfill({json:{...review(), target:{platform:"facebook",accountId:"synthetic-page",pageId:"synthetic-page"}, content:{caption:"Exact Facebook caption",imageUrls:["/images/logo.png"]}}}));
  await page.goto(`/staff/social/review?ids=${id}`);
  await expect(page.getByText("Facebook · account synthetic-page · Page synthetic-page",{exact:true})).toBeVisible();
  await expect(page.getByText("Exact Facebook caption",{exact:true})).toBeVisible();
  await expect(page.getByText(caption,{exact:true})).toHaveCount(0);
});
