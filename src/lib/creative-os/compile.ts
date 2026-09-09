import { ContractError, digest, validateBriefInput, validateBundle, type Bundle, type BriefInput, type Configuration, type OfferMode, type SourceRef } from './contracts';

export interface FactsResolution {
  brandKey: string; productSlug: string; mode: OfferMode; sourceRevision: string; sourceDigest: string;
  checkedAt: string; verificationScope: 'local_source_only'; runtimeFlags: Record<string, boolean>;
  sourceRefs: SourceRef[]; requiredVisibleText: string[]; cta: { url: string; instruction: string; preselectionVerified: false };
  quote: null | {
    currency: 'CAD'; amountMinor: number; rawSubtotalMinor: number; minimumAdjustmentMinor: number;
    minimumDisclosure: string | null; costMinor: null; margin: null; factFingerprint: string;
    configuration: Configuration; configurationLabel: string; sourceRuleIds: string[];
  };
}
export interface LocalFactsAdapter { brandKey: string; resolve(request: BriefInput): FactsResolution }
export interface CompiledBrief {
  schemaVersion: 1; kind: 'creative_brief'; id: string; brandKey: string; status: 'draft'; usageScope: 'fixture_only' | 'production_candidate';
  createdAt: string; kitRef: { id: string; revision: number; digest: string }; recipeRef: { id: string; revision: number; digest: string };
  proofRefs: { id: string; revision: number; digest: string; proofKind: string; disclosure: string; usageScope: string }[];
  headlineDirection: string; requiredVisibleText: string[]; captionGuidance: string; altTextGuidance: string;
  layoutInstructions: string[]; contactPanel: Bundle['kit']['identity']; forbiddenClaims: string[];
  diversitySignature: string[]; inputBundleDigest: string; requestDigest: string; facts: FactsResolution;
  verificationReport: { status: 'structurally_valid'; warnings: string[]; checks: string[] };
}

// The compiler inserts amounts from the adapter only. No recipe prose may smuggle
// in price, time, quantity or performance claims, including written-out numbers.
const numericClaim = /\d|[$€£%]|\b(?:cad|dollars?|percent|free|included|unlimited|any size|all sizes|same.day|one|two|three|four|five|six|seven|eight|nine|ten|twenty|hundred)\b/i;
function unpriced(text: string, field: string) { if (numericClaim.test(text)) throw new ContractError(`${field}: numeric or blanket commercial claim needs a separate verified adapter`); }

