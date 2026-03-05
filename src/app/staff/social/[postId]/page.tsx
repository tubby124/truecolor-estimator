"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { PostStatusBadge } from "@/components/social/PostStatusBadge";
import { PlatformBadges } from "@/components/social/PlatformBadges";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SocialPost, Platform, PostStatus } from "@/lib/types/social";

interface PageProps {
  params: Promise<{ postId: string }>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-0.5 h-4 bg-[#e63020] rounded-full flex-shrink-0" />
      <h2 className="text-xs font-bold text-[#1c1712] uppercase tracking-widest">{children}</h2>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default function PostDetailPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied!`, "success");
    }).catch(() => {
      showToast("Copy failed", "error");
    });
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

  const PLATFORM_OPTIONS: { key: Platform; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "twitter", label: "X / Twitter" },
  ];

  const cardClass = "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden";
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/20 focus:border-[#e63020] transition-colors";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] p-6 space-y-4">
        <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
        <Skeleton className="h-72 w-full max-w-2xl rounded-2xl" />
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f4f4f2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-3">Post not found.</p>
          <Link href="/staff/social/queue" className="text-sm font-semibold text-[#e63020] hover:underline">← Back to queue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/staff/social/queue" className="text-gray-400 hover:text-[#1c1712] transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <PostStatusBadge status={status} />
                <PlatformBadges platforms={platforms} />
                {scheduleDate && (
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                    {new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="text-sm font-bold text-[#e63020] border-2 border-[#e63020] px-4 py-2 rounded-xl hover:bg-[#e63020]/5 transition-colors disabled:opacity-40"
            >
              Mark Ready
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-bold bg-[#1c1712] text-white px-5 py-2 rounded-xl hover:bg-black transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* ── Card A: Captions ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cardClass}
        >
          <div className="px-6 pt-5 pb-1">
            <SectionLabel>Captions</SectionLabel>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Raw */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Raw caption</label>
              <textarea
                value={captionRaw}
                onChange={e => setCaptionRaw(e.target.value)}
                rows={10}
                className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
              />
            </div>

            {/* Instagram */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">Instagram</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(captionInstagram + (hashtags ? "\n\n" + hashtags : ""), "Caption + hashtags")}
                    className="text-gray-300 hover:text-[#e63020] transition-colors"
                    title="Copy caption + hashtags"
                  >
                    <CopyIcon />
                  </button>
                </div>
                <span className={`text-xs font-mono ${captionInstagram.length > 220 ? "text-red-500" : "text-gray-400"}`}>
                  {captionInstagram.length}/220
                </span>
              </div>
              <textarea
                value={captionInstagram}
                onChange={e => setCaptionInstagram(e.target.value)}
                rows={8}
                className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
              />
            </div>

            {/* Facebook + Twitter — collapsed row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500">Facebook</label>
                  <span className={`text-xs font-mono ${captionFacebook.length > 300 ? "text-red-500" : "text-gray-400"}`}>
                    {captionFacebook.length}/300
                  </span>
                </div>
                <textarea
                  value={captionFacebook}
                  onChange={e => setCaptionFacebook(e.target.value)}
                  rows={5}
                  className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500">X / Twitter</label>
                  <span className={`text-xs font-mono ${captionTwitter.length > 200 ? "text-red-500" : "text-gray-400"}`}>
                    {captionTwitter.length}/200
                  </span>
                </div>
                <textarea
                  value={captionTwitter}
                  onChange={e => setCaptionTwitter(e.target.value)}
                  rows={5}
                  className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Card B: Image, Prompt & Hashtags ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
          className={cardClass}
        >
          <div className="px-6 pt-5 pb-1">
            <SectionLabel>Image & Hashtags</SectionLabel>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Image URL */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://drive.google.com/… (paste generated image link here)"
                className={inputClass}
              />
              {imageUrl && imageUrl.startsWith("https://drive.google.com") && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#e63020] hover:underline mt-1.5"
                >
                  Open in Drive
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
            </div>

            {/* AI Image Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Image Prompt</label>
                <button
                  type="button"
                  onClick={() => handleCopy(notes, "Image prompt")}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#e63020] hover:bg-[#c8281a] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CopyIcon />
                  Copy Prompt
                </button>
              </div>
              {/* Dark terminal-style block */}
              <div className="relative rounded-xl overflow-hidden border border-[#1c1712]/20">
                <div className="bg-[#0f1117] px-3 py-2 flex items-center gap-1.5 border-b border-white/5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e63020]/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-white/30 font-mono">ChatGPT / DALL-E 3</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={9}
                  className="w-full bg-[#0f1117] text-[#c9d1d9] text-xs font-mono leading-relaxed px-4 py-3 focus:outline-none resize-y"
                  placeholder="Paste or edit the DALL-E 3 image prompt here…"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Copy → paste into ChatGPT → generate → save image to Drive → paste the link above.</p>
            </div>

            {/* Hashtags */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-semibold text-gray-500">Hashtags</label>
                <button
                  type="button"
                  onClick={() => handleCopy(hashtags, "Hashtags")}
                  className="text-gray-300 hover:text-[#e63020] transition-colors"
                  title="Copy hashtags"
                >
                  <CopyIcon />
                </button>
              </div>
              <textarea
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                rows={3}
                className={`${inputClass} font-mono text-xs resize-y`}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Card C: Schedule & Platforms ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
          className={cardClass}
        >
          <div className="px-6 pt-5 pb-1">
            <SectionLabel>Schedule & Platforms</SectionLabel>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {/* Platforms */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Platforms</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORM_OPTIONS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPlatforms(prev =>
                      prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key]
                    )}
                    className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                      platforms.includes(p.key)
                        ? "border-[#1c1712] bg-[#1c1712] text-white"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Date</label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Time</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as PostStatus)}
                  className={inputClass}
                >
                  {(["draft","ready","posting","posted","failed","skip"] as PostStatus[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
