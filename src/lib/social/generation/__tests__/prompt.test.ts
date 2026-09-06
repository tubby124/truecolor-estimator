import { describe, expect, it } from 'vitest';
import type { GenerationInput } from '../../generation-contract';
import { SAFE_RUSH_ENQUIRY, productHashtagDefaults, TRUE_COLOR_BUSINESS_PROFILE } from '../business-profile';
import { assemblePrompt, MODEL, PROFILE_VERSION, PROMPT_VERSION } from '../prompt';
import { validateDraft } from '../validation';
import { COMMERCE_POLICY } from '@/lib/commerce/policies';

const input = (selectedChannels: GenerationInput['selectedChannels']): GenerationInput => ({
  requestId: '00000000-0000-4000-8000-000000000002',
  selectedChannels,
  topic: 'A banner for an event entrance',
});

describe('maintained True Color caption profile', () => {
  it('allows only the approved rush enquiry while retaining commercial claim holds around it', () => {
    expect(validateDraft(SAFE_RUSH_ENQUIRY, 'facebook')).toBeNull();
    for (const text of [
      'Ask about our rush service.',
      `${SAFE_RUSH_ENQUIRY} Same-day printing.`,
      `${SAFE_RUSH_ENQUIRY} Just $40.`,
      `${SAFE_RUSH_ENQUIRY} Guaranteed delivery.`,
    ]) expect(validateDraft(text, 'facebook')).not.toBeNull();
  });

  it('supplies the confirmed designer service and required Meta tags without invented commercial terms', () => {
    const prompt = assemblePrompt(input(['facebook', 'instagram']), null, null, '', ['#BannerPrinting']);
    const context = JSON.parse(prompt.context);
    expect(TRUE_COLOR_BUSINESS_PROFILE.serviceFacts[0]).toMatchObject({
      status: 'owner_confirmed', provenance: [{ kind: 'owner_confirmation', checkedOn: '2026-09-06' }],
    });
    expect(context.businessFacts).toContain('An onsite graphic designer is available at True Color.');
    expect(context.businessFacts.join(' ')).not.toMatch(/\$|same.day|free|proof|turnaround/i);
    expect(context.businessFacts).not.toContain(null);
    expect(context.businessFacts).not.toContain(COMMERCE_POLICY.production.summary);
    for (const statement of context.businessFacts) expect(validateDraft(statement, 'instagram')).toBeNull();
    for (const channel of ['facebook', 'instagram']) {
      expect(context.hashtagRules[channel]).toEqual({ required: ['#TrueColorPrinting', '#SaskatoonPrintShop'], maxTotal: 5 });
    }
    expect(context.hashtagCandidates).toEqual(['#TrueColorPrinting', '#SaskatoonPrintShop', '#Saskatoon', '#CustomPrinting', '#PrintDesign', '#BannerPrinting']);
    expect(prompt.system).toContain('Every Facebook and Instagram caption must include #TrueColorPrinting #SaskatoonPrintShop');
    expect(prompt.system).toContain('Reject generic design lectures disconnected from the product or its use.');
    expect(context.imageRules).toContain('Preserve exact printed artwork, lettering, logos, colours and layout; never invent or repair unreadable detail.');
    expect(context.avoid).toContain('Generic design lectures');
  });

  it('gives the selected print product specific generic tags within the five-tag plan', () => {
    const prompt = assemblePrompt({...input(['instagram']), productSlug:'window-decals'}, null, null, '', []);
    const context = JSON.parse(prompt.context);
    expect(context.hashtagCandidates).toEqual(['#TrueColorPrinting','#SaskatoonPrintShop','#Saskatoon','#WindowGraphics','#DecalPrinting']);
    expect(context.genericHashtagDefaults).toEqual(productHashtagDefaults('window-decals'));
    expect(context.hashtagPolicy).toContain('not researched trends');
    expect(productHashtagDefaults('photo-posters')).toEqual(['#Saskatoon','#PosterPrinting','#CustomPosters']);
    expect(prompt.system).toContain('Aim for five relevant tags');
  });

  it('keeps brand hashtags out of GBP-only requests even when research supplies them', () => {
    const prompt = assemblePrompt(input(['gbp']), null, null, '', ['#TrueColorPrinting', '#BannerPrinting']);
    const context = JSON.parse(prompt.context);
    expect(context.channels).toEqual(['gbp']);
    expect(context.hashtagRules).toEqual({ gbp: { required: [], maxTotal: 0 } });
    expect(context.hashtagCandidates).toEqual([]);
    expect(prompt.system).toContain('GBP no hashtags, including brand hashtags.');
    expect(prompt.system).not.toContain('#TrueColorPrinting');
  });

  it('separates mixed-channel rules and invalidates the old prompt/profile cache recipes without a model change', () => {
    const prompt = assemblePrompt(input(['instagram', 'gbp']), null, null, '', ['#TrueColorPrinting']);
    const context = JSON.parse(prompt.context);
    expect(context.hashtagRules.instagram.required).toHaveLength(2);
    expect(context.hashtagRules.gbp).toEqual({ required: [], maxTotal: 0 });
    expect(context.hashtagCandidates).toEqual(['#TrueColorPrinting', '#SaskatoonPrintShop', '#Saskatoon', '#CustomPrinting', '#PrintDesign']);
    expect(PROMPT_VERSION).not.toBe('catalogue-captions-v1');
    expect(PROFILE_VERSION).toBe(TRUE_COLOR_BUSINESS_PROFILE.version);
    expect(PROFILE_VERSION).not.toBe('truecolor-shop-voice-v1');
    expect(MODEL).toBe('anthropic/claude-sonnet-4-6');
    expect(prompt.system).toContain('No currency, prices, percentages, quantities, dimensions, deadlines');
    expect(prompt.system).toContain('Do not infer material or customer relationship from a photo.');
  });
});
