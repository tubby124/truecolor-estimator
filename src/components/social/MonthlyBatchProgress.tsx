'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface ProgressPost {
  id: string;
  creative_id: string | null;
  platforms: string[];
  status: string;
  schedule_time: string | null;
  error_message: string | null;
  results: { platform: string; status: string; public_url: string | null }[];
}
interface ProgressSnapshot {
  batchId: string;
  posts: ProgressPost[];
  total: number;
  checkedAt: string;
}

function progressLabel(post: ProgressPost) {
  if (post.error_message || post.status === 'failed') return 'Needs attention';
  if (post.status === 'posting') return 'Awaiting receipt';
  if (post.status === 'posted') return 'Provider reported published';
  if (post.status === 'ready') return 'Approved';
  if (post.status === 'draft') return 'Needs review';
  if (post.status === 'skip') return 'Skipped';
  return 'Needs attention';
}

function receiptUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function reginaTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-CA', { timeZone: 'America/Regina', dateStyle: 'medium', timeStyle: 'short' }) : 'Time unavailable';
}

/** Read-only delivery snapshots; refreshing never changes the exact approval form. */
export function MonthlyBatchProgress({ batchId }: { batchId: string }) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    let pending = false;
    let controller: AbortController | null = null;
    setSnapshot(null); setError(''); setLoading(false);
    async function refresh() {
      if (!active || pending || document.visibilityState === 'hidden') return;
      pending = true; setLoading(true);
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 12_000);
      try {
        const response = await fetch(`/api/staff/social/batch/monthly?batchId=${encodeURIComponent(batchId)}&view=progress`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        if (!response.ok || data.batchId !== batchId || !Array.isArray(data.posts) || data.posts.length !== data.total || !Number.isFinite(Date.parse(data.checkedAt))) throw new Error('Progress refresh failed');
        if (active) { setSnapshot(data); setError(''); }
      } catch {
        if (active) setError('Progress could not refresh. Any previously shown results may be stale.');
      } finally {
        clearTimeout(timeout); pending = false;
        if (active) setLoading(false);
      }
    }
    refreshRef.current = () => { void refresh(); };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 15_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); refreshRef.current = () => {}; };
  }, [batchId]);

  const current = snapshot?.batchId === batchId ? snapshot : null;
  const creativeCount = current ? new Set(current.posts.map(post => post.creative_id || post.id)).size : 0;
  const labels = ['Needs review', 'Approved', 'Awaiting receipt', 'Provider reported published', 'Needs attention', 'Skipped'];
  return <section aria-label="Monthly delivery progress" className="space-y-3 rounded-2xl border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold">Monthly delivery progress</h2>
      <button type="button" disabled={loading} onClick={() => refreshRef.current()} className="rounded border px-3 py-2 text-sm disabled:opacity-50">{loading ? 'Refreshing progress…' : 'Refresh progress'}</button>
    </div>
    <p className="text-xs text-gray-600">Refreshes every 15 seconds while this page is visible. This view does not approve, publish or retry posts.</p>
    <p className="text-xs">{current ? `Last successful refresh: ${reginaTime(current.checkedAt)} · Regina` : 'No successful progress refresh yet.'}</p>
    {error && <p role="alert" className="rounded bg-amber-50 p-3 text-sm">{error}</p>}
    {current && <>
      <p className="text-sm">{current.total} saved destination{current.total === 1 ? '' : 's'} · {creativeCount} creative{creativeCount === 1 ? '' : 's'}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{labels.map(label => <div key={label} className="rounded bg-gray-50 p-2"><dt>{label}</dt><dd className="font-semibold">{current.posts.filter(post => progressLabel(post) === label).length}</dd></div>)}</dl>
      <p className="text-xs text-gray-600">Approved posts still require an enabled publisher and a valid schedule. Published means the provider reported success; open the receipt link to check the public post. Engagement metrics are not connected here.</p>
      <ul className="space-y-2">{current.posts.map(post => <li key={post.id} className="space-y-1 rounded border p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><Link href={`/staff/social/${encodeURIComponent(post.id)}`} className="underline">{post.platforms.join(' / ') || 'Destination'} · {post.schedule_time ? reginaTime(post.schedule_time) : 'Date not set'}</Link><span className="font-medium">{progressLabel(post)}</span></div>
        {post.error_message && <p className="text-amber-900">{post.error_message}</p>}
        {post.status === 'posting' && <p className="text-xs">Delivery may have been attempted. Reconcile its receipt before any retry.</p>}
        {(post.results || []).map((result, index) => {
          const href = result.status === 'published' ? receiptUrl(result.public_url) : null;
          return href ? <a key={`${result.platform}-${index}`} href={href} target="_blank" rel="noopener noreferrer" className="mr-3 inline-block underline">Open {result.platform} receipt link</a> : null;
        })}
      </li>)}</ul>
    </>}
  </section>;
}
