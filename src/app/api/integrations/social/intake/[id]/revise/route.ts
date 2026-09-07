import { NextResponse } from 'next/server';
import { requireIntakeAccess } from '@/lib/social/intake/auth';
import { intakeFailure, intakeJson } from '@/lib/social/intake/http';
import { reviseIntake } from '@/lib/social/intake/service';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireIntakeAccess(req);
    return NextResponse.json(await reviseIntake(auth, (await params).id, await intakeJson(req)), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return intakeFailure(e); }
}
