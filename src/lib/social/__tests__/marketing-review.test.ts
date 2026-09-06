import { describe, it, expect } from 'vitest';
import { reviewMarketingCaption } from '../marketing-review';
const tags = '#TrueColorPrinting #SaskatoonPrintShop';
describe('marketing preflight uses maintained brand rules without certifying images', () => {
  it('rejects the previously generic sample even after adding brand tags', () => {
    const result = reviewMarketingCaption({ channel: 'instagram', caption: `Take a few steps back. Can you find the main message in your display? ${tags}` });
    expect(result.status).toBe('FIX');
    expect(result.findings.map(f => f.code)).toContain('generic-advice');
    expect(result.findings.map(f => f.code)).toContain('service');
  });
  it('requires the core tags on Facebook as well as Instagram without accepting prefix matches', () => {
    const result = reviewMarketingCaption({ channel: 'facebook', caption: 'Banner printing with design help. #TrueColorPrintingExtra #SaskatoonPrintShop' });
    expect(result.findings.some(f => f.message.includes('#TrueColorPrinting'))).toBe(true);
  });
  it('leaves substantive image and rights review open after a useful caption passes mechanical checks', () => {
    const result = reviewMarketingCaption({ channel: 'instagram', caption: `Banner printing for your event. Our onsite graphic designer can help with the artwork. ${tags}` });
    expect(result.findings).toEqual([]);
    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.manualChecks.join(' ')).toContain('QR code');
  });
  it('detects repeated prose even when hashtags change', () => {
    expect(reviewMarketingCaption({ channel: 'facebook', caption: `Order your banner online. ${tags}`, recentCaptions: ['Order your banner online. #Different'] }).findings.map(f => f.code)).toContain('duplicate');
  });
  it('accepts natural plural product names', () => {
    expect(reviewMarketingCaption({ channel: 'instagram', caption: `Banners for event entrances. Our onsite graphic designer can help. ${tags}` }).findings).toEqual([]);
  });
  it('keeps Google tag-free', () => {
    expect(reviewMarketingCaption({ channel: 'gbp', caption: 'Order standard print products online and upload your artwork.' }).findings).toEqual([]);
    expect(reviewMarketingCaption({ channel: 'gbp', caption: `Order standard print products online. ${tags}` }).findings.map(f => f.code)).toContain('google-tags');
  });
});
