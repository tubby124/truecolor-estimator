import type { GenerationInput, GenerationResponse } from './generation-contract';
export type { GenerationInput, GenerationResponse, GenerationChannel } from './generation-contract';
/** Caller retains requestId across reconnects. No hidden retries or new IDs on network failure. */
export async function generateCaptions(input: GenerationInput, businessId?: string): Promise<GenerationResponse> {
  const response = await fetch('/api/staff/social/captions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(businessId ? { 'X-Social-Business-Id': businessId } : {}) }, body: JSON.stringify(input) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Caption generation unavailable. Keep this request ID for recovery.');
  return data as GenerationResponse;
}
export async function readGeneration(requestId: string, businessId?: string): Promise<{ jobId: string; status: GenerationResponse['status']; result: GenerationResponse | null }> {
  const response = await fetch(`/api/staff/social/captions?requestId=${encodeURIComponent(requestId)}`, { headers: businessId ? { 'X-Social-Business-Id': businessId } : {} });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Generation recovery unavailable.');
  return data;
}
