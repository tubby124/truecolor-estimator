import type { ProductFacts } from '@/lib/pricing/product-facts';

export type MetaChannel = 'facebook' | 'instagram';
export interface MonthPlanCreative {
  id: string; title: string; scheduleTime: string; channels: MetaChannel[];
  captionFacebook: string; captionInstagram: string; imageFilename: string; imageSha256: string;
  product?: { slug: string; configuration: ProductFacts['configuration']; fingerprint: string };
}
export interface MonthPlan { schemaVersion: 1; kind: 'truecolor-month-plan'; title: string; creatives: MonthPlanCreative[] }
export interface PreparedMonthCreative {
  id: string; requestId: string; imageUrl: string; captions: Record<MetaChannel | 'gbp', string>;
  time: string; channels: MetaChannel[]; productSlug: string;
  factFingerprint?: string; configuration?: ProductFacts['configuration'];
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const sha256 = /^[a-f0-9]{64}$/i;
const categories = ['SIGN', 'BANNER', 'RIGID', 'DISPLAY', 'STICKER', 'DECAL', 'VINYL_LETTERING', 'FOAMBOARD', 'PHOTO_POSTER', 'MAGNET', 'POSTCARD', 'BUSINESS_CARD', 'FLYER', 'BROCHURE', 'DESIGN', 'INSTALLATION', 'SERVICE', 'BOOKLET'];
const addons = ['GROMMETS', 'H_STAKE', 'RUSH', 'DESIGN_MINOR', 'DESIGN_FULL', 'DESIGN_LOGO', 'INSTALLATION'];
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function bounded(value: unknown, max: number): value is string { return typeof value === 'string' && !!value.trim() && value.length <= max; }
function fail(message: string): never { throw new Error(message); }

/** Validate source timestamps before Date can normalize an impossible calendar day. */
export function planReginaTime(value: unknown): string {
  if (typeof value !== 'string') fail('Each date needs an ISO timestamp with a timezone.');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::00(?:\.000)?)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) fail('Use an ISO date with timezone and whole-minute precision.');
  const day = new Date(`${match[1]}T00:00:00Z`);
  const date = new Date(value);
  const offsetHour = Number(match[6] ?? 0), offsetMinute = Number(match[7] ?? 0);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== match[1] || Number(match[2]) > 23 || Number(match[3]) > 59 || offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0) || !Number.isFinite(date.getTime())) fail('Choose a real calendar date and valid timezone offset.');
  // Regina has a fixed UTC-06 offset; never use the browser's local timezone.
  return new Date(date.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function configuration(value: unknown): ProductFacts['configuration'] {
  if (!record(value)) fail('Product configuration must be a complete source snapshot.');
  const allowed = ['category', 'material_code', 'width_in', 'height_in', 'sides', 'qty', 'shape', 'addons', 'design_status', 'is_rush'];
  if (Object.keys(value).some(key => !allowed.includes(key)) || !categories.includes(value.category as string) || !bounded(value.material_code, 128) || ![value.width_in, value.height_in].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0) || ![1, 2].includes(value.sides as number) || !Number.isSafeInteger(value.qty) || Number(value.qty) < 1 || value.design_status !== 'PRINT_READY' || value.is_rush !== false || !Array.isArray(value.addons) || new Set(value.addons).size !== value.addons.length || value.addons.some(v => typeof v !== 'string' || !addons.includes(v)) || (value.shape !== undefined && (value.category !== 'STICKER' || !['square', 'circle', 'die_cut'].includes(value.shape as string)))) fail('Invalid product source configuration. Use current catalogue facts, without price overrides.');
  return { ...value, addons: [...value.addons] } as ProductFacts['configuration'];
}

