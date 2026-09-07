import { NextResponse } from 'next/server';
import { requireIntakeAccess, IntakeError } from '@/lib/social/intake/auth';
import { boundedBody, intakeFailure } from '@/lib/social/intake/http';
import { reviseIntakeImage } from '@/lib/social/intake/service';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireIntakeAccess(req);
    const bytes = await boundedBody(req, 12 * 1024 * 1024 + 50_000);
    let form: FormData;
    try { form = await new Request('http://intake.invalid', { method: 'POST', headers: { 'content-type': req.headers.get('content-type') ?? '' }, body: bytes }).formData(); }
    catch { throw new IntakeError(400, 'Provide a multipart image revision.'); }
    const image = form.get('image');
    if (!image || typeof image === 'string') throw new IntakeError(400, 'Provide an image.');
    return NextResponse.json(await reviseIntakeImage(auth, (await params).id, { fingerprint: String(form.get('fingerprint') ?? ''), mediaTreatment: String(form.get('mediaTreatment') ?? ''), bytes: Buffer.from(await image.arrayBuffer()), contentType: image.type }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return intakeFailure(e); }
}
