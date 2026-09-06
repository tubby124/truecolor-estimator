'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MonthlyPlanImport } from './MonthlyPlanImport';
import { MarketingQualityCheck } from './MarketingQualityCheck';
import type { GenerationUsage } from '@/lib/social/generation-contract';
import type { ProductFacts } from '@/lib/pricing/product-facts';
import { compressForAI } from './BatchScheduler';
import { reginaDate, reginaToIso } from '@/lib/social/schedule';

type Channel = 'instagram' | 'facebook' | 'gbp';
interface Creative {
  id: string; requestId: string; imageUrl: string; captions: Record<Channel, string>;
  time: string; channels: Channel[]; productSlug: string; generationStatus?: 'running' | 'completed' | 'partial' | 'held' | 'failed'; resumeJobId?: string; factFingerprint?: string; configuration?: ProductFacts['configuration']; usage?: GenerationUsage; hashtags?: string; jobId?: string; error?: string;
}
interface Session { batchId: string; month: string; creatives: Creative[]; chunks: { requestId: string; payload: string; saved: boolean }[] }
const channels: Channel[] = ['instagram', 'facebook', 'gbp'];
const storageKey = 'social-monthly-preparation-v1';
const fresh = (): Session => ({ batchId: crypto.randomUUID(), month: reginaDate().slice(0, 7), creatives: [], chunks: [] });

