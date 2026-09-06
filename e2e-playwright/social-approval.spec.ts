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
  await context.addCookies([{ name: `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co").hostname.split(".")[0]}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: baseURL }]);
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

test('monthly review paginates exact destinations and resets confirmation after editing times', async ({ page }) => {
  const batch = '00000000-0000-4000-8000-000000000099';
  let patched: unknown;
  let edited = false;
  await page.route('**/api/staff/social/batch/monthly?*', route => {
    const next = new URL(route.request().url()).searchParams.get('page') === '1';
    return route.fulfill({ json: { posts: [{ id }], total: 10, hasMore: !next } });
  });
  await page.route(`**/api/staff/social/posts/${id}/approval`, route => route.fulfill({ json: { ...review(), post: { ...review().post, gbp_payload: { topicType: 'OFFER', event: { title: 'Synthetic offer', schedule: { startDate: { year: 2027, month: 1, day: 12 }, endDate: { year: 2027, month: 1, day: 20 } } }, offer: { termsConditions: 'Exact reviewed synthetic terms', redeemOnlineUrl: 'https://example.test/offer' } }, schedule_time: edited ? '2027-01-15T20:30:00Z' : review().post.schedule_time }, target: { platform: 'gbp', accountId: 'accounts/synthetic', pageId: 'locations/synthetic' } } }));
  await page.route(`**/api/staff/social/posts/${id}`, async route => {
    patched = route.request().postDataJSON(); edited = true;
    return route.fulfill({ json: { ...review().post, ...patched as object } });
  });
  await page.goto(`/staff/social/review?batchId=${batch}`);
  await expect(page.getByText(/10 destination drafts saved. Page 1/)).toBeVisible();
  await expect(page.getByText(/Google Business Profile · account/)).toBeVisible();
  await expect(page.getByText('Terms: Exact reviewed synthetic terms')).toBeVisible();
  await expect(page.getByText('Starts: 2027-01-12 · Ends: 2027-01-20')).toBeVisible();
  await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/Page 2/)).toBeVisible();
  await expect(page.getByRole('checkbox').nth(1)).not.toBeChecked();
  await page.locator('input[type="datetime-local"]').fill('2027-01-15T14:30');
  await page.getByRole('button', { name: 'Save time and reload review' }).click();
  expect(patched).toEqual({ schedule_time: '2027-01-15T20:30:00.000Z' });
  await expect(page.getByText(/January 15, 2027/)).toBeVisible();
  await expect(page.getByRole('checkbox').nth(1)).not.toBeChecked();
});

test('monthly invalid date remains editable before any durable chunk attempt', async ({ page }) => {
  const business = '00000000-0000-4000-8000-000000000001';
  await page.addInitScript(({ business, id }) => {
    localStorage.setItem(`social-monthly-preparation-v1:${business}`, JSON.stringify({ batchId: id, month: '2027-01', chunks: [], creatives: [{ id, requestId: id, imageUrl: '/images/logo.png', captions: { instagram: 'Manual caption', facebook: '', gbp: '' }, time: '2027-02-01T15:00', channels: ['instagram'], productSlug: '' }] }));
  }, { business, id });
  let writes = 0;
  await page.route('**/api/staff/social/batch/monthly?*', route => route.fulfill({ json: { businessId: business, batches: [], hasMore: false } }));
  await page.route('**/api/staff/social/batch/monthly', route => { writes++; return route.fulfill({ json: { posts: [{ id }] } }); });
  await page.goto('/staff/social/monthly');
  await page.getByRole('button', { name: 'Save drafts in chunks' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'within the selected Regina month' })).toBeVisible();
  expect(writes).toBe(0);
  await expect(page.locator('input[type="datetime-local"]')).toBeEnabled();
  await page.locator('input[type="datetime-local"]').fill('2027-01-15T15:00');
  await page.getByRole('button', { name: 'Save drafts in chunks' }).click();
  await expect(page.getByText('All chunks saved. Open exact review to approve each page.')).toBeVisible();
  expect(writes).toBe(1);
});

test('monthly partial generation resumes missing channels with a new stable attempt', async ({ page }) => {
  const sharp = (await import('sharp')).default;
  const photo = await sharp({ create: { width: 600, height: 600, channels: 3, background: '#fff' } }).jpeg().toBuffer();
  await page.route('**/images/logo.png', route => route.fulfill({ contentType: 'image/jpeg', body: photo }));
  const business = '00000000-0000-4000-8000-000000000001';
  await page.addInitScript(({ business, id }) => {
    const key = `social-monthly-preparation-v1:${business}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ batchId: id, month: '2027-01', chunks: [], creatives: [{ id, requestId: id, imageUrl: '/images/logo.png', captions: { instagram: '', facebook: '', gbp: '' }, time: '2027-01-15T15:00', channels: ['instagram', 'facebook'], productSlug: '' }] }));
  }, { business, id });
  await page.route('**/api/staff/social/batch/monthly?*', route => route.fulfill({ json: { businessId: business, batches: [], hasMore: false } }));
  const requests: Record<string, unknown>[] = [];
  await page.route('**/api/staff/social/captions', async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    const complete = !!body.resumeJobId;
    return route.fulfill({ json: { jobId: body.requestId, status: complete ? 'completed' : 'partial', drafts: complete ? { instagram: 'Retained Instagram', facebook: 'Recovered Facebook' } : { instagram: 'Retained Instagram' }, facts: null, usage: { calls: 1, promptTokens: null, completionTokens: null, costUsd: null, provider: 'fixture', model: 'fixture', providerRequestIds: [] }, errors: [], hashtags: '', cacheHit: false } });
  });
  await page.goto('/staff/social/monthly');
  await page.getByRole('button', { name: 'Generate / resume selected captions' }).click();
  await expect(page.getByRole('button', { name: 'Resume missing channels with a new attempt' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Resume missing channels with a new attempt' }).click();
  await expect(page.getByText('Generation completed.')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].resumeJobId).toBe(requests[0].requestId);
  expect(requests[1].requestId).not.toBe(requests[0].requestId);
  expect(requests[1].selectedChannels).toEqual(['instagram', 'facebook']);
  expect(requests[1].image_base64).toBe(requests[0].image_base64);
  await expect(page.locator('textarea').nth(0)).toHaveValue('Retained Instagram');
  await expect(page.locator('textarea').nth(1)).toHaveValue('Recovered Facebook');
});
