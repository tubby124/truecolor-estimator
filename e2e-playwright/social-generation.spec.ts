import { test, expect } from '@playwright/test';
const usage = { calls: 0, costUsd: 0, promptTokens: 0, completionTokens: 0, model: 'mock', provider: 'mock', providerRequestIds: [] };
test.beforeEach(async ({ context, page, baseURL }) => {
  if (!baseURL?.startsWith('http://localhost:')) throw new Error('Mocked caption contracts require localhost');
  const session = { access_token: 'fixture.header.signature', refresh_token: 'fixture', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'fixture-owner', email: 'info@true-color.ca' } };
  await context.addCookies([{ name: `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co').hostname.split('.')[0]}-auth-token`, value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'), url: baseURL }]);
  await page.route('**/api/staff/**', route => route.fulfill({ json: [] }));
  await page.route('**/api/staff/social/generation/settings', route => route.fulfill({ json: { configured: true, providerReady: true, dailyCallLimit: 20, dailyUsdLimit: null, maxCostPerCallUsd: null, usedCalls: 0, reservedCalls: 0, usedUsd: 0, reservedUsd: 0, model: 'mock' } }));
  await page.goto('/staff/social/compose');
  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await page.getByPlaceholder('Describe the photo, product and intended audience').fill('A colourful banner showcase');
});
test('selected channels and stable request IDs survive repeat preparation without X', async ({ page }) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route('**/api/staff/social/captions', async route => {
    const b = route.request().postDataJSON(); bodies.push(b);
    await route.fulfill({ json: { jobId: b.requestId, status: 'completed', drafts: { facebook: 'A colourful print idea for Saskatoon.' }, facts: null, cacheHit: true, usage, errors: [], hashtags: '', hashtagEvidence: { kind: 'generic', researchedAt: null, sources: [] }, instagram: '', facebook: 'A colourful print idea for Saskatoon.', gbp: '', twitter: '', alt_text: '', angle: '' } });
  });
  await page.getByRole('checkbox', { name: 'instagram', exact: true }).uncheck();
  await page.getByRole('button', { name: /Rewrite with AI/ }).click();
  await expect(page.getByText(/Reused saved copy/)).toBeVisible();
  await page.getByRole('button', { name: /Rewrite with AI/ }).click();
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[0].selectedChannels).toEqual(['facebook']);
  expect(bodies[1].requestId).toBe(bodies[0].requestId);
  await expect(page.getByText('X / Twitter', { exact: true })).toHaveCount(0);
  const review = page.getByRole('region', { name: 'Marketing quality review' });
  await expect(review.getByText('Fix copy before owner review')).toBeVisible();
  await expect(review.getByText(/Include #TrueColorPrinting/)).toBeVisible();
  await page.locator('textarea').filter({ hasText: 'A colourful print idea for Saskatoon.' }).first().fill('Display your services on a retractable banner. Our onsite graphic designer can help with artwork. #TrueColorPrinting #SaskatoonPrintShop');
  await expect(review.getByText('Copy preflight complete — photo and marketing review still required')).toBeVisible();
  await review.getByText('Check the actual image, caption and destination').click();
  await expect(review.getByText(/Mix clean studio treatments with authentic finished-product/)).toBeVisible();
  expect(bodies).toHaveLength(2); // Editing/reviewing never triggers another generation.
});
test('confirmed stale facts offer an explicit fresh request', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/api/staff/social/captions', route => {
    ids.push(route.request().postDataJSON().requestId);
    return route.fulfill({ status: 409, json: { error: 'Request ID belongs to stale catalogue facts. Start a new request.' } });
  });
  await page.getByRole('button', { name: /Rewrite with AI/ }).click();
  await page.getByRole('button', { name: 'Start with current catalogue facts' }).click();
  await expect.poll(() => ids.length).toBe(2); expect(ids[0]).not.toBe(ids[1]);
});