/** Preparation is private. Server chunks are immutable; saved draft edits happen in exact review. */
export function MonthlyBatchScheduler() {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;
  const [batches, setBatches] = useState<{ id: string; month: string }[]>([]);
  const [batchPage, setBatchPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [available, setAvailable] = useState(false);
  const businessStorageKey = useRef('');
  useEffect(() => {
    let canceled = false;
    void fetch(`/api/staff/social/batch/monthly?page=${batchPage}`, { cache: 'no-store' }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Monthly review unavailable');
      if (!canceled) { setAvailable(true); setBatches(data.batches); setHasMore(data.hasMore);
        const key = `${storageKey}:${data.businessId}`;
        if (businessStorageKey.current !== key) {
          businessStorageKey.current = key;
          try { const saved = localStorage.getItem(key); setSession(saved ? JSON.parse(saved) : fresh()); } catch { setSession(fresh()); }
        } }
    }).catch(e => { if (!canceled) setError(e.message); });
    return () => { canceled = true; };
  }, [batchPage]);
  function retain(next: Session) {
    // Persist the stable request before sending it. Storage failure prevents a potentially duplicate save.
    if (!businessStorageKey.current) throw new Error('Business context unavailable');
    localStorage.setItem(businessStorageKey.current, JSON.stringify(next));
    sessionRef.current = next;
    setSession(next);
  }
  function update(id: string, change: Partial<Creative>) {
    if (!session || session.chunks.length) return;
    retain({ ...session, creatives: session.creatives.map(c => c.id === id ? { ...c, ...change } : c) });
  }
  async function upload(files: FileList | null) {
    if (!files || !session || busyRef.current || session.chunks.length) return;
    busyRef.current = true; setBusy(true); setError('');
    let current = session;
    try {
      for (const file of Array.from(files).slice(0, 31 - session.creatives.length)) {
        const form = new FormData(); form.append('file', file); form.append('format', 'jpeg'); form.append('fitForSocial', '1');
        const res = await fetch('/api/staff/social/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        const day = String(Math.min(current.creatives.length + 1, new Date(Number(current.month.slice(0, 4)), Number(current.month.slice(5)), 0).getDate())).padStart(2, '0');
        current = { ...current, creatives: [...current.creatives, { id: crypto.randomUUID(), requestId: crypto.randomUUID(), imageUrl: data.url, captions: { instagram: '', facebook: '', gbp: '' }, time: `${current.month}-${day}T15:00`, channels: ['instagram', 'facebook'], productSlug: '' }] };
        retain(current);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload stopped; previous photos are retained'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function generate(creative: Creative, resume = false) {
    if (!session || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      if (resume) {
        if (creative.generationStatus !== 'partial' || !creative.jobId) throw new Error('Only a confirmed partial job can resume missing channels');
        creative = { ...creative, requestId: crypto.randomUUID(), resumeJobId: creative.jobId };
        // Preserve the new attempt ID before the network; a lost ACK reuses it.
        update(creative.id, { requestId: creative.requestId, resumeJobId: creative.resumeJobId });
      }
      // Upload endpoint provides a JPEG. The caption service accepts its validated URL;
      // generation jobs and source-fact checks are owned by the shared generation helper.
      const { generateCaptions } = await import('@/lib/social/generation-client');
      const imageResponse = await fetch(creative.imageUrl);
      if (!imageResponse.ok) throw new Error('Uploaded photo unavailable');
      const image = await compressForAI(new File([await imageResponse.blob()], 'social-photo.jpg', { type: 'image/jpeg' }));
      const result = await generateCaptions({ image_base64: image.base64, image_type: image.type, requestId: creative.requestId, selectedChannels: creative.channels, ...(creative.resumeJobId ? { resumeJobId: creative.resumeJobId } : {}), ...(creative.productSlug ? { productSlug: creative.productSlug } : {}), includePrice: false });
      if (!result.drafts) throw new Error('No completed captions yet. Resume this same request or write a draft manually.');
      update(creative.id, { requestId: creative.requestId, resumeJobId: creative.resumeJobId, captions: { ...creative.captions, ...result.drafts }, factFingerprint: result.facts?.sourceFingerprint, configuration: result.facts?.configuration, generationStatus: result.status, usage: result.usage, hashtags: result.hashtags, jobId: result.jobId });
      setMessage(`Generation ${result.status}${result.cacheHit ? ' (cached)' : ''}. ${result.errors.join(' ')}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Generation held. You can write captions manually.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function save() {
    if (!session || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    let current = session;
    try {
      if (!current.chunks.length) {
        if (!current.creatives.length || current.creatives.some(c => !c.channels.length || c.channels.some(channel => !c.captions[channel].trim()))) throw new Error('Add a caption for each selected destination.');
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(current.month)) throw new Error('Choose a valid month');
        for (const creative of current.creatives) {
          reginaToIso(creative.time);
          if (creative.time.slice(0, 7) !== current.month) throw new Error('Every date must fall within the selected Regina month');
          if (creative.productSlug && (!creative.factFingerprint || !creative.configuration)) throw new Error('Generate the selected product facts before saving, or clear the optional product field');
          for (const channel of creative.channels) {
            if (creative.captions[channel].length > (channel === 'gbp' ? 1500 : 2200)) throw new Error(`Shorten the ${channel} caption before saving`);
          }
        }
        const chunks: Session['chunks'] = [];
        for (let i = 0; i < current.creatives.length; i += 10) {
          const posts = current.creatives.slice(i, i + 10).map(c => ({ creative_id: c.id, caption_raw: c.captions[c.channels[0]], caption_instagram: c.captions.instagram, caption_facebook: c.captions.facebook, caption_gbp: c.captions.gbp, hashtags: c.hashtags, image_url: c.imageUrl, platforms: c.channels, schedule_time: reginaToIso(c.time), fact_fingerprint: c.factFingerprint, product_configuration: c.configuration, gbp_payload: { topicType: 'STANDARD' }, generation_job_id: c.jobId, product_slug: c.productSlug || null }));
          const requestId = crypto.randomUUID();
          chunks.push({ requestId, saved: false, payload: JSON.stringify({ batchId: current.batchId, requestId, month: current.month, posts }) });
        }
        current = { ...current, chunks }; retain(current);
      }
      for (let i = 0; i < current.chunks.length; i++) {
        if (current.chunks[i].saved) continue;
        const res = await fetch('/api/staff/social/batch/monthly', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: current.chunks[i].payload });
        const data = await res.json();
        if (!res.ok) {
          // A confirmed input rejection occurs before RPC write. Only a first-chunk
          // rejection can safely unlock the whole preparation; uncertainty keeps IDs.
          if (res.status === 400 && !current.chunks.some(c => c.saved)) { current = { ...current, chunks: [] }; retain(current); }
          throw new Error(data.error || 'Chunk save held');
        }
        current = { ...current, chunks: current.chunks.map((c, j) => i === j ? { ...c, saved: true } : c) }; retain(current);
      }
      setMessage('All chunks saved. Open exact review to approve each page.');
    } catch (e) { setError(`${e instanceof Error ? e.message : 'Save result uncertain'}. Resume save uses the same durable request IDs.`); }
    finally { busyRef.current = false; setBusy(false); }
  }
  if (!session) return <p className="p-8">{error || 'Loading preparation…'}</p>;
  const locked = busy || !!session.chunks.length;
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <h1 className="text-2xl font-bold">Monthly preparation and review</h1>
    <p className="text-sm">Prepare up to 31 logical creatives. Instagram and Facebook start selected. Add Google Business Profile only for the specific offers you want there, usually 1–2 each week. Every destination gets an exact saved approval.</p>
    {error && <p role="alert" className="rounded bg-amber-50 p-4">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!session.creatives.length && !session.chunks.length && <MonthlyPlanImport disabled={busy || !available} onBusyChange={value => { busyRef.current = value; setBusy(value); }} onPrepared={(month, creatives) => {
      const current = sessionRef.current;
      if (!current || current.creatives.length || current.chunks.length) throw new Error('Preparation changed. Start an empty batch before importing.');
      retain({ ...current, month, creatives });
      setMessage('Prepared month loaded. Review the final uploaded photos, captions and dates, then save drafts.');
    }} />}
    <label className="block">Month (Regina) <input type="month" value={session.month} disabled={locked || !!session.creatives.length} onChange={e => retain({ ...session, month: e.target.value })} /></label>
    <label className="block">Add photos <input type="file" accept="image/*" multiple disabled={locked || !available || session.creatives.length >= 31} onChange={e => void upload(e.target.files)} /></label>
    <p className="text-xs">Uploaded preparation and request IDs are retained on this browser. Saved chunks and exact approvals are stored on the server and can be resumed below.</p>
    {session.creatives.map((c, i) => <article key={c.id} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Creative {i + 1}</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.imageUrl} alt={`Creative ${i + 1} for review`} className="max-h-60 object-contain" />
      <div className="flex gap-4">{channels.map(channel => <label key={channel}><input type="checkbox" disabled={locked} checked={c.channels.includes(channel)} onChange={e => update(c.id, { channels: e.target.checked ? [...c.channels, channel] : c.channels.filter(v => v !== channel), requestId: crypto.randomUUID(), resumeJobId: undefined, generationStatus: undefined })} /> {channel === 'gbp' ? 'Google Business Profile' : channel}</label>)}</div>
      <label className="block">Catalogue product slug (optional) <input value={c.productSlug} disabled={locked} onChange={e => update(c.id, { productSlug: e.target.value, requestId: crypto.randomUUID(), resumeJobId: undefined, generationStatus: undefined, factFingerprint: undefined, configuration: undefined, jobId: undefined })} className="border p-2" /></label>
      <button disabled={locked || !c.channels.length} onClick={() => void generate(c)} className="rounded border p-2">Generate / resume selected captions</button>
      <MarketingQualityCheck captions={c.captions} channels={c.channels} recentCaptions={Object.fromEntries(channels.map(channel => [channel, session.creatives.filter(other => other.id !== c.id && other.channels.includes(channel)).map(other => other.captions[channel] || "").filter(Boolean)]))} />
      {c.generationStatus === 'partial' && <button disabled={locked} onClick={() => void generate(c, true)} className="ml-3 rounded border p-2">Resume missing channels with a new attempt</button>}
      {c.usage && <p className="text-xs">Reported usage for this response: {c.usage.calls} provider calls · {c.usage.promptTokens ?? 'unknown'} input tokens · {c.usage.completionTokens ?? 'unknown'} output tokens · {c.usage.costUsd === null ? 'cost unavailable' : `US$${c.usage.costUsd.toFixed(4)}`}</p>}
      {c.channels.map(channel => <label key={channel} className="block">{channel} exact caption<textarea rows={3} value={c.captions[channel]} disabled={locked} onChange={e => update(c.id, { captions: { ...c.captions, [channel]: e.target.value } })} className="block w-full rounded border p-2" /></label>)}
      <label className="block">Exact date and time (Regina) <input type="datetime-local" value={c.time} disabled={locked} onChange={e => update(c.id, { time: e.target.value })} className="border p-2" /></label>
    </article>)}
    <div className="flex flex-wrap gap-4">
      <button disabled={busy || !available || !session.creatives.length} onClick={() => void save()} className="rounded bg-black p-3 text-white disabled:opacity-40">{busy ? 'Working…' : session.chunks.length ? 'Resume chunk save' : 'Save drafts in chunks'}</button>
      {!!session.chunks.length && <Link className="underline p-3" href={`/staff/social/review?batchId=${session.batchId}`}>Review saved batch ({session.chunks.filter(c => c.saved).length}/{session.chunks.length} chunks)</Link>}
      {session.chunks.length > 0 && session.chunks.every(c => c.saved) && <button disabled={busy} onClick={() => { retain(fresh()); setMessage(''); }} className="rounded border p-3">Start another batch</button>}
    </div>
    <section className="space-y-2"><h2 className="font-semibold">Resume saved monthly batches</h2>{batches.map(batch => <p key={batch.id}><Link className="underline" href={`/staff/social/review?batchId=${batch.id}`}>{batch.month} · {batch.id.slice(0, 8)}</Link></p>)}<button disabled={!batchPage} onClick={() => setBatchPage(p => p - 1)}>Previous batches</button> · <button disabled={!hasMore} onClick={() => setBatchPage(p => p + 1)}>More batches</button></section>
    <Link href="/staff/social/batch" className="underline">Legacy batch preparation</Link>
  </main>;
}