/** Private local package only. Parsing never contacts a server or resolves prices. */
export function parseMonthPlan(input: unknown): MonthPlan {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  if (!record(value) || value.schemaVersion !== 1 || value.kind !== 'truecolor-month-plan' || !bounded(value.title, 160) || !Array.isArray(value.creatives) || value.creatives.length < 1 || value.creatives.length > 31) fail('Choose a version 1 True Color month plan with a title and 1–31 creatives.');
  const ids = new Set<string>(), hashes = new Set<string>(), filenames = new Set<string>();
  const creatives = value.creatives.map((item, index): MonthPlanCreative => {
    const label = `Creative ${index + 1}`;
    if (!record(item) || typeof item.id !== 'string' || !uuid.test(item.id) || ids.has(item.id.toLowerCase()) || !bounded(item.title, 160)) fail(`${label}: add a title and unique stable UUID.`);
    ids.add(item.id.toLowerCase());
    planReginaTime(item.scheduleTime);
    if (typeof item.captionFacebook !== 'string' || typeof item.captionInstagram !== 'string' || item.captionFacebook.length > 2200 || item.captionInstagram.length > 2200) fail(`${label}: Meta captions must be text, up to 2,200 characters each.`);
    const channels = item.channels ?? (['facebook', 'instagram'] as const).filter(channel => (channel === 'facebook' ? item.captionFacebook : item.captionInstagram) !== '');
    if (!Array.isArray(channels) || !channels.length || new Set(channels).size !== channels.length || channels.some(c => !['facebook', 'instagram'].includes(c) || !String(c === 'facebook' ? item.captionFacebook : item.captionInstagram).trim())) fail(`${label}: select Facebook and/or Instagram with a nonempty caption for each.`);
    if (!bounded(item.imageFilename, 255) || item.imageFilename !== item.imageFilename.trim() || /[/\\\x00-\x1f]/.test(item.imageFilename) || !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(item.imageFilename) || filenames.has(item.imageFilename) || typeof item.imageSha256 !== 'string' || !sha256.test(item.imageSha256) || hashes.has(item.imageSha256.toLowerCase())) fail(`${label}: choose a unique image basename and unique SHA-256 hash; paths and duplicate images are not allowed.`);
    filenames.add(item.imageFilename); hashes.add(item.imageSha256.toLowerCase());
    let product: MonthPlanCreative['product'];
    if (item.product !== undefined) {
      if (!record(item.product) || !bounded(item.product.slug, 128) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.product.slug) || typeof item.product.fingerprint !== 'string' || !sha256.test(item.product.fingerprint) || Object.keys(item.product).some(key => !['slug', 'configuration', 'fingerprint'].includes(key))) fail(`${label}: product facts need a slug, configuration and source SHA-256 fingerprint.`);
      product = { slug: item.product.slug, configuration: configuration(item.product.configuration), fingerprint: item.product.fingerprint.toLowerCase() };
    }
    return { id: item.id.toLowerCase(), title: item.title, scheduleTime: new Date(item.scheduleTime as string).toISOString(), channels: channels as MetaChannel[], captionFacebook: item.captionFacebook, captionInstagram: item.captionInstagram, imageFilename: item.imageFilename, imageSha256: item.imageSha256.toLowerCase(), ...(product ? { product } : {}) };
  });
  return { schemaVersion: 1, kind: 'truecolor-month-plan', title: value.title, creatives };
}

export function groupMonthPlan(plan: MonthPlan): Record<string, MonthPlanCreative[]> {
  const groups: Record<string, MonthPlanCreative[]> = {};
  for (const creative of plan.creatives) (groups[planReginaTime(creative.scheduleTime).slice(0, 7)] ??= []).push(creative);
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
}

/** Verify every required original before the caller starts any upload. Extra files are ignored. */
export async function verifyPlanFiles(creatives: MonthPlanCreative[], files: File[]): Promise<Map<string, File>> {
  const selected = new Map<string, File>();
  for (const creative of creatives) {
    const matches = files.filter(file => file.name === creative.imageFilename);
    if (matches.length !== 1) fail(`${creative.imageFilename}: choose exactly one matching image file.`);
    const file = matches[0];
    if (!file.type.startsWith('image/') || file.size < 1 || file.size > 30 * 1024 * 1024) fail(`${file.name}: choose a supported image no larger than 30 MB.`);
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== creative.imageSha256) fail(`${file.name}: image bytes do not match the reviewed package. Recheck the package before uploading.`);
    selected.set(creative.id, file);
  }
  return selected;
}

export function prepareMonthCreative(creative: MonthPlanCreative, imageUrl: string, requestId: string): PreparedMonthCreative {
  return { id: creative.id, requestId, imageUrl, captions: { facebook: creative.captionFacebook, instagram: creative.captionInstagram, gbp: '' }, time: planReginaTime(creative.scheduleTime), channels: [...creative.channels], productSlug: creative.product?.slug ?? '', ...(creative.product ? { configuration: creative.product.configuration, factFingerprint: creative.product.fingerprint } : {}) };
}
