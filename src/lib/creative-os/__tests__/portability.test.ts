import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { compileBrief, type FactsResolution, type LocalFactsAdapter } from '../compile';
import { ContractError, digest, validateBriefInput, validateBundle, type BriefInput, type Bundle, type Configuration, type SourceRef } from '../contracts';

// Deliberately synthetic: these products, amounts and claims are not catalogue facts.
const instant = '2026-09-09T18:00:00.000Z';
const source: SourceRef = { id: 'synthetic-source', kind: 'repository', observedAt: instant, revisionOrDigest: 'synthetic-revision', evidenceScope: 'Synthetic acceptance fixture only.', limitation: 'No live business or asset verification.' };
const cardClaim = 'Business card example: compare front and reverse hierarchy.';
const bannerClaim = 'Banner example: compare headline and action placement.';

function fixture(productSlug = 'business-cards', exact = false, brandKey = 'sample-print'): { bundle: Bundle; request: BriefInput; adapter: LocalFactsAdapter } {
  const claimText = productSlug === 'banners' ? bannerClaim : cardClaim;
  const configuration: Configuration = { stock: 'sample-card', sides: 2, qty: 40 };
  const bundle: Bundle = {
    schemaVersion: 2, kind: 'creative_os_bundle',
    kit: {
      id: 'sample-kit', brandKey, revision: 1, usageScope: 'fixture_only', sourceRefs: [source],
      identity: { name: 'Sample Print Studio', website: 'https://sample.example/', address: 'Example studio address', phone: 'Example phone' },
      voice: ['Explain the example plainly.'], visualConstraints: ['Use readable typography.'],
      logoPolicy: { requirement: 'optional', illustrativeOverlay: 'forbidden', instructions: 'Leave illustrated artwork clear of the studio mark.' },
      actionPolicy: { requiredIdentityFields: ['name', 'website'], instructions: 'Direct the reader to the supplied website.' },
    },
    recipes: [{
      id: 'sample-recipe', brandKey, revision: 1, purpose: exact ? 'offer' : 'education', productSlug,
      offerMode: exact ? 'exact_configuration' : 'education', purchaseQuestion: 'How should the example organize the message?',
      headlineDirection: 'Compare the example layout', requiredVisibleText: [claimText], claimIds: ['layout-claim'],
      visualLane: { id: 'comparison', instructions: 'Compare the supplied illustrative layouts.' },
      contactPanel: { id: 'website-footer', instructions: 'Place the supplied website in the footer.' },
      proofKinds: ['illustration'], diversityTags: ['educational-comparison'], avoid: ['Do not imply this is completed customer work.'],
    }],
    proofs: [{
      id: 'sample-proof', brandKey, revision: 1, usageScope: 'fixture_only', proofKind: 'illustration', rightsStatus: 'cleared', allowedUse: 'creative_brief',
      assetId: 'synthetic-asset', sha256: 'a'.repeat(64), disclosure: 'Synthetic illustration for compiler acceptance only.',
      sourceRefId: 'proof-source', sourceRefs: [{ ...source, id: 'proof-source' }],
    }],
  };
  const request: BriefInput = {
    schemaVersion: 2, kind: 'creative_brief_request', id: 'sample-request', brandKey,
    recipeId: 'sample-recipe', proofId: 'sample-proof', productSlug, mode: exact ? 'exact_configuration' : 'education',
    configuration: exact ? configuration : null, expectedFingerprint: null, expectedSourceRevision: null, expectedSourceDigest: null,
  };
  const adapter: LocalFactsAdapter = {
    brandKey,
    validateConfiguration(input: unknown): Configuration {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('Sample card configuration required');
      const c = input as Configuration;
      if (Object.keys(c).sort().join(',') !== 'qty,sides,stock' || c.stock !== 'sample-card' || c.sides !== 2 || !Number.isSafeInteger(c.qty) || Number(c.qty) <= 0) throw new ContractError('Invalid sample card configuration');
      return { stock: c.stock, sides: c.sides, qty: c.qty };
    },
    resolve(r): FactsResolution {
      return {
        brandKey, productSlug, mode: r.mode, sourceRevision: 'synthetic-revision', sourceDigest: digest(source), checkedAt: instant,
        verificationScope: 'local_source_only', runtimeFlags: {}, sourceRefs: [source],
        claims: [{ id: 'layout-claim', productSlug, text: claimText, sourceRefIds: [source.id] }, { id: 'action-claim', productSlug, text: 'Explore the example', sourceRefIds: [source.id] }],
        requiredVisibleText: [claimText], cta: { url: 'https://sample.example/', instruction: 'Explore the example', preselectionVerified: false },
        quote: exact ? {
          currency: 'CAD', amountMinor: 12300, rawSubtotalMinor: 12300, minimumAdjustmentMinor: 0, minimumDisclosure: null,
          costMinor: null, margin: null, factFingerprint: digest({ configuration: r.configuration, synthetic: true }),
          configuration: r.configuration!, configurationLabel: 'Synthetic card offer', sourceRuleIds: ['synthetic-rule'],
        } : null,
      };
    },
  };
  return { bundle, request, adapter };
}

