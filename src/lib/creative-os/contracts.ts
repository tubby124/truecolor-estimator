/** Phase-one subset: draft text briefs only. No calendar, learning, media or runtime contract. */
import { createHash } from 'node:crypto';

export type UsageScope = 'fixture_only' | 'review_candidate';
export type OfferMode = 'exact_configuration' | 'configurator' | 'design_help' | 'education';
export type ProofKind = 'illustration' | 'diagram' | 'actual_work' | 'interface_capture';
export interface SourceRef { id: string; kind: 'repository' | 'owner_decision' | 'private_receipt' | 'public_page'; observedAt: string; revisionOrDigest: string; evidenceScope: string; limitation: string }
export interface BrandKit {
  id: string; brandKey: string; revision: number; usageScope: UsageScope; sourceRefs: SourceRef[];
  identity: { name: string; website: string; address?: string; phone?: string };
  voice: string[]; visualConstraints: string[];
  logoPolicy: { requirement: 'optional' | 'required' | 'omitted'; illustrativeOverlay: 'allowed' | 'forbidden'; instructions: string };
  actionPolicy: { requiredIdentityFields: ('name' | 'website' | 'address' | 'phone')[]; instructions: string };
}
export interface Recipe {
  id: string; brandKey: string; revision: number;
  purpose: 'offer' | 'education' | 'design_help' | 'proof' | 'ordering';
  productSlug: string; offerMode: OfferMode; purchaseQuestion: string; headlineDirection: string;
  requiredVisibleText: string[]; claimIds: string[];
  visualLane: { id: string; instructions: string }; contactPanel: { id: string; instructions: string };
  proofKinds: ProofKind[]; diversityTags: string[]; avoid: string[];
}
export interface ProofRef {
  id: string; brandKey: string; revision: number; usageScope: UsageScope; proofKind: ProofKind;
  rightsStatus: 'cleared' | 'pending' | 'withdrawn'; allowedUse: 'creative_brief';
  assetId: string; sha256: string; disclosure: string; sourceRefId: string; sourceRefs: SourceRef[];
}
export interface Bundle { schemaVersion: 2; kind: 'creative_os_bundle'; kit: BrandKit; recipes: Recipe[]; proofs: ProofRef[] }
export type JsonValue = null | boolean | string | number | JsonValue[] | { [key: string]: JsonValue };
/** Domain fields are validated by the injected adapter, never by the shared core. */
export type Configuration = { [key: string]: JsonValue };
export interface ClaimRef { id: string; productSlug: string; text: string; sourceRefIds: string[] }
export interface BriefInput {
  schemaVersion: 2; kind: 'creative_brief_request'; id: string; brandKey: string; recipeId: string;
  proofId: string; productSlug: string; mode: OfferMode; configuration: Configuration | null;
  expectedFingerprint: string | null; expectedSourceRevision: string | null; expectedSourceDigest: string | null;
}
export class ContractError extends Error { constructor(message: string) { super(message); this.name = 'ContractError'; } }
export function digest(value: unknown): string {
  function canonical(v: unknown): string {
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' && Number.isFinite(v)) return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
    if (v && typeof v === 'object') return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}`;
    throw new ContractError('Canonical JSON requires finite numbers and no undefined values.');
  }
  return createHash('sha256').update(canonical(value)).digest('hex');
}
function object(v: unknown, keys: string[], at: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ContractError(`${at}: expected object`);
  const r = v as Record<string, unknown>;
  if (Object.keys(r).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(r, k))) throw new ContractError(`${at}: missing or unknown field`);
  return r;
}
function str(v: unknown, at: string, max = 4000): asserts v is string { if (typeof v !== 'string' || !v.trim() || v.length > max) throw new ContractError(`${at}: expected bounded nonempty text`); }
function id(v: unknown, at: string) { str(v, at, 96); if (!/^[a-z0-9][a-z0-9._-]*$/.test(v)) throw new ContractError(`${at}: invalid ID`); }
function choice(v: unknown, choices: string[], at: string) { if (!choices.includes(v as string)) throw new ContractError(`${at}: unsupported value`); }
function list(v: unknown, at: string, check: (x: unknown, at: string) => void, min = 1) {
  if (!Array.isArray(v) || v.length < min || v.length > 100) throw new ContractError(`${at}: invalid list`);
  v.forEach((x, i) => check(x, `${at}[${i}]`));
}
function envelope(r: Record<string, unknown>, at: string) { id(r.id, at); id(r.brandKey, at); if (!Number.isSafeInteger(r.revision) || (r.revision as number) < 1) throw new ContractError(`${at}: invalid revision`); }
const scopes = ['fixture_only', 'review_candidate'];
const modes = ['exact_configuration', 'configurator', 'design_help', 'education'];
const kinds = ['illustration', 'diagram', 'actual_work', 'interface_capture'];
export function validateSourceRefs(input: unknown): asserts input is SourceRef[] {
  list(input, 'sourceRefs', (v, at) => { const s = object(v, ['id','kind','observedAt','revisionOrDigest','evidenceScope','limitation'], at); id(s.id, at); choice(s.kind,['repository','owner_decision','private_receipt','public_page'],at); Object.values(s).forEach(x => str(x, at)); if (!/^\d{4}-\d\d-\d\dT.*Z$/.test(s.observedAt as string) || !Number.isFinite(Date.parse(s.observedAt as string))) throw new ContractError('Invalid source instant'); });
  if (new Set((input as SourceRef[]).map(s => s.id)).size !== (input as SourceRef[]).length) throw new ContractError('Duplicate source ID');
}
export function validateClaims(input: unknown, productSlug: string, sources: SourceRef[]): asserts input is ClaimRef[] {
  list(input,'claims',(v,at) => {
    const c = object(v,['id','productSlug','text','sourceRefIds'],at); id(c.id,at); id(c.productSlug,at); str(c.text,at);
    if (c.productSlug !== productSlug) throw new ContractError('Cross-product claim');
    list(c.sourceRefIds,at,(v,p) => { id(v,p); if (!sources.some(s => s.id === v)) throw new ContractError('Orphan claim source reference'); });
  });
  if (new Set((input as ClaimRef[]).map(c => c.id)).size !== (input as ClaimRef[]).length) throw new ContractError('Duplicate claim ID');
}
export function validateBundle(input: unknown): Bundle {
  if (JSON.stringify(input)?.length > 1024 * 1024) throw new ContractError('Bundle exceeds one MiB');
  const b = object(input, ['schemaVersion','kind','kit','recipes','proofs'], 'bundle');
  if (b.schemaVersion !== 2 || b.kind !== 'creative_os_bundle') throw new ContractError('Unsupported bundle schema/kind');
  const k = object(b.kit, ['id','brandKey','revision','usageScope','sourceRefs','identity','voice','visualConstraints','actionPolicy','logoPolicy'], 'kit');
  envelope(k, 'kit'); choice(k.usageScope, scopes, 'kit.scope');
  const logo = object(k.logoPolicy,['requirement','illustrativeOverlay','instructions'],'logoPolicy'); choice(logo.requirement,['optional','required','omitted'],'logo requirement'); choice(logo.illustrativeOverlay,['allowed','forbidden'],'logo overlay'); str(logo.instructions,'logo instructions');
  const rawIdentity = k.identity as Record<string,unknown>;
  const identity = object(k.identity, ['name','website',...['address','phone'].filter(f => rawIdentity && Object.hasOwn(rawIdentity,f))], 'identity'); Object.values(identity).forEach(v => str(v, 'identity'));
  const action = object(k.actionPolicy,['requiredIdentityFields','instructions'],'actionPolicy'); str(action.instructions,'action instructions'); list(action.requiredIdentityFields,'action fields',(v,at) => { choice(v,['name','website','address','phone'],at); if (!Object.hasOwn(identity,v as string)) throw new ContractError('Required action identity field missing'); },0);
  const url = new URL(identity.website as string); if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new ContractError('Identity website must be a public HTTPS URL');
  list(k.voice, 'voice', str);
  validateSourceRefs(k.sourceRefs); list(k.visualConstraints,'visualConstraints',str,0);
  list(b.recipes,'recipes',(v,at) => { const r = object(v,['id','brandKey','revision','purpose','productSlug','offerMode','purchaseQuestion','headlineDirection','requiredVisibleText','claimIds','visualLane','contactPanel','proofKinds','diversityTags','avoid'],at); envelope(r,at); id(r.productSlug,at); choice(r.purpose,['offer','education','design_help','proof','ordering'],at); choice(r.offerMode,modes,at); str(r.purchaseQuestion,at); str(r.headlineDirection,at,200); list(r.requiredVisibleText,at,str,0); list(r.claimIds,at,id,0); for (const f of ['visualLane','contactPanel']) { const layout = object(r[f],['id','instructions'],at); id(layout.id,at); str(layout.instructions,at); } list(r.proofKinds,at,(x,p) => choice(x,kinds,p)); list(r.diversityTags,at,id); list(r.avoid,at,str,0); });
  list(b.proofs,'proofs',(v,at) => { const r = object(v,['id','brandKey','revision','usageScope','proofKind','rightsStatus','allowedUse','assetId','sha256','disclosure','sourceRefId','sourceRefs'],at); envelope(r,at); choice(r.usageScope,scopes,at); choice(r.proofKind,kinds,at); choice(r.rightsStatus,['cleared','pending','withdrawn'],at); choice(r.allowedUse,['creative_brief'],at); id(r.assetId,at); id(r.sourceRefId,at); validateSourceRefs(r.sourceRefs); str(r.sha256,at); if (!/^[a-f0-9]{64}$/.test(r.sha256 as string)) throw new ContractError('Invalid proof digest'); str(r.disclosure,at); });
  const bundle = JSON.parse(JSON.stringify(input)) as Bundle;
  for (const records of [bundle.recipes,bundle.proofs,bundle.kit.sourceRefs]) if (new Set(records.map(r => r.id)).size !== records.length) throw new ContractError('Duplicate ID');
  for (const r of [...bundle.recipes,...bundle.proofs]) if (r.brandKey !== bundle.kit.brandKey) throw new ContractError('Cross-brand record');
  for (const p of bundle.proofs) if (!p.sourceRefs.some(s => s.id === p.sourceRefId)) throw new ContractError('Orphan proof source reference');
  return bundle;
}
export function validateBriefInput(input: unknown): BriefInput {
  const r = object(input,['schemaVersion','kind','id','brandKey','recipeId','proofId','productSlug','mode','configuration','expectedFingerprint','expectedSourceRevision','expectedSourceDigest'],'request');
  if (r.schemaVersion !== 2 || r.kind !== 'creative_brief_request') throw new ContractError('Unsupported request schema/kind');
  ['id','brandKey','recipeId','proofId','productSlug'].forEach(k => id(r[k],k)); choice(r.mode,modes,'mode');
  if (r.expectedFingerprint !== null && (typeof r.expectedFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(r.expectedFingerprint))) throw new ContractError('Invalid expected fingerprint');
  if (r.expectedSourceDigest !== null && (typeof r.expectedSourceDigest !== 'string' || !/^[a-f0-9]{64}$/.test(r.expectedSourceDigest))) throw new ContractError('Invalid expected source digest');
  if (r.expectedSourceRevision !== null) str(r.expectedSourceRevision,'sourceRevision',160);
  if (r.mode === 'exact_configuration') {
    if (!r.configuration || typeof r.configuration !== 'object' || Array.isArray(r.configuration)) throw new ContractError('Expected domain configuration object');
    digest(r.configuration);
  } else if (r.configuration !== null || r.expectedFingerprint !== null || r.expectedSourceRevision !== null || r.expectedSourceDigest !== null) throw new ContractError('Nonnumeric requests cannot contain numeric offer bindings');
  return JSON.parse(JSON.stringify(input)) as BriefInput;
}
