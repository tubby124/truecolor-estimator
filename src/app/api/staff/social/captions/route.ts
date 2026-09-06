import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireSocialBusiness, socialBusinessScopingEnabled, DEFAULT_SOCIAL_BUSINESS_ID } from '@/lib/social/business';
import { resolveProductFacts } from '@/lib/pricing/product-facts';
import { parseGenerationInput } from '@/lib/social/generation/validation';
import { generate, GenerationError } from '@/lib/social/generation/service';
import { generationStore } from '@/lib/social/generation/store';
import { callProvider } from '@/lib/social/generation/provider';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function POST(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.businessId !== DEFAULT_SOCIAL_BUSINESS_ID) return NextResponse.json({ error: 'Caption generation requires a configured business voice and catalogue. This business has not been onboarded.' }, { status: 503 });
  // Bound parsing before any provider/storage work, including chunked requests.
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = []; let bytes = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 3_000_000) { await reader.cancel(); return NextResponse.json({ error: 'Caption request is too large.' }, { status: 413 }); }
      chunks.push(value);
    }
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  let parsed;
  try { parsed = parseGenerationInput(JSON.parse(raw)); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid caption request.' }, { status: 400 }); }
  const { input, legacy } = parsed;
  const durable = socialBusinessScopingEnabled();
  if (!durable && !legacy) return NextResponse.json({ error: 'Resumable generation requires the approved social and generation migrations plus SOCIAL_BUSINESS_SCOPING_ENABLED. Existing manual captions remain editable.', code: 'generation_migration_required' }, { status: 503 });
  if (!durable && input.includePrice) return NextResponse.json({ error: 'Price-bearing copy requires the approved source-binding migration. Generate a price-free showcase or edit manually.' }, { status: 503 });
  if (legacy) input.requestId = randomUUID();
  let facts = null;
  try { if (input.productSlug) facts = resolveProductFacts({ productSlug: input.productSlug, configuration: input.configuration }); }
  catch { return NextResponse.json({ error: 'This product configuration could not be verified. Select a current catalogue configuration.' }, { status: 400 }); }
  try {
    const result = await generate(input, auth.businessId, facts, generationStore(), callProvider, durable);
    return NextResponse.json({ ...result, durability: durable ? 'durable' : 'legacy', compatibility: legacy ? 'X captions are no longer generated; select supported channels and persist requestId for resumability.' : undefined });
  } catch (e) { return NextResponse.json({ error: e instanceof GenerationError ? e.message : 'Caption generation is unavailable. No automatic retry was started.' }, { status: e instanceof GenerationError ? e.status : 503 }); }
}
export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: 'Durable generation migration is required.' }, { status: 503 });
  const id = new URL(req.url).searchParams.get('requestId');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Provide a requestId UUID.' }, { status: 400 });
  try {
    const job = await generationStore().job(auth.businessId, id);
    if (!job) return NextResponse.json({ error: 'Generation job not found.' }, { status: 404 });
    return NextResponse.json({ jobId: id, status: job.status, result: job.result });
  } catch { return NextResponse.json({ error: 'Generation job unavailable.' }, { status: 503 }); }
}
