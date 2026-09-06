import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { groupMonthPlan, parseMonthPlan, planReginaTime, prepareMonthCreative, verifyPlanFiles } from '../monthly-plan';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const creative = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111', title: 'Banner in use', scheduleTime: '2026-10-01T02:00:00Z',
  captionFacebook: 'Banner printing for your next event. #TrueColorPrinting #SaskatoonPrintShop',
  captionInstagram: 'Bring your event name into view with a printed banner. #TrueColorPrinting #SaskatoonPrintShop',
  imageFilename: 'banner.jpg', imageSha256: digest('original'), ...overrides,
});
const packageOf = (...creatives: ReturnType<typeof creative>[]) => ({ schemaVersion: 1, kind: 'truecolor-month-plan', title: 'First four weeks', creatives });
const facts = { slug: 'vinyl-banners', fingerprint: digest('facts'), configuration: { category: 'BANNER', material_code: 'VINYL_13OZ', width_in: 36, height_in: 24, sides: 1, qty: 1, addons: [], design_status: 'PRINT_READY', is_rush: false } };

describe('private prepared month import', () => {
  it('splits by Regina month rather than UTC or browser date, preserving stable creative IDs', () => {
    const plan = parseMonthPlan(JSON.stringify(packageOf(creative(), creative({ id: '22222222-2222-4222-8222-222222222222', scheduleTime: '2026-10-01T16:00:00Z', imageFilename: 'sign.png', imageSha256: digest('sign') }))));
    const groups = groupMonthPlan(plan);
    expect(Object.keys(groups)).toEqual(['2026-09', '2026-10']);
    expect(groups['2026-09'][0].id).toBe(creative().id);
    expect(planReginaTime(groups['2026-09'][0].scheduleTime)).toBe('2026-09-30T20:00');
  });
  it.each(['2026-02-30T10:00:00Z', '2026-09-01T10:00', '2026-09-01T24:00:00Z', '2026-09-01T10:00:01Z', '2026-09-01T10:00:00+14:01', '2026-09-01T10:00:00+01:60'])('rejects normalized, ambiguous or lossy timestamps: %s', value => {
    expect(() => parseMonthPlan(packageOf(creative({ scheduleTime: value })))).toThrow();
  });
  it('accepts explicit offsets and leap days at minute precision', () => {
    expect(planReginaTime('2028-02-29T10:00-06:00')).toBe('2028-02-29T10:00');
    expect(planReginaTime('2026-10-01T01:00:00+02:00')).toBe('2026-09-30T17:00');
  });
  it('requires bounded package version, kind, count and UUIDs', () => {
    for (const value of [{ ...packageOf(creative()), schemaVersion: 2 }, { ...packageOf(creative()), kind: 'other' }, packageOf(), packageOf(...Array.from({ length: 32 }, () => creative())), packageOf(creative({ id: 'new-id' })), packageOf(creative(), creative({ imageFilename: 'other.jpg', imageSha256: digest('other') }))]) {
      expect(() => parseMonthPlan(value)).toThrow();
    }
  });
  it('rejects duplicate images, filenames and path references', () => {
    expect(() => parseMonthPlan(packageOf(creative(), creative({ id: '22222222-2222-4222-8222-222222222222', imageFilename: 'renamed.jpg' })))).toThrow(/unique image/);
    for (const imageFilename of ['../banner.jpg', 'photos/banner.jpg', 'C:\\banner.jpg', 'https://example.com/a.jpg', 'banner.jpg\n', 'banner.svg']) expect(() => parseMonthPlan(packageOf(creative({ imageFilename })))).toThrow(/basename/);
    expect(() => parseMonthPlan(packageOf(creative({ imageSha256: 'not-a-hash' })))).toThrow();
  });
  it('validates selected Meta destinations and their caption limits, without inventing a destination', () => {
    expect(parseMonthPlan(packageOf(creative({ captionInstagram: '' }))).creatives[0].channels).toEqual(['facebook']);
    expect(parseMonthPlan(packageOf(creative({ channels: ['instagram'] }))).creatives[0].channels).toEqual(['instagram']);
    for (const overrides of [{ channels: [] }, { channels: ['gbp'] }, { channels: ['facebook', 'facebook'] }, { captionFacebook: 42 }, { captionInstagram: 'x'.repeat(2201) }, { channels: ['facebook'], captionFacebook: ' ' }]) expect(() => parseMonthPlan(packageOf(creative(overrides)))).toThrow();
  });
  it('only carries a typed configuration snapshot and fingerprint; rejects invented price fields and rush overrides', () => {
    expect(parseMonthPlan(packageOf(creative({ product: facts }))).creatives[0].product).toEqual(facts);
    for (const product of [{ ...facts, price: 1 }, { ...facts, fingerprint: 'old' }, { ...facts, configuration: { ...facts.configuration, sell_price: 1 } }, { ...facts, configuration: { ...facts.configuration, qty: 0 } }, { ...facts, configuration: { ...facts.configuration, is_rush: true } }, { ...facts, configuration: { ...facts.configuration, addons: ['FAKE'] } }, { ...facts, configuration: {} }]) expect(() => parseMonthPlan(packageOf(creative({ product })))).toThrow();
  });
  it('verifies exact file bytes and unambiguous filename mapping before upload', async () => {
    const plan = parseMonthPlan(packageOf(creative()));
    const file = new File(['original'], 'banner.jpg', { type: 'image/jpeg' });
    expect((await verifyPlanFiles(plan.creatives, [file])).get(creative().id)).toBe(file);
    await expect(verifyPlanFiles(plan.creatives, [])).rejects.toThrow(/exactly one/);
    await expect(verifyPlanFiles(plan.creatives, [file, file])).rejects.toThrow(/exactly one/);
    await expect(verifyPlanFiles(plan.creatives, [new File(['changed'], 'banner.jpg', { type: 'image/jpeg' })])).rejects.toThrow(/bytes do not match/);
    await expect(verifyPlanFiles(plan.creatives, [new File(['original'], 'banner.jpg', { type: 'text/plain' })])).rejects.toThrow(/supported image/);
  });
  it('prepares exact captions, verified source binding and caller-provided request ID without approval or generation state', () => {
    const item = parseMonthPlan(packageOf(creative({ product: facts }))).creatives[0];
    const result = prepareMonthCreative(item, 'https://example.com/photo.jpg', 'fresh-request-id');
    expect(result).toEqual({ id: item.id, requestId: 'fresh-request-id', imageUrl: 'https://example.com/photo.jpg', time: '2026-09-30T20:00', channels: ['facebook', 'instagram'], captions: { facebook: item.captionFacebook, instagram: item.captionInstagram, gbp: '' }, productSlug: facts.slug, configuration: facts.configuration, factFingerprint: facts.fingerprint });
    expect(result).not.toHaveProperty('jobId');
    expect(result).not.toHaveProperty('approval');
  });
});
