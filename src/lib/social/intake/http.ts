import { NextResponse } from 'next/server';
import { IntakeError } from './auth';
export function intakeFailure(error: unknown) {
  return NextResponse.json(error instanceof IntakeError ? { error: error.message, ...error.details } : { error: 'Photo intake is temporarily unavailable. Resume the same request; do not submit a duplicate.' }, { status: error instanceof IntakeError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
export async function boundedBody(req: Request, limit: number) {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.length;
        if (length > limit) throw new IntakeError(413, 'Upload is too large.');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
  }
  return Buffer.concat(chunks);
}
export async function intakeJson(req: Request) {
  try { return JSON.parse((await boundedBody(req, 20_000)).toString('utf8')) as Record<string, unknown>; }
  catch (e) { if (e instanceof IntakeError) throw e; throw new IntakeError(400, 'Invalid request.'); }
}
