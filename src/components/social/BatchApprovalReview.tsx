"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reginaToIso } from "@/lib/social/schedule";
import type { SocialPost } from "@/lib/types/social";

interface Review {
  post: SocialPost;
  fingerprint: string;
  target: { platform: string; accountId: string; pageId: string } | null;
  blockers: string[];
  publishingEnabled: boolean;
  content: { caption: string; imageUrls: string[] };
}

export function BatchApprovalReview({ postIds, batchId }: { postIds: string[]; batchId?: string }) {
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(postIds.length);
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState<string[]>([]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [exactConfirmed, setExactConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(''); setReviews([]); setApproved([]); setRightsConfirmed(false); setExactConfirmed(false); setTimes({});
      try {
        let ids = postIds.slice(page * 9, page * 9 + 9);
        if (batchId) {
          const response = await fetch(`/api/staff/social/batch/monthly?batchId=${encodeURIComponent(batchId)}&page=${page}`, { cache: 'no-store' });
          const saved = await response.json();
          if (!response.ok) throw new Error(saved.error || 'Unable to resume monthly batch');
          ids = saved.posts.map((post: { id: string }) => post.id);
          if (!cancelled) { setTotal(saved.total); setHasMore(saved.hasMore); }
        } else if (!cancelled) setHasMore((page + 1) * 9 < postIds.length);
        const loaded = await Promise.all(ids.map(async (id) => {
          const res = await fetch(`/api/staff/social/posts/${encodeURIComponent(id)}/approval`, { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Unable to load saved review");
          return data as Review;
        }));
        if (!cancelled) {
          setReviews(loaded);
          setApproved(loaded.filter(r => (r.post.status === "ready" && r.post.approval_hash === r.fingerprint) || r.post.status === "posted").map(r => r.post.id));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load review");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [postIds, batchId, page, refresh]);

  async function saveTime(id: string) {
    if (!times[id] || editing) return;
    setEditing(true); setError(''); setExactConfirmed(false);
    try {
      const res = await fetch(`/api/staff/social/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schedule_time: reginaToIso(times[id]) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Time edit failed');
      setRefresh(value => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Time edit failed'); }
    finally { setEditing(false); }
  }
  const pending = reviews.filter(r => !approved.includes(r.post.id));
  const blocked = pending.some(r => r.blockers.length > 0);
  async function approve() {
    if (approving || !rightsConfirmed || !exactConfirmed || blocked) return;
    setApproving(true);
    setError("");
    for (const review of pending) {
      try {
        const res = await fetch(`/api/staff/social/posts/${encodeURIComponent(review.post.id)}/approval`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: review.fingerprint, rightsConfirmed: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Approval could not be saved");
        setApproved(prev => [...prev, review.post.id]);
      } catch (e) {
        setError(`${e instanceof Error ? e.message : "Approval failed"}. Previously confirmed approvals remain saved. Refresh the review before trying again.`);
        setExactConfirmed(false);
        break;
      }
    }
    setApproving(false);
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review saved batch</h1>
          <p className="mt-2 text-sm text-gray-600">{total} destination drafts saved. Page {page + 1}. Check the exact images, captions, destination and dates below. All times are Regina time.</p>
        </div>
        {loading && <p role="status">Loading saved previews…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {reviews.some(r => !r.publishingEnabled) && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Publishing is paused. Approval can be recorded when the checks pass, but nothing will publish until the publisher is enabled. Missed dates need a fresh review.</p>}
        {reviews.map(review => (
          <article key={review.post.id} className="overflow-hidden rounded-2xl border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={review.content?.imageUrls[0] || review.post.image_urls?.[0] || review.post.image_url || ""} alt={review.post.alt_text || "Post image for approval"} className="max-h-[480px] w-full object-contain bg-gray-100" />
            <div className="space-y-3 p-5">
              <p className="text-sm font-semibold">{review.target?.platform === 'facebook' ? 'Facebook' : review.target?.platform === 'instagram' ? 'Instagram' : review.target?.platform === 'gbp' ? 'Google Business Profile' : 'Destination'} · {review.target ? `account ${review.target.accountId} · ${review.target.platform === 'gbp' ? 'Location' : 'Page'} ${review.target.pageId}` : "Account not connected"}</p>
              <p className="whitespace-pre-wrap text-sm">{review.content?.caption || "Caption unavailable"}</p>
              {review.post.gbp_payload && review.target?.platform === 'gbp' && <div className="space-y-2 rounded bg-gray-50 p-3 text-sm break-words">
                <p>Google post type: {review.post.gbp_payload.topicType === 'OFFER' ? 'Offer' : 'Standard promotion'}</p>
                {review.post.gbp_payload.callToAction && <p>Learn more destination: {review.post.gbp_payload.callToAction.url}</p>}
                {review.post.gbp_payload.event && <>
                  <p>Offer title: {review.post.gbp_payload.event.title}</p>
                  <p>Starts: {googleDate(review.post.gbp_payload.event.schedule?.startDate)} · Ends: {googleDate(review.post.gbp_payload.event.schedule?.endDate)}</p>
                  <p>Start time: {review.post.gbp_payload.event.schedule?.startTime ? JSON.stringify(review.post.gbp_payload.event.schedule?.startTime) : '00:00'} · End time: {review.post.gbp_payload.event.schedule?.endTime ? JSON.stringify(review.post.gbp_payload.event.schedule?.endTime) : '23:59:59'}</p>
                </>}
                {review.post.gbp_payload.offer && <>
                  <p>Redemption destination: {review.post.gbp_payload.offer.redeemOnlineUrl}</p>
                  {review.post.gbp_payload.offer.couponCode && <p>Coupon code: {review.post.gbp_payload.offer.couponCode}</p>}
                  <p className="whitespace-pre-wrap">Terms: {review.post.gbp_payload.offer.termsConditions}</p>
                </>}
              </div>}
              <p className="text-sm font-semibold">{review.post.schedule_time ? new Date(review.post.schedule_time).toLocaleString("en-CA", { timeZone: "America/Regina", dateStyle: "full", timeStyle: "short" }) : "No date chosen"} · Regina</p>
              {review.post.error_message && <p className="rounded bg-amber-50 p-3 text-sm">{review.post.error_message}</p>}
              {['draft', 'ready', 'skip'].includes(review.post.status) && <div className="flex flex-col gap-3 sm:flex-row"><label className="text-sm">New exact time (Regina)<input type="datetime-local" disabled={approving || editing} value={times[review.post.id] ?? ''} onChange={e => { setExactConfirmed(false); setTimes(prev => ({ ...prev, [review.post.id]: e.target.value })); }} className="block border p-2" /></label><button disabled={approving || editing || !times[review.post.id]} onClick={() => void saveTime(review.post.id)} className="text-sm underline">Save time and reload review</button></div>}
              {!approved.includes(review.post.id) && review.blockers.length > 0 && <ul className="list-disc pl-5 text-sm text-amber-900">{review.blockers.map(item => <li key={item}>{item}</li>)}</ul>}
              {approved.includes(review.post.id) && <p role="status" className="text-sm font-semibold text-green-800">Approval saved for this version.</p>}
              <Link href={`/staff/social/${review.post.id}`} className="inline-block text-sm underline">Edit draft (changes require another review)</Link>
            </div>
          </article>
        ))}
        {!loading && reviews.length > 0 && <section className="space-y-4 rounded-2xl border bg-white p-5">
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={rightsConfirmed} onChange={e => setRightsConfirmed(e.target.checked)} disabled={approving} /><span>I have permission to use these uploaded images on social media, and have checked customer details and claims. Existing catalog restrictions still apply.</span></label>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={exactConfirmed} onChange={e => setExactConfirmed(e.target.checked)} disabled={approving} /><span>I approve the exact images, captions, account and dates shown above.</span></label>
          <button onClick={approve} disabled={loading || approving || editing || Object.values(times).some(Boolean) || blocked || !rightsConfirmed || !exactConfirmed || pending.length === 0 || !!error} className="rounded-xl bg-[#e63020] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{approving ? "Saving approvals…" : pending.length === 0 ? (batchId ? "Page approval saved" : "Batch approval saved") : (batchId ? `Approve ${pending.length} destinations on this page` : `Approve ${pending.length} posts`)}</button>
          <p className="text-xs text-gray-500">{approved.length} of {reviews.length} destinations on this page approved or posted. Approval does not claim publication.</p>
        </section>}
        <nav className="flex justify-between"><button disabled={!page || loading || approving || editing} onClick={() => setPage(p => p - 1)}>Previous page</button><button disabled={!hasMore || loading || approving || editing} onClick={() => setPage(p => p + 1)}>Next page</button></nav>
        <div className="flex gap-5 text-sm"><Link className="underline" href="/staff/social/monthly">Resume monthly batches</Link><Link className="underline" href="/staff/social/queue">View queue</Link><Link className="underline" href="/staff/social/batch">Prepare another batch</Link></div>
      </div>
    </main>
  );
}

function googleDate(date?: { year: number; month: number; day: number }) {
  if (!date) return 'Invalid date; edit this draft';
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
