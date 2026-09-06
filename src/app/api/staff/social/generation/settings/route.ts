import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireSocialBusiness, socialBusinessScopingEnabled } from '@/lib/social/business';
import { MODEL } from '@/lib/social/generation/prompt';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  const base = { providerReady: !!process.env.OPENROUTER_API_KEY, model: MODEL, configured: socialBusinessScopingEnabled() };
  if (!base.configured) return NextResponse.json({ ...base, legacyAvailable: true, message: 'Durable generation awaits the approved migration. Existing on-demand caption generation is available.' });
  try {
    const db = createServiceClient();
    const [settings, usage] = await Promise.all([
      db.from('social_generation_settings').select('*').eq('business_id', auth.businessId).maybeSingle(),
      db.from('social_generation_daily_usage').select('*').eq('business_id', auth.businessId).eq('usage_day', new Date().toISOString().slice(0, 10)).maybeSingle(),
    ]);
    if (settings.error || usage.error) throw new Error('Migration unavailable');
    return NextResponse.json({ ...base, dailyCallLimit: settings.data?.daily_call_limit ?? 0, dailyUsdLimit: settings.data?.daily_usd_limit ?? null, maxCostPerCallUsd: settings.data?.max_cost_per_call_usd ?? null, usedCalls: usage.data?.used_calls ?? 0, reservedCalls: usage.data?.reserved_calls ?? 0, usedUsd: usage.data?.used_usd ?? 0, reservedUsd: usage.data?.reserved_usd ?? 0 });
  } catch { return NextResponse.json({ error: 'Generation settings require the approved migration.' }, { status: 503 }); }
}
export async function PATCH(req: Request) {
  const auth = await requireSocialBusiness(req);
  if (auth instanceof NextResponse) return auth;
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: 'Apply the approved migration before configuring durable generation.' }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid settings.' }, { status: 400 }); }
  const money = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1000);
  if (!body || !Number.isSafeInteger(body.dailyCallLimit) || body.dailyCallLimit < 0 || body.dailyCallLimit > 1000 || !money(body.dailyUsdLimit) || !money(body.maxCostPerCallUsd) || (body.dailyUsdLimit !== null && body.maxCostPerCallUsd === null)) return NextResponse.json({ error: 'Set 0–1000 calls/day. An optional USD ceiling requires a positive per-call reservation.' }, { status: 400 });
  try {
    const { error } = await createServiceClient().from('social_generation_settings').upsert({ business_id: auth.businessId, daily_call_limit: body.dailyCallLimit, daily_usd_limit: body.dailyUsdLimit, max_cost_per_call_usd: body.maxCostPerCallUsd, updated_at: new Date().toISOString() }, { onConflict: 'business_id' });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: 'Generation settings could not be saved.' }, { status: 503 }); }
}
