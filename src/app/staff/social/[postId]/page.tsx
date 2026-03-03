"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PostStatusBadge } from "@/components/social/PostStatusBadge";
import { PlatformBadges } from "@/components/social/PlatformBadges";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SocialPost, Platform, PostStatus } from "@/lib/types/social";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [captionRaw, setCaptionRaw] = useState("");
  const [captionInstagram, setCaptionInstagram] = useState("");
  const [captionFacebook, setCaptionFacebook] = useState("");
  const [captionTwitter, setCaptionTwitter] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("16:00");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<PostStatus>("draft");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/staff/social/posts/${postId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { showToast(data.error, "error"); return; }
        setPost(data);
        setCaptionRaw(data.caption_raw ?? "");
        setCaptionInstagram(data.caption_instagram ?? "");
        setCaptionFacebook(data.caption_facebook ?? "");
        setCaptionTwitter(data.caption_twitter ?? "");
        setImageUrl(data.image_url ?? "");
        setHashtags(data.hashtags ?? "");
        setStatus(data.status);
        setPlatforms(data.platforms ?? []);
        setNotes(data.notes ?? "");
        if (data.schedule_time) {
          const d = new Date(data.schedule_time);
          setScheduleDate(d.toISOString().split("T")[0]);
          setScheduleTime(d.toTimeString().slice(0, 5));
        } else if (data.schedule_date) {
          setScheduleDate(data.schedule_date);
        }
      })
      .catch(() => showToast("Failed to load post", "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSave() {
    setSaving(true);
    try {
      const scheduleTimestamp = scheduleDate ? `${scheduleDate}T${scheduleTime}:00` : null;
      const res = await fetch(`/api/staff/social/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption_raw: captionRaw,
          caption_instagram: captionInstagram || null,
          caption_facebook: captionFacebook || null,
          caption_twitter: captionTwitter || null,
          image_url: imageUrl || null,
          hashtags: hashtags || null,
          schedule_time: scheduleTimestamp,
          platforms,
          status,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      showToast("Post saved!", "success");
      setTimeout(() => router.push("/staff/social/queue"), 1200);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/social/posts/${postId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      showToast(data.message ?? "Post marked ready!", "success");
      setStatus("ready");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Publish failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const PLATFORM_OPTIONS: { key: Platform; icon: string; label: string }[] = [
    { key: "instagram", icon: "📸", label: "Instagram" },
    { key: "facebook", icon: "🌐", label: "Facebook" },
    { key: "twitter", icon: "🐦", label: "X/Twitter" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Post not found.</p>
          <Link href="/staff/social/queue" className="text-sm text-[#e63020] hover:underline mt-2 block">← Back to queue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/staff/social/queue" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-black text-[#1c1712]">Edit Post</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <PostStatusBadge status={status} />
                <PlatformBadges platforms={platforms} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="text-sm font-bold text-[#e63020] border-2 border-[#e63020] px-4 py-2 rounded-lg hover:bg-[#e63020]/5 transition-colors disabled:opacity-50"
            >
              Mark Ready
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-bold bg-[#1c1712] text-white px-4 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Captions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#1c1712]">Captions</h2>
          {[
            { label: "Raw caption", value: captionRaw, set: setCaptionRaw, rows: 3, limit: null },
            { label: "📸 Instagram", value: captionInstagram, set: setCaptionInstagram, rows: 2, limit: 220 },
            { label: "🌐 Facebook", value: captionFacebook, set: setCaptionFacebook, rows: 2, limit: 300 },
            { label: "🐦 X/Twitter", value: captionTwitter, set: setCaptionTwitter, rows: 2, limit: 200 },
          ].map(f => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-500">{f.label}</label>
                {f.limit && <span className={`text-xs font-mono ${f.value.length > f.limit ? "text-red-500" : "text-gray-400"}`}>{f.value.length}/{f.limit}</span>}
              </div>
              <textarea
                value={f.value}
                onChange={e => f.set(e.target.value)}
                rows={f.rows}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
              />
            </div>
          ))}
        </div>

        {/* Image + hashtags */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#1c1712]">Image & Hashtags</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Hashtags</label>
            <textarea
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
            />
          </div>
        </div>

        {/* Schedule + platforms */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#1c1712]">Schedule & Platforms</h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-2">Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlatforms(prev =>
                    prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key]
                  )}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${platforms.includes(p.key) ? "border-[#1c1712] bg-[#1c1712] text-white" : "border-gray-200 text-gray-500"}`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Time</label>
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as PostStatus)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]">
              {(["draft","ready","posting","posted","failed","skip"] as PostStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <label className="text-xs font-semibold text-gray-500 block mb-2">Staff Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
