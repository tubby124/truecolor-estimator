import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { compileBrief, type LocalFactsAdapter } from '../compile';
import { digest, validateBundle, validateBriefInput, type Bundle, type BriefInput } from '../contracts';
import { createTrueColorFactsAdapter } from '../truecolor-facts';
import { parseMonthPlan } from '../../social/monthly-plan';

const sourceMutation = vi.hoisted(() => ({ path: '' }));
vi.mock('node:fs', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs')>();
  return { ...original,readFileSync: (...args: Parameters<typeof original.readFileSync>) => {
    const result = original.readFileSync(...args);
    return sourceMutation.path && String(args[0]).endsWith(sourceMutation.path) && typeof result === 'string' ? `${result}\n// changed source fixture` : result;
  } };
});

function json(name: string) { return JSON.parse(readFileSync(`docs/social/creative-os/examples/${name}.json`,'utf8')); }
function fixture(): Bundle { return { schemaVersion: 2,kind: 'creative_os_bundle',kit: json('truecolor-kit'),recipes: json('sticker-recipes'),proofs: json('fixture-proofs') }; }
function requests(): BriefInput[] { return json('offer-inputs'); }
const adapter = () => createTrueColorFactsAdapter({ sourceRevision: 'test-local-revision',now: () => '2026-09-09T18:00:00.000Z' });