describe('contrasting synthetic portability acceptance', () => {
  it.each(['business-cards', 'banners'])('uses the actual True Color kit for synthetic %s education without sticker composition', productSlug => {
    const { bundle, request, adapter } = fixture(productSlug, false, 'true-color');
    bundle.kit = JSON.parse(readFileSync('docs/social/creative-os/examples/truecolor-kit.json', 'utf8'));
    const resolve = adapter.resolve;
    adapter.resolve = r => { const facts = resolve(r); return { ...facts, cta: { ...facts.cta, url: bundle.kit.identity.website! } }; };
    const brief = compileBrief(request, bundle, adapter);
    expect(brief.brandKey).toBe('true-color');
    expect(brief.kitRef.digest).toBe(digest(bundle.kit));
    expect(brief.requiredVisibleText).toContain(productSlug === 'banners' ? bannerClaim : cardClaim);
    expect(brief.layoutInstructions.join(' ')).toContain(bundle.recipes[0].visualLane.instructions);
    expect([brief.headlineDirection, brief.captionGuidance, ...brief.requiredVisibleText, ...brief.layoutInstructions].join(' ')).not.toMatch(/sticker|vinyl|takeout|jar label/i);
    expect(brief.facts.quote).toBeNull();
    expect(brief.usageScope).toBe('fixture_only');
  });

  it('explicitly rejects the superseded schema instead of treating old briefs as portable', () => {
    const { bundle, request } = fixture();
    expect(() => validateBundle({ ...bundle, schemaVersion: 1 })).toThrow(/schema/i);
    expect(() => validateBriefInput({ ...request, schemaVersion: 1 })).toThrow(/schema/i);
  });

  it.each(['business-cards', 'banners'])('compiles %s education without a print configuration or inherited sticker copy', productSlug => {
    const { bundle, request, adapter } = fixture(productSlug);
    const validate = vi.spyOn(adapter, 'validateConfiguration');
    const brief = compileBrief(request, bundle, adapter);
    expect(brief.facts.quote).toBeNull();
    expect(brief.requiredVisibleText).toContain(productSlug === 'banners' ? bannerClaim : cardClaim);
    expect(brief.diversitySignature).toContain(productSlug);
    expect(validate).not.toHaveBeenCalled();
    expect(JSON.stringify(brief)).not.toMatch(/sticker|vinyl|true.?color|306-954-8688/i);
    expect(brief.status).toBe('draft');
    expect(brief.usageScope).toBe('fixture_only');
  });

  it('binds an exact card offer without shape through the domain validator', () => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    const validate = vi.spyOn(adapter, 'validateConfiguration');
    const brief = compileBrief(request, bundle, adapter);
    expect(validate).toHaveBeenCalledWith(request.configuration);
    expect(brief.facts.quote?.configuration).toEqual({ stock: 'sample-card', sides: 2, qty: 40 });
    expect(brief.facts.quote?.configuration).not.toHaveProperty('shape');
    expect(brief.facts.quote?.amountMinor).toBe(12300);
  });

  it.each([{ sides: 2, qty: 40 }, { stock: 'unsupported', sides: 2, qty: 40 }, { stock: 'sample-card', sides: 2, qty: -1 }])('rejects invalid adapter-specific configuration %j', configuration => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    // Shared validation cannot know card stock. The injected adapter must decide.
    expect(() => validateBriefInput({ ...request, configuration })).not.toThrow();
    expect(() => compileBrief({ ...request, configuration }, bundle, adapter)).toThrow(/configuration/i);
  });

  it('rejects a resolver silently changing valid exact configuration', () => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    const resolve = adapter.resolve;
    adapter.resolve = r => { const facts = resolve(r); return { ...facts, quote: { ...facts.quote!, configuration: { ...r.configuration, qty: 80 } } }; };
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/configuration/i);
  });

  it('rejects a domain validator changing the canonical input before resolution', () => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    adapter.validateConfiguration = () => ({ stock: 'sample-card', sides: 2, qty: 80 });
    const resolve = vi.spyOn(adapter, 'resolve');
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/configuration/i);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects in-place validator mutation without changing the caller input', () => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    const original = structuredClone(request);
    const validate = adapter.validateConfiguration;
    adapter.validateConfiguration = input => {
      (input as Configuration).qty = 80;
      return validate(input);
    };
    const resolve = vi.spyOn(adapter, 'resolve');
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/configuration|mutat/i);
    expect(request).toEqual(original);
    expect(digest(request)).toBe(digest(original));
    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects in-place resolver configuration mutation and preserves the original binding', () => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    const original = structuredClone(request);
    const resolve = adapter.resolve;
    adapter.resolve = input => {
      input.configuration!.qty = 80;
      return resolve(input);
    };
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/configuration|mutat/i);
    expect(request).toEqual(original);
    adapter.resolve = resolve;
    const brief = compileBrief(request, bundle, adapter);
    expect(brief.requestDigest).toBe(digest(original));
    expect(brief.facts.quote?.configuration.qty).toBe(40);
  });

  it('uses a second brand with required overlay, website-only action and no address or phone', () => {
    const { bundle, request, adapter } = fixture('banners', false, 'sample-learning');
    bundle.kit.identity = { name: 'Sample Learning Lab', website: 'https://learning.example/' };
    bundle.kit.logoPolicy = { requirement: 'required', illustrativeOverlay: 'allowed', instructions: 'Place the learning emblem on the illustrative panel.' };
    bundle.kit.actionPolicy = { requiredIdentityFields: ['website'], instructions: 'Use the learning website as the sole contact action.' };
    bundle.recipes[0].contactPanel = { id: 'learning-link', instructions: 'Use a single learning website footer.' };
    const resolve = adapter.resolve;
    adapter.resolve = r => { const facts = resolve(r); return { ...facts, cta: { ...facts.cta, url: 'https://learning.example/' } }; };
    const brief = compileBrief(request, bundle, adapter);
    const guidance = brief.layoutInstructions.join(' ');
    expect(guidance).toContain(bundle.kit.logoPolicy.instructions);
    expect(guidance).toContain(bundle.kit.actionPolicy.instructions);
    expect(guidance).not.toMatch(/Logo optional|no logo overlay/i);
    expect(brief.contactPanel).not.toHaveProperty('address');
    expect(brief.contactPanel).not.toHaveProperty('phone');
    expect(brief.contactPanel.website).toBe('https://learning.example/');
    expect(JSON.stringify(brief)).not.toMatch(/true.?color|sticker|216 33rd/i);
  });

  it('refuses absent identity fields required by the selected brand policy', () => {
    const { bundle, request, adapter } = fixture();
    bundle.kit.identity = { name: 'Sample Studio', website: 'https://sample.example/' };
    bundle.kit.actionPolicy.requiredIdentityFields = ['phone'];
    expect(() => compileBrief(request, bundle, adapter)).toThrow();
  });

  it('blocks an actual-work recipe when the only proof is an illustration', () => {
    const { bundle, request, adapter } = fixture();
    bundle.recipes[0].purpose = 'proof';
    bundle.recipes[0].proofKinds = ['actual_work'];
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/proof|kind/i);
  });

  it('preserves independent proof provenance and makes asset hash tampering visible in its digest', () => {
    const { bundle, request, adapter } = fixture();
    expect(bundle.kit.sourceRefs.some(s => s.id === bundle.proofs[0].sourceRefId)).toBe(false);
    const original = compileBrief(request, bundle, adapter);
    expect(original.proofRefs[0]).toMatchObject({ assetId: 'synthetic-asset', sha256: 'a'.repeat(64), sourceRefs: bundle.proofs[0].sourceRefs });
    expect(original.claimRefs).toContainEqual({ id: 'layout-claim', productSlug: 'business-cards', text: cardClaim, sourceRefIds: [source.id] });
    bundle.proofs[0].sha256 = 'b'.repeat(64);
    const changed = compileBrief(request, bundle, adapter);
    expect(changed.proofRefs[0].digest).not.toBe(original.proofRefs[0].digest);
    expect(changed.inputBundleDigest).not.toBe(original.inputBundleDigest);
  });

  it.each(['missing-source', 'empty-provenance', 'invalid-hash'])('refuses incomplete proof provenance: %s', failure => {
    const { bundle, request, adapter } = fixture();
    if (failure === 'missing-source') bundle.proofs[0].sourceRefId = 'absent';
    if (failure === 'empty-provenance') bundle.proofs[0].sourceRefs = [];
    if (failure === 'invalid-hash') bundle.proofs[0].sha256 = 'tampered';
    expect(() => compileBrief(request, bundle, adapter)).toThrow();
  });

  it.each(['request', 'adapter', 'proof', 'facts'])('refuses cross-brand %s injection', target => {
    const { bundle, request, adapter } = fixture();
    if (target === 'request') request.brandKey = 'alien';
    if (target === 'adapter') adapter.brandKey = 'alien';
    if (target === 'proof') bundle.proofs[0].brandKey = 'alien';
    if (target === 'facts') { const resolve = adapter.resolve; adapter.resolve = r => ({ ...resolve(r), brandKey: 'alien' }); }
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/brand|mismatch/i);
  });

  it.each(['expectedFingerprint', 'expectedSourceDigest', 'expectedSourceRevision'] as const)('rejects stale %s', field => {
    const { bundle, request, adapter } = fixture('business-cards', true);
    request[field] = field === 'expectedSourceRevision' ? 'stale-revision' : 'f'.repeat(64);
    expect(() => compileBrief(request, bundle, adapter)).toThrow(/stale/i);
  });

  it.each(['unattributed-text', 'wrong-product', 'missing-claim', 'orphan-source'])('refuses claim leakage: %s', failure => {
    const { bundle, request, adapter } = fixture('banners');
    if (failure === 'unattributed-text') bundle.recipes[0].requiredVisibleText.push('White vinyl stickers for product packaging.');
    if (failure === 'missing-claim') bundle.recipes[0].claimIds = ['absent'];
    if (failure === 'wrong-product' || failure === 'orphan-source') {
      const resolve = adapter.resolve;
      adapter.resolve = r => { const facts = resolve(r); facts.claims[0] = { ...facts.claims[0], ...(failure === 'wrong-product' ? { productSlug: 'stickers' } : { sourceRefIds: ['absent'] }) }; return facts; };
    }
    expect(() => compileBrief(request, bundle, adapter)).toThrow();
  });

  it('allows packaging wording when it is explicitly attributed to the selected product', () => {
    const { bundle, request, adapter } = fixture('business-cards');
    const text = 'Business card example shown beside packaging.';
    bundle.recipes[0].requiredVisibleText = [text];
    const resolve = adapter.resolve;
    adapter.resolve = r => { const facts = resolve(r); return { ...facts, requiredVisibleText: [text], claims: [{ ...facts.claims[0], text }, facts.claims[1]] }; };
    expect(compileBrief(request, bundle, adapter).requiredVisibleText).toContain(text);
  });
});