export function compileBrief(input: unknown, rawBundle: unknown, adapter: LocalFactsAdapter): CompiledBrief {
  const request = validateBriefInput(input);
  const bundle = validateBundle(rawBundle);
  if (request.brandKey !== bundle.kit.brandKey || adapter.brandKey !== request.brandKey) throw new ContractError('Cross-brand adapter/request');
  const recipe = bundle.recipes.find(r => r.id === request.recipeId);
  const proof = bundle.proofs.find(p => p.id === request.proofId);
  if (!recipe || !proof) throw new ContractError('Missing recipe or proof');
  if (recipe.productSlug !== request.productSlug || recipe.offerMode !== request.mode) throw new ContractError('Recipe offer binding mismatch');
  if (proof.rightsStatus !== 'cleared' || !recipe.proofKinds.includes(proof.proofKind)) throw new ContractError('Proof rights or kind do not cover this brief');
  if ((proof.proofKind === 'illustration' || proof.proofKind === 'diagram') && !/illustrat(?:ion|ive)|diagram|sample|example/i.test(proof.disclosure)) throw new ContractError('Illustration/diagram disclosure is required');
  [recipe.headlineDirection,...recipe.requiredVisibleText,recipe.purchaseQuestion].forEach(s => unpriced(s,'creative text'));
  const facts = adapter.resolve(request);
  if (facts.brandKey !== request.brandKey || facts.productSlug !== request.productSlug || facts.mode !== request.mode) throw new ContractError('Adapter returned mismatched facts');
  if (facts.verificationScope !== 'local_source_only' || !facts.sourceRevision || !/^[a-f0-9]{64}$/.test(facts.sourceDigest) || !facts.sourceRefs.length || !Number.isFinite(Date.parse(facts.checkedAt))) throw new ContractError('Missing local source provenance');
  if (request.expectedSourceRevision !== null && request.expectedSourceRevision !== facts.sourceRevision) throw new ContractError('Stale source revision; review and explicitly rebind the request');
  if (request.expectedSourceDigest !== null && request.expectedSourceDigest !== facts.sourceDigest) throw new ContractError('Stale local source digest; review and explicitly rebind the request');
  if (request.mode === 'exact_configuration') {
    if (!facts.quote || digest(facts.quote.configuration) !== digest(request.configuration)) throw new ContractError('Resolved configuration changed');
    if (request.expectedFingerprint !== null && request.expectedFingerprint !== facts.quote.factFingerprint) throw new ContractError('Stale fact fingerprint; review and explicitly rebind the request');
    if (!/^[a-f0-9]{64}$/.test(facts.quote.factFingerprint) || !Number.isSafeInteger(facts.quote.amountMinor) || facts.quote.amountMinor <= 0 || facts.quote.costMinor !== null || facts.quote.margin !== null) throw new ContractError('Invalid quote or unsupported cost claim');
  } else {
    if (facts.quote !== null) throw new ContractError('Nonnumeric offer leaked a quote');
    [...facts.requiredVisibleText,facts.cta.instruction].forEach(s => unpriced(s,'nonnumeric facts'));
  }
  const lane = bundle.kit.visualLanes.find(l => l.id === recipe.visualLaneId)!;
  const panel = bundle.kit.contactPanels.find(p => p.id === recipe.contactPanelId)!;
  // Ancillary instructions are not an alternate route for injecting offer copy.
  // Written editorial guidance such as "one purchase question" remains permitted.
  for (const text of [...bundle.kit.voice,lane.instructions,panel.instructions,proof.disclosure]) {
    if (/\d|[$€£%]|\b(?:dollars?|cad|percent|twenty|hundred|free|included|unlimited|any size|all sizes|same.day)\b/i.test(text)) throw new ContractError('Unbound numeric or blanket commercial claim in creative guidance');
  }
  const warnings = ['Draft instructions only; no image, visual-quality approval or publishing approval.', 'Facts were checked against local source only; production was not checked.', 'Brand kit and recipes remain proposed until their exact versions receive owner review.'];
  const usageScope = bundle.kit.usageScope === 'fixture_only' || bundle.proofs.some(p => p.usageScope === 'fixture_only') ? 'fixture_only' : 'production_candidate';
  if (usageScope === 'fixture_only') warnings.push('FIXTURE ONLY: synthetic proof cannot be used as real work or passed to production.');
  const visibleProofLabel = { illustration: 'Design example',diagram: 'Illustrative guide',interface_capture: 'Interface reference',actual_work: 'Actual work reference' }[proof.proofKind];
  return {
    schemaVersion: 1, kind: 'creative_brief', id: request.id, brandKey: request.brandKey, status: 'draft', usageScope,
    createdAt: facts.checkedAt,
    kitRef: { id: bundle.kit.id, revision: bundle.kit.revision, digest: digest(bundle.kit) },
    recipeRef: { id: recipe.id, revision: recipe.revision, digest: digest(recipe) },
    proofRefs: [{ id: proof.id, revision: proof.revision, digest: digest(proof), proofKind: proof.proofKind, disclosure: proof.disclosure, usageScope: proof.usageScope }],
    headlineDirection: recipe.headlineDirection,
    requiredVisibleText: [...new Set([...recipe.requiredVisibleText,...facts.requiredVisibleText,visibleProofLabel,facts.cta.instruction])],
    captionGuidance: `Answer this purchase question: ${recipe.purchaseQuestion} Use only the bound visible facts. ${bundle.kit.voice.join(' ')}`,
    altTextGuidance: `Describe only the eventual visible composition; identify its ${proof.proofKind} nature. Do not invent a completed job, customer, outcome or unseen detail.`,
    layoutInstructions: [lane.instructions,panel.instructions,'Keep product naming, any offer qualifiers and action readable on the artwork itself.','Logo optional; no logo overlay on illustrative heroes. Do not redraw marks or cover product artwork.'],
    contactPanel: bundle.kit.identity,
    forbiddenClaims: [...recipe.avoid,'No blanket product price, included design, arbitrary sizes, invented discount, urgency or results.','No production verification claim, publishing approval or claim that fixture proof is real work.'],
    diversitySignature: [recipe.productSlug,recipe.purpose,recipe.visualLaneId,recipe.contactPanelId,...recipe.diversityTags],
    inputBundleDigest: digest(bundle), requestDigest: digest(request), facts,
    verificationReport: { status: 'structurally_valid', warnings, checks: ['Strict schema and references','Brand and recipe binding','Proof scope and declared rights','Fresh local fact resolution','Complete configuration and requested stale-source checks','Required visible semantics supplied by adapter'] },
  };
}
