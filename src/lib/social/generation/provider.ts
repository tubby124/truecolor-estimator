import type { GenerationUsage } from '../generation-contract';
import { MODEL } from './prompt';
export const emptyUsage = (): GenerationUsage => ({ calls: 0, promptTokens: 0, completionTokens: 0, costUsd: 0, provider: 'openrouter', model: MODEL, providerRequestIds: [] });
export class ProviderFailure extends Error {
  constructor(public kind: 'retryable' | 'held' | 'failed', public usage: GenerationUsage, message: string) { super(message); }
}
const numberOrNull = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
export async function callProvider(prompt: { system: string; context: string }, image: { base64: string; type: string } | null, fetcher: typeof fetch = fetch) {
  const usage = emptyUsage();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new ProviderFailure('failed', usage, 'Caption provider is not configured.');
  usage.calls = 1; usage.promptTokens = null; usage.completionTokens = null; usage.costUsd = null;
  let response: Response;
  try {
    response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(45_000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://truecolorprinting.ca', 'X-Title': 'True Color Social Studio' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1400, provider: { allow_fallbacks: false }, messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: image ? [{ type: 'text', text: prompt.context }, { type: 'image_url', image_url: { url: `data:${image.type};base64,${image.base64}` } }] : prompt.context },
      ] }),
    });
  } catch { throw new ProviderFailure('held', usage, 'Provider outcome is uncertain. Reconcile before explicitly retrying.'); }
  // Only an explicit rate-limit response is retried. Gateway failures may hide a billed completion.
  if (!response.ok) throw new ProviderFailure(response.status === 429 ? 'retryable' : response.status >= 500 || response.status === 408 ? 'held' : 'failed', usage, `Caption provider returned HTTP ${response.status}.`);
  let body;
  try { body = await response.json(); } catch { throw new ProviderFailure('held', usage, 'Provider response was interrupted. Reconcile before retrying.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ProviderFailure('held', usage, 'Provider returned an unrecognized response. Reconcile before retrying.');
  const u = body.usage;
  usage.promptTokens = numberOrNull(u?.prompt_tokens); usage.completionTokens = numberOrNull(u?.completion_tokens); usage.costUsd = numberOrNull(u?.cost);
  if (typeof body.id === 'string') usage.providerRequestIds = [body.id];
  if (typeof body.model === 'string') usage.model = body.model;
  if (typeof body.provider === 'string') usage.provider = body.provider;
  const content = body.choices?.[0]?.message?.content;
  if (body.error || typeof content !== 'string' || !content.trim()) throw new ProviderFailure('failed', usage, 'Provider returned no usable caption. Edit manually.');
  return { content, usage };
}
export function addUsage(a: GenerationUsage, b: GenerationUsage): GenerationUsage {
  const sum = (x: number | null, y: number | null) => x === null || y === null ? null : x + y;
  if (!a.calls) return b;
  return { ...b, calls: a.calls + b.calls, promptTokens: sum(a.promptTokens, b.promptTokens), completionTokens: sum(a.completionTokens, b.completionTokens), costUsd: sum(a.costUsd, b.costUsd), providerRequestIds: [...a.providerRequestIds, ...b.providerRequestIds] };
}
