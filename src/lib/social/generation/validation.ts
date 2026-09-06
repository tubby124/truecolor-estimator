import { SAFE_RUSH_ENQUIRY } from './business-profile';
import { createHash } from 'node:crypto';
import type { ProductFacts } from '@/lib/pricing/product-facts';
import { GENERATION_CHANNELS, type GenerationInput, type GenerationChannel, type GenerationObservation } from '../generation-contract';
import { PROMPT_VERSION, PROFILE_VERSION, MODEL } from './prompt';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function parseGenerationInput(value: unknown): { input: GenerationInput; legacy: boolean } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a caption request object.');
  const v = value as Record<string, unknown>;
  const legacy = v.requestId === undefined;
  if (!legacy && (typeof v.requestId !== 'string' || !uuid.test(v.requestId))) throw new Error('requestId must be a UUID.');
  const channels = v.selectedChannels ?? (legacy ? ['instagram', 'facebook'] : null);
  if (!Array.isArray(channels) || !channels.length || channels.length > 3 || channels.some(c => !GENERATION_CHANNELS.includes(c)) || new Set(channels).size !== channels.length) throw new Error('Select Instagram, Facebook and/or GBP. X generation is retired.');
  const input: GenerationInput = { requestId: legacy ? '' : v.requestId as string, selectedChannels: [...channels].sort() };
  for (const [key, max] of Object.entries({ caption_raw: 2000, topic: 300, campaign_slug: 100, angle: 300, productSlug: 100, resumeJobId: 36 })) {
    const text = v[key];
    if (text !== undefined && (typeof text !== 'string' || text.length > max)) throw new Error(`Invalid ${key}.`);
    if (typeof text === 'string' && text.trim()) Object.assign(input, { [key]: text.trim() });
  }
  if (input.resumeJobId && !uuid.test(input.resumeJobId)) throw new Error('resumeJobId must be a UUID.');
  if (v.includePrice !== undefined && typeof v.includePrice !== 'boolean') throw new Error('includePrice must be boolean.');
  input.includePrice = v.includePrice === true;
  if (input.includePrice && !input.productSlug) throw new Error('Select a catalogue product before including a price.');
  if (v.configuration !== undefined) {
    if (!input.productSlug || !v.configuration || typeof v.configuration !== 'object' || Array.isArray(v.configuration)) throw new Error('A catalogue configuration requires a product.');
    input.configuration = v.configuration as GenerationInput['configuration'];
  }
  if (v.image_base64 !== undefined) {
    if (typeof v.image_base64 !== 'string' || v.image_base64.length > 2_800_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(v.image_base64)) throw new Error('Use a compressed image under 2 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(v.image_type as string)) throw new Error('Use JPEG, PNG or WebP.');
    input.image_base64 = v.image_base64; input.image_type = v.image_type as string;
  }
  if (!input.caption_raw && !input.topic && !input.image_base64 && !input.productSlug) throw new Error('Provide a caption, photo, topic or catalogue product.');
  return { input, legacy };
}
export function generationKeys(businessId: string, input: GenerationInput, facts: ProductFacts | null) {
  const mediaHash = input.image_base64 ? hash(Buffer.from(input.image_base64, 'base64')) : null;
  const { requestId: _id, resumeJobId: _resume, image_base64: _image, ...semantic } = input;
  void _id; void _resume; void _image;
  const inputHash = hash(stableJson({ ...semantic, includePrice: input.includePrice === true, selectedChannels: [...input.selectedChannels].sort(), mediaHash }));
  return { mediaHash, inputHash, cacheKey: hash(stableJson({ businessId, inputHash, facts: facts?.sourceFingerprint ?? 'no-price', profile: PROFILE_VERSION, prompt: PROMPT_VERSION, model: MODEL })) };
}
export const LIMITS: Record<GenerationChannel, number> = { instagram: 2200, facebook: 5000, gbp: 1500 };
export function priceDisclosure(facts: ProductFacts): string {
  return `${facts.productName}: CAD $${facts.rawSubtotal.toFixed(2)} for ${facts.configurationLabel}. ${facts.minimumDisclosure ? `${facts.minimumDisclosure} ` : ''}Standalone order CAD $${facts.standalonePreTaxOrderTotal.toFixed(2)} before tax. ${facts.productUrl}`;
}
/** Numeric/commercial claims are rendered by trusted code, never accepted from model prose. */
export function validateDraft(text: unknown, channel: GenerationChannel): string | null {
  if (typeof text !== 'string' || !text.trim() || text.length > LIMITS[channel]) return 'Missing caption or platform character limit exceeded.';
  if (/[$€£¥%]|\b(?:CAD|USD|dollars?|percent|bucks)\b|\d/i.test(text)) return 'Model supplied an unsupported numeric or price claim.';
  if (/\b(?:free|discount|sale|save|saving|cheapest|cheaper|beat|best|guarantee\w*|warrant\w*|lifetime|half.price|buy.{0,20}get|(?:one|two|three|four|five|six|seven|eight|nine|ten|twenty|hundred|thousand)[ -](?:day|hour|week|dollar)|(?:next|this)[ -](?:week|month)|delivery|shipping|rush|turnaround|same.day|next.day|today.only|limited.time|last.chance|weatherproof|waterproof|UV|eco.solvent|13oz|durab\w*|premium|quality|professional|affordable|client|customer|completed|installed|delivered|we (?:made|printed|built)|for (?:our|a local)|staples|fedex|ups store)\b/i.test(text.replaceAll(SAFE_RUSH_ENQUIRY, ''))) return 'Model supplied a claim requiring manual review.';
  if (channel === 'gbp' && /#\w/.test(text)) return 'GBP copy must not include hashtags.';
  return null;
}
export function validateOutput(content: string, channels: GenerationChannel[], facts: ProductFacts | null, includePrice: boolean) {
  const drafts: Partial<Record<GenerationChannel, string>> = {}; const errors: string[] = [];
  let value: Record<string, unknown>;
  try { value = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()); }
  catch { return { drafts, errors: ['Provider returned invalid JSON. Edit the draft manually.'], observation: undefined }; }
  if (!value || typeof value !== 'object') return { drafts, errors: ['Provider returned an invalid object.'], observation: undefined };
  const raw = value.drafts as Record<string, unknown> | undefined;
  let observation: GenerationObservation | undefined;
  const o = value.observation as Partial<GenerationObservation> | undefined;
  if (o && typeof o.description === 'string' && o.description.length <= 400 && typeof o.alt_text === 'string' && o.alt_text.length <= 125 && typeof o.readable === 'boolean') observation = o as GenerationObservation;
  if (observation?.readable === false) return { drafts, errors: ['Image details were unreadable. Review the photo manually.'], observation };
  for (const channel of channels) {
    const error = validateDraft(raw?.[channel], channel);
    if (error) { errors.push(`${channel}: ${error}`); continue; }
    const text = `${(raw![channel] as string).trim()}${includePrice && facts ? `\n\n${priceDisclosure(facts)}` : ''}`;
    if (text.length > LIMITS[channel]) errors.push(`${channel}: Price disclosure exceeds platform limit.`); else drafts[channel] = text;
  }
  return { drafts, errors, observation };
}

/** Final edited caption gate: a current fingerprint alone cannot authorize arbitrary prose/prices. */
export function validateBoundCaption(caption: string, channel: GenerationChannel, facts: ProductFacts | null): string | null {
  if (caption.length > LIMITS[channel]) return 'Caption exceeds platform character limit.';
  const disclosure = facts ? priceDisclosure(facts) : '';
  const prose = disclosure && caption.includes(disclosure) ? caption.replace(disclosure, '').trim() : caption.trim();
  // Price-bearing copy must retain the complete, exact configured-price/minimum block.
  if (/[$€£¥]|\b(?:CAD|USD|dollars?|bucks)\b/i.test(prose)) return 'Price text must match the complete current catalogue disclosure. Regenerate or remove the price.';
  return validateDraft(prose, channel);
}
