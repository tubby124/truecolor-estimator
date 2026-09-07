import { NextResponse } from 'next/server';
import { requireIntakeAccess } from '@/lib/social/intake/auth';
import { intakeFailure } from '@/lib/social/intake/http';
import { getIntake, getIntakeOriginal } from '@/lib/social/intake/service';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireIntakeAccess(req);
    const { id } = await params;
    const preview = await getIntake(auth, id);
    const source = new URL(req.url).searchParams.get('source') === '1' ? await getIntakeOriginal(auth, id) : {};
    return NextResponse.json({ ...preview, ...source }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return intakeFailure(e); }
}
