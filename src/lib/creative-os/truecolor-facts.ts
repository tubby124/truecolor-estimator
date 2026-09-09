/** Read-only True Color adapter. The portable compiler never imports this module. */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { resolveProductFacts } from '../pricing/product-facts';
import { generationServiceFacts } from '../social/generation/business-profile';
import { PRODUCTS } from '../data/products-content';
import { ContractError, digest, type BriefInput, type Configuration, type SourceRef } from './contracts';
import type { FactsResolution, LocalFactsAdapter } from './compile';

export interface TrueColorAdapterOptions { sourceRevision: string; now: () => string }
// Runtime dependency closure, including adapter logic. Built-ins are provided by
// the local Node runtime; type-only imports have no executable effect. Revisit
// this manifest whenever these modules gain another runtime dependency.
const sourceFiles = ['src/lib/creative-os/truecolor-facts.ts','src/lib/creative-os/contracts.ts','src/lib/pricing/product-facts.ts','src/lib/engine/index.ts','src/lib/engine/sticker-v2-bridge.ts','src/lib/engine/design-fee.ts','src/lib/pricing/sticker-model-v2.ts','src/lib/pricing/order-min.ts','src/lib/data/loader.ts','src/lib/data/products-content.ts','src/lib/flags.ts','src/lib/commerce/policies.ts','src/lib/social/generation/business-profile.ts'];
function sourceDigest(): string {
  const tables = readdirSync(path.join(process.cwd(),'data/tables')).filter(f => f.endsWith('.csv')).sort().map(f => `data/tables/${f}`);
  return createHash('sha256').update([...sourceFiles,...tables].map(f => `${f}\n${readFileSync(path.join(process.cwd(),f),'utf8')}`).join('\n')).digest('hex');
}
// Existing pricing modules cache loaded data/model sources. Refuse mixed source
// snapshots in a long-lived caller; restart the offline process after editing them.
const processSourceDigest = sourceDigest();
function money(amount: number) { return Math.round(amount * 100); }
export function createTrueColorFactsAdapter(options: TrueColorAdapterOptions): LocalFactsAdapter {
  return { brandKey: 'true-color', resolve(request: BriefInput): FactsResolution {
    if (request.brandKey !== 'true-color' || request.productSlug !== 'stickers') throw new ContractError('True Color pilot supports stickers only');
    const checkedAt = options.now();
    const currentSourceDigest = sourceDigest();
    if (processSourceDigest !== currentSourceDigest) throw new ContractError('Local sources changed during this process; restart before compiling');
    const sourceRefs: SourceRef[] = [{ id: 'truecolor-local-facts',kind: 'repository', observedAt: checkedAt,revisionOrDigest: currentSourceDigest,evidenceScope: 'Current local source files and loaded catalogue, not production',limitation: 'Local process only; no remote runtime or provider verification.' }];
    const base = { brandKey: 'true-color',productSlug: 'stickers',mode: request.mode,sourceRevision: options.sourceRevision,sourceDigest: currentSourceDigest,checkedAt,verificationScope: 'local_source_only' as const,runtimeFlags: { NEXT_PUBLIC_USE_STICKER_PRICING_V2: process.env.NEXT_PUBLIC_USE_STICKER_PRICING_V2 === 'true' },sourceRefs };
    if (request.mode === 'exact_configuration') {
      if (!request.configuration) throw new ContractError('Exact configuration required');
      const facts = resolveProductFacts({ productSlug: 'stickers',configuration: request.configuration as Parameters<typeof resolveProductFacts>[0]['configuration'] });
      const configuration = facts.configuration as Configuration;
      if (digest(configuration) !== digest(request.configuration)) throw new ContractError('Resolver changed complete input configuration');
      // This first adapter intentionally supports the proven white-vinyl material
      // and printed-artwork basis; other sellable presets require an explicit extension.
      if (configuration.material_code !== 'PLACEHOLDER_STICKER_2X2' || configuration.addons.length || configuration.sides !== 1) throw new ContractError('Material/addon/side semantics not implemented in pilot adapter');
      const shape = ({ square: 'square',circle: 'round',die_cut: 'die-cut' } as Record<string,string>)[configuration.shape];
      if (!shape) throw new ContractError('Unknown sticker shape');
      return { ...base,
        requiredVisibleText: ['Custom stickers',`CAD $${facts.standalonePreTaxOrderTotal.toFixed(2)} before tax for this configured standalone order`,`${configuration.qty} ${shape} stickers · ${configuration.width_in} × ${configuration.height_in} inches · white vinyl · one side · print-ready artwork · no addons · no rush`,...(facts.minimumDisclosure ? [facts.minimumDisclosure] : [])],
        cta: { url: facts.productUrl,preselectionVerified: false,instruction: 'Select the shown size, shape, quantity and artwork options in the online configurator.' },
        quote: { currency: 'CAD',amountMinor: money(facts.standalonePreTaxOrderTotal),rawSubtotalMinor: money(facts.rawSubtotal),minimumAdjustmentMinor: money(facts.standalonePreTaxOrderTotal - facts.rawSubtotal),minimumDisclosure: facts.minimumDisclosure,costMinor: null,margin: null,factFingerprint: facts.sourceFingerprint,configuration,configurationLabel: facts.configurationLabel,sourceRuleIds: facts.sourceRuleIds },
      };
    }
    if (request.mode === 'configurator') {
      if (!PRODUCTS.stickers?.sizePresets.length || !generationServiceFacts().some(f => f.id === 'online-ordering')) throw new ContractError('Configurator capability source unavailable');
      return { ...base,quote: null,requiredVisibleText: ['Custom stickers','Choose your sticker shape and size','Price your selected options in the online configurator.','Ask us about requirements beyond the listed options.'],cta: { url: 'https://truecolorprinting.ca/products/stickers',preselectionVerified: false,instruction: 'Choose the listed shape, size, quantity and artwork options online.' } };
    }
    const service = generationServiceFacts().find(f => f.id === 'onsite-graphic-designer');
    if (!service?.statement) throw new ContractError('Design help capability source unavailable');
    return { ...base,quote: null,requiredVisibleText: ['Sticker design help',service.statement,'Tell us what you need help designing; confirm the scope with the shop.'],cta: { url: 'https://truecolorprinting.ca/',preselectionVerified: false,instruction: 'Call True Color to discuss your sticker artwork and design requirements.' } };
  } };
}
