import { describe, expect, it } from 'vitest';
import { boundedBody, intakeFailure, intakeJson } from '../http';
import { IntakeError } from '../auth';
describe('bounded intake requests', () => {
  it('rejects chunked bodies without trusting Content-Length', async () => {
    const req = new Request('https://example.invalid', { method: 'POST', body: '123456' });
    await expect(boundedBody(req, 5)).rejects.toMatchObject({ status: 413 });
  });
  it('rejects malformed JSON', async () => {
    await expect(intakeJson(new Request('https://example.invalid', { method: 'POST', body: '{' }))).rejects.toMatchObject({ status: 400 });
  });
  it('keeps provider errors and secrets out of responses', async () => {
    const result = intakeFailure(new Error('provider token=private-secret'));
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain('private-secret');
  });
  it('returns structured date alternatives for Telegram', async () => {
    const result = intakeFailure(new IntakeError(409, 'Occupied', { alternatives: ['2099-01-02T16:00:00.000Z'] }));
    expect(await result.json()).toEqual({ error: 'Occupied', alternatives: ['2099-01-02T16:00:00.000Z'] });
  });
});