describe('offline creative brief contract', () => {
  it.each(['src/lib/data/loader.ts','src/lib/flags.ts','src/lib/commerce/policies.ts','src/lib/creative-os/truecolor-facts.ts'])('refuses %s edits after module import even before this adapter resolves', file => {
    sourceMutation.path = file;
    try { expect(() => compileBrief(requests()[0],fixture(),adapter())).toThrow(/sources changed/); }
    finally { sourceMutation.path = ''; }
  });
  it('compiles three differently bound briefs with truthful scope and exact visible price qualifiers', () => {
    const briefs = requests().map(r => compileBrief(r,fixture(),adapter()));
    expect(briefs).toHaveLength(3);
    expect(new Set(briefs.map(b => b.diversitySignature.join('|'))).size).toBe(3);
    expect(briefs.every(b => b.status === 'draft' && b.usageScope === 'fixture_only')).toBe(true);
    const exact = briefs[0];
    expect(exact.facts.quote?.amountMinor).toBe(2500);
    expect(exact.facts.quote?.costMinor).toBeNull();
    expect(exact.facts.quote?.margin).toBeNull();
    expect(exact.requiredVisibleText.join(' ')).toMatch(/25 square stickers.*2 × 2 inches.*white vinyl.*print-ready artwork.*no addons.*no rush/);
    expect(exact.requiredVisibleText.join(' ')).toContain('before tax');
    expect(exact.facts.cta.preselectionVerified).toBe(false);
    expect(exact.requiredVisibleText).toContain('Design example');
    expect(exact.requiredVisibleText.join(' ')).not.toMatch(/synthetic|fixture|no image has been produced/i);
    expect(exact.proofRefs[0].disclosure).toMatch(/synthetic/i);
    expect(exact.verificationReport.warnings.join(' ')).toMatch(/FIXTURE ONLY/);
    expect(briefs[1].requiredVisibleText.join(' ')).toContain('shape and size');
    expect(briefs[2].requiredVisibleText.join(' ')).toContain('Sticker design help');
    for (const brief of briefs.slice(1)) {
      expect(brief.facts.quote).toBeNull();
      expect(brief.requiredVisibleText.join(' ')).not.toMatch(/\d|\$/);
    }
  });
  it('resolves each compile and rejects stale fingerprint/source without falling back', () => {
    const factsAdapter = adapter(); const spy = vi.spyOn(factsAdapter,'resolve');
    const r = requests()[0];
    const first = compileBrief(r,fixture(),factsAdapter);
    compileBrief(r,fixture(),factsAdapter);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(() => compileBrief({...r,expectedFingerprint: 'f'.repeat(64)},fixture(),factsAdapter)).toThrow(/Stale fact/);
    expect(() => compileBrief({...r,expectedSourceRevision: 'old'},fixture(),factsAdapter)).toThrow(/Stale source/);
    expect(() => compileBrief({...r,expectedSourceDigest: 'f'.repeat(64)},fixture(),factsAdapter)).toThrow(/Stale local source/);
    const pinned = {...r,expectedFingerprint: first.facts.quote!.factFingerprint};
    expect(() => compileBrief({...pinned,configuration: {...r.configuration!,qty: 50}},fixture(),factsAdapter)).toThrow(/Stale fact/);
  });
  it('preserves stable maintained capability IDs and original source provenance', () => {
    const brief = compileBrief(requests()[2],fixture(),adapter());
    const claim = brief.claimRefs.find(c => c.id === 'onsite-graphic-designer');
    expect(claim?.text).toContain('onsite graphic designer');
    expect(claim?.sourceRefIds).toContain('onsite-graphic-designer-source-0');
    expect(brief.facts.sourceRefs.find(s => s.id === 'onsite-graphic-designer-source-0')).toMatchObject({kind: 'owner_decision',observedAt: '2026-09-06T00:00:00.000Z'});
    expect(brief.proofRefs[0].assetId).toBe(fixture().proofs[0].assetId);
    expect(brief.proofRefs[0].sha256).toBe(fixture().proofs[0].sha256);
  });
  it('rejects inconsistent quote totals or unsupported preselection claims', () => {
    const a = adapter(); const resolve = a.resolve;
    a.resolve = r => { const f = resolve(r); f.quote!.rawSubtotalMinor += 1; return f; };
    expect(() => compileBrief(requests()[0],fixture(),a)).toThrow(/quote reconciliation/);
    a.resolve = r => { const f = resolve(r); Object.assign(f.cta,{preselectionVerified: true}); return f; };
    expect(() => compileBrief(requests()[0],fixture(),a)).toThrow(/preselected/);
  });
  it('fails on unavailable source or a resolver changing the configuration', () => {
    const unavailable: LocalFactsAdapter = {brandKey: 'true-color',validateConfiguration: adapter().validateConfiguration,resolve: () => { throw new Error('source unavailable'); }};
    expect(() => compileBrief(requests()[0],fixture(),unavailable)).toThrow('source unavailable');
    const a = adapter(); const realResolve = a.resolve;
    a.resolve = r => { const f = realResolve(r); return {...f,quote: {...f.quote!,configuration: {...f.quote!.configuration,qty: 50}}}; };
    expect(() => compileBrief(requests()[0],fixture(),a)).toThrow(/configuration changed/);
  });
  it.each(['scheduleTime','approved','destinationId','price'])('rejects unknown %s fields', field => {
    expect(() => validateBundle({...fixture(),[field]: 'injected'})).toThrow(/unknown field/);
    expect(() => validateBriefInput({...requests()[0],[field]: 'injected'})).toThrow(/unknown field/);
  });
  it('requires complete exact configuration and excludes design quotes from this parser', () => {
    const r = requests()[0]; const incomplete = {...r.configuration} as Record<string, unknown>; delete incomplete.shape;
    expect(() => compileBrief({...r,configuration: incomplete},fixture(),adapter())).toThrow();
    expect(() => compileBrief({...r,configuration: {...r.configuration,design_status: 'NEEDS_DESIGN'}},fixture(),adapter())).toThrow();
    expect(() => validateBriefInput({...requests()[1],configuration: r.configuration})).toThrow(/Nonnumeric/);
  });
  it('rejects invalid IDs, unknown version, duplicates and orphan references', () => {
    expect(() => validateBriefInput({...requests()[0],id: '../escape'})).toThrow(/ID/);
    expect(() => validateBundle({...fixture(),schemaVersion: 1})).toThrow(/schema/);
    const b = fixture(); b.recipes.push(b.recipes[0]); expect(() => validateBundle(b)).toThrow(/Duplicate/);
    const c = fixture(); c.proofs[0].sourceRefId = 'missing'; expect(() => validateBundle(c)).toThrow(/Orphan/);
  });
  it('rejects cross-brand kit, request and adapter mixing', () => {
    const b = fixture(); b.proofs[0].brandKey = 'other-brand'; expect(() => validateBundle(b)).toThrow(/Cross-brand/);
    expect(() => compileBrief({...requests()[0],brandKey: 'other-brand'},fixture(),adapter())).toThrow(/Cross-brand/);
    expect(() => compileBrief(requests()[0],fixture(),{...adapter(),brandKey: 'other-brand'})).toThrow(/Cross-brand/);
  });
  it('blocks uncleared or mismatched proof and propagates fixture scope from any input', () => {
    const b = fixture(); b.proofs[0].rightsStatus = 'pending'; expect(() => compileBrief(requests()[0],b,adapter())).toThrow(/rights/);
    const c = fixture(); c.proofs[0].proofKind = 'actual_work'; expect(() => compileBrief(requests()[0],c,adapter())).toThrow(/rights/);
    const d = fixture(); d.kit.usageScope = 'review_candidate'; d.proofs[0].usageScope = 'review_candidate';
    expect(compileBrief(requests()[0],d,adapter()).usageScope).toBe('fixture_only');
  });
  it.each(['Custom stickers $25','Any size available','Design included','twenty dollars'])('blocks unbound claim %s', claim => {
    const b = fixture(); b.recipes[1].requiredVisibleText.push(claim);
    expect(() => compileBrief(requests()[1],b,adapter())).toThrow(/commercial claim/);
  });
  it('canonical digests ignore object key order and reject undefined', () => {
    expect(digest({b:2,a:1})).toBe(digest({a:1,b:2}));
    expect(() => digest({a:undefined})).toThrow();
  });
  it('does not allow nonnumeric price leakage through voice or layout instructions', () => {
    const b = fixture(); b.kit.voice.push('Only $25 for stickers');
    expect(() => compileBrief(requests()[1],b,adapter())).toThrow(/Unbound numeric/);
    const c = fixture(); c.recipes[1].visualLane.instructions += ' Add a $25 price bubble.';
    expect(() => compileBrief(requests()[1],c,adapter())).toThrow(/Unbound numeric/);
  });
  it.each(['voice','proof','lane','panel'])('blocks blanket commercial claims in positive %s instructions', field => {
    const b = fixture();
    if (field === 'voice') b.kit.voice.push('Design is free.');
    if (field === 'proof') b.proofs[1].disclosure = 'Illustrative guide. Design included for any size.';
    if (field === 'lane') b.recipes[1].visualLane.instructions += ' Promise unlimited sizes.';
    if (field === 'panel') b.recipes[1].contactPanel.instructions += ' Show free design included.';
    expect(() => compileBrief(requests()[1],b,adapter())).toThrow(/blanket commercial/);
  });
  it('cannot be imported as an existing monthly publishing plan', () => {
    const brief = compileBrief(requests()[0],fixture(),adapter());
    expect(() => parseMonthPlan(brief)).toThrow();
    expect(() => parseMonthPlan({schemaVersion: 2,kind: 'creative_os_bundle',briefs: [brief]})).toThrow();
    expect(brief).not.toHaveProperty('scheduleTime');
    expect(brief).not.toHaveProperty('destinations');
  });
});
