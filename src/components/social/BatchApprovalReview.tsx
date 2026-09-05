"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SocialPost } from "@/lib/types/social";

interface Review {
  post: SocialPost;
  fingerprint: string;
  target: { platform: string; accountId: string; pageId: string } | null;
  blockers: string[];
  publishingEnabled: boolean;
  content: { caption: string; imageUrls: string[] };
}

export function BatchApprovalReview({ postIds }: { postIds: string[] }) {
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
      try {
        const loaded = await Promise.all(postIds.map(async (id) => {
          const res = await fetch(`/api/staff/social/posts/${encodeURIComponent(id)}/approval`, { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Unable to load saved review");
          return data as Review;
        }));
        if (!cancelled) {
          setReviews(loaded);
          setApproved(loaded.filter(r => r.post.status === "ready" && r.post.approval_hash === r.fingerprint).map(r => r.post.id));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load review");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [postIds]);

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
          <p className="mt-2 text-sm text-gray-600">{postIds.length} drafts saved. Check the exact images, captions, destination and dates below. All times are Regina time.</p>
        </div>
        {loading && <p role="status">Loading saved previews…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {reviews.some(r => !r.publishingEnabled) && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Publishing is paused. Approval can be recorded when the checks pass, but nothing will publish until the publisher is enabled. Missed dates need a fresh review.</p>}
        {reviews.map(review => (
          <article key={review.post.id} className="overflow-hidden rounded-2xl border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={review.content?.imageUrls[0] || review.post.image_urls?.[0] || review.post.image_url || ""} alt={review.post.alt_text || "Post image for approval"} className="max-h-[480px] w-full object-contain bg-gray-100" />
            <div className="space-y-3 p-5">
              <p className="text-sm font-semibold">Instagram · {review.target ? `account ${review.target.accountId} · Page ${review.target.pageId}` : "Account not connected"}</p>
              <p className="whitespace-pre-wrap text-sm">{review.content?.caption || "Caption unavailable"}</p>
              <p className="text-sm font-semibold">{review.post.schedule_time ? new Date(review.post.schedule_time).toLocaleString("en-CA", { timeZone: "America/Regina", dateStyle: "full", timeStyle: "short" }) : "No date chosen"} · Regina</p>
              {!approved.includes(review.post.id) && review.blockers.length > 0 && <ul className="list-disc pl-5 text-sm text-amber-900">{review.blockers.map(item => <li key={item}>{item}</li>)}</ul>}
              {approved.includes(review.post.id) && <p role="status" className="text-sm font-semibold text-green-800">Approval saved for this version.</p>}
              <Link href={`/staff/social/${review.post.id}`} className="inline-block text-sm underline">Edit draft (changes require another review)</Link>
            </div>
          </article>
        ))}
        {!loading && reviews.length > 0 && <section className="space-y-4 rounded-2xl border bg-white p-5">
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={rightsConfirmed} onChange={e => setRightsConfirmed(e.target.checked)} disabled={approving} /><span>I have permission to use these uploaded images on social media, and have checked customer details and claims. Existing catalog restrictions still apply.</span></label>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={exactConfirmed} onChange={e => setExactConfirmed(e.target.checked)} disabled={approving} /><span>I approve the exact images, captions, account and dates shown above.</span></label>
          <button onClick={approve} disabled={loading || approving || blocked || !rightsConfirmed || !exactConfirmed || pending.length === 0 || !!error} className="rounded-xl bg-[#e63020] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{approving ? "Saving approvals…" : pending.length === 0 ? "Batch approval saved" : `Approve ${pending.length} posts`}</button>
          <p className="text-xs text-gray-500">{approved.length} of {postIds.length} approvals saved. Approval does not claim publication.</p>
        </section>}
        <div className="flex gap-5 text-sm"><Link className="underline" href="/staff/social/queue">View queue</Link><Link className="underline" href="/staff/social/batch">Prepare another batch</Link></div>
      </div>
    </main>
  );
}
