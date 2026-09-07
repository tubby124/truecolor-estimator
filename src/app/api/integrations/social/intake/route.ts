import { NextResponse } from 'next/server';
import { requireIntakeAccess, IntakeError } from '@/lib/social/intake/auth';
import { boundedBody, intakeFailure } from '@/lib/social/intake/http';
import { createIntake } from '@/lib/social/intake/service';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export async function POST(req: Request) {
  try {
    const auth = await requireIntakeAccess(req);
    const bytes = await boundedBody(req, 12 * 1024 * 1024 + 50_000);
    let form: FormData;
    try { form = await new Request('http://intake.invalid', { method: 'POST', headers: { 'content-type': req.headers.get('content-type') ?? '' }, body: bytes }).formData(); }
    catch { throw new IntakeError(400, 'Provide a multipart photo request.'); }
    const image = form.get('image');
    if (!image || typeof image === 'string') throw new IntakeError(400, 'Provide an image.');
    const result = await createIntake(auth, { requestId: String(form.get('requestId') ?? ''), context: String(form.get('context') ?? ''), scheduleTime: form.get('scheduleTime') ? String(form.get('scheduleTime')) : undefined, bytes: Buffer.from(await image.arrayBuffer()), contentType: image.type });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return intakeFailure(e); }
}
