"use client";

import { useState, useRef, useCallback } from "react";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { reginaDate, weeklySchedule, reginaToIso } from "@/lib/social/schedule";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "facebook";

interface Slot {
  file: File;
  preview: string;       // object URL
  imageUrl: string | null;   // after Supabase upload
  captionInstagram: string;
  captionFacebook: string;
  captionTwitter: string;
  hashtags: string;
  scheduleTime: string;  // "YYYY-MM-DDTHH:MM:00"
  processing: boolean;
  done: boolean;
  error: string | null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const todayYMD = reginaDate;
const spreadSchedule = weeklySchedule;

// ─── Image helpers ────────────────────────────────────────────────────────────

async function compressForAI(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1024;
        const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * ratio);
        canvas.height = Math.round(img.naturalHeight * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve({ base64: dataUrl.split(",")[1], type: "image/jpeg" });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("format", "jpeg");
  const res = await fetch("/api/staff/social/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

async function generateCaption(imageUrl: string) {
  // Analyze the validated JPEG derivative, including when the phone supplied HEIC.
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error("Uploaded photo could not be read for captioning");
  const jpeg = new File([await imageResponse.blob()], "social-photo.jpg", { type: "image/jpeg" });
  const { base64, type } = await compressForAI(jpeg);
  const res = await fetch("/api/staff/social/captions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64, image_type: type, image_url: imageUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Caption generation failed");
  return data as { instagram: string; facebook: string; twitter: string; hashtags?: string };
}

// ─── Platform toggle ──────────────────────────────────────────────────────────

const PLATFORM_OPTIONS: { key: Platform; icon: string; label: string }[] = [
  { key: "instagram", icon: "📸", label: "Instagram" },
  { key: "facebook",  icon: "🌐", label: "Facebook" },
];

const MAX_SLOTS = 7;

// ─── Main component ───────────────────────────────────────────────────────────

export function BatchScheduler() {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Shared settings
  const [startDate, setStartDate] = useState(todayYMD);
  const [postTime, setPostTime] = useState("15:00");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "facebook"]);

  // Per-photo slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const readyCount = slots.filter(s => s.imageUrl && (s.captionInstagram.trim() || s.captionFacebook.trim())).length;

  // Phase
  const [phase, setPhase] = useState<"upload" | "review">("upload");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveUncertain, setSaveUncertain] = useState(false);
  const savingRef = useRef(false);

  // ── Add files ───────────────────────────────────────────────────────────────

  const addFiles = useCallback((files: FileList) => {
    const available = MAX_SLOTS - slots.length;
    if (available <= 0) { showToast(`Max ${MAX_SLOTS} photos per batch`, "error"); return; }
    const toAdd = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, available);

    const newSlots: Slot[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      imageUrl: null,
      captionInstagram: "",
      captionFacebook: "",
      captionTwitter: "",
      hashtags: "",
      scheduleTime: "",
      processing: false,
      done: false,
      error: null,
    }));
    setSlots((prev) => [...prev, ...newSlots]);
  }, [slots.length, showToast]);

  const removeSlot = useCallback((i: number) => {
    setSlots((prev) => {
      const s = [...prev];
      URL.revokeObjectURL(s[i].preview);
      s.splice(i, 1);
      return s;
    });
  }, []);

  // ── Update spread when startDate/postTime changes ───────────────────────────

  function applySpread() {
    if (slots.length === 0) return;
    const times = spreadSchedule(startDate, slots.length, postTime);
    setSlots((prev) => prev.map((s, i) => ({ ...s, scheduleTime: times[i] })));
  }

  // ── Prepare photos with optional AI captions ───────────────────────────────────────────────────

  async function prepareAll(withAI: boolean) {
    if (slots.length === 0 || generating) return;
    setGenerating(true);

    // Spread schedule first
    const times = spreadSchedule(startDate, slots.length, postTime);

    for (let i = 0; i < slots.length; i++) {
      if (slots[i].done) continue; // skip already processed

      setSlots((prev) => prev.map((s, j) => j === i ? { ...s, processing: true, error: null } : s));

      try {
        // 1. Upload
        const imageUrl = slots[i].imageUrl || await uploadImage(slots[i].file);
        // Retain the uploaded derivative even if optional caption generation fails.
        setSlots(prev => prev.map((s, j) => j === i ? { ...s, imageUrl, preview: imageUrl, scheduleTime: s.scheduleTime || times[i] } : s));
        // Manual preparation never calls the paid caption endpoint.
        const captions = withAI ? await generateCaption(imageUrl) : null;

        setSlots((prev) => prev.map((s, j) => j === i ? {
          ...s,
          imageUrl,
          preview: imageUrl,
          captionInstagram: captions?.instagram ?? s.captionInstagram,
          captionFacebook: captions?.facebook ?? s.captionFacebook,
          captionTwitter: captions?.twitter ?? s.captionTwitter,
          hashtags: captions?.hashtags ?? s.hashtags,
          scheduleTime: s.scheduleTime || times[i],
          processing: false,
          done: true,
        } : s));
      } catch (e) {
        setSlots((prev) => prev.map((s, j) => j === i ? {
          ...s,
          processing: false,
          error: e instanceof Error ? e.message : "Failed",
        } : s));
      }
    }

    setGenerating(false);
    setPhase("review");
  }

  // ── Update a single slot caption / schedule ─────────────────────────────────

  function updateCaption(i: number, field: "captionInstagram" | "captionFacebook" | "captionTwitter" | "hashtags" | "scheduleTime", value: string) {
    setSlots((prev) => prev.map((s, j) => j === i ? { ...s, [field]: value } : s));
  }

  // ── Schedule all ────────────────────────────────────────────────────────────

  async function scheduleAll() {
    const readySlots = slots.filter((s) => s.imageUrl && (s.captionInstagram.trim() || s.captionFacebook.trim()));
    if (readySlots.length === 0) {
      showToast("Add a caption to at least one uploaded photo first", "error");
      return;
    }
    if (platforms.length === 0) {
      showToast("Choose at least one destination", "error");
      return;
    }
    if (savingRef.current || saveUncertain) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const posts = readySlots.map((s) => ({
        caption_raw: s.captionInstagram || s.captionFacebook,
        caption_instagram: s.captionInstagram,
        caption_facebook: s.captionFacebook,
        caption_twitter: s.captionTwitter,
        hashtags: s.hashtags,
        image_url: s.imageUrl!,
        platforms,
        schedule_time: reginaToIso(s.scheduleTime),
      }));

      const res = await fetch("/api/staff/social/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Batch save failed");

      router.push(`/staff/social/review?ids=${encodeURIComponent(data.posts.map((post: { id: string }) => post.id).join(","))}`);
    } catch {
      setSaveUncertain(true);
      showToast("Save result uncertain. Check the queue before preparing another batch; retry is disabled to avoid duplicates.", "error");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // ── Toggle platform ─────────────────────────────────────────────────────────

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────


  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">Prepare a batch</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Upload up to {MAX_SLOTS} photos → edit captions and times → approve the batch once for both destinations
            </p>
          </div>
          {phase === "review" && (
            <button
              onClick={scheduleAll}
              disabled={saving || saveUncertain || readyCount === 0 || platforms.length === 0}
              className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#c8281a] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                `Save ${readyCount} posts · ${readyCount * platforms.length} deliveries`
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {saveUncertain && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">Check the <Link href="/staff/social/queue" className="underline">saved queue</Link> before creating another batch. The previous save may have succeeded.</p>}

        {/* ── Shared settings ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#1c1712] mb-4">Scheduling Settings</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Start date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                First post date
              </label>
              <input
                type="date"
                value={startDate}
                min={todayYMD()}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
              />
              <p className="text-xs text-gray-400 mt-1">One post each week</p>
            </div>

            {/* Post time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Post time (Regina)
              </label>
              <input
                type="time"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
              />
              <p className="text-xs text-gray-400 mt-1">America/Regina · applied to all posts</p>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Platforms
              </label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORM_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => togglePlatform(p.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      platforms.includes(p.key)
                        ? "border-[#1c1712] bg-[#1c1712] text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Re-apply spread button (shown in review phase) */}
          {phase === "review" && slots.some(s => s.done) && (
            <button
              onClick={applySpread}
              className="mt-4 text-xs font-semibold text-[#e63020] hover:underline"
            >
              ↺ Re-apply schedule spread to all posts
            </button>
          )}
        </div>

        {/* ── Upload zone (upload phase) ── */}
        {phase === "upload" && (
          <div
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!generating && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#e63020] bg-[#e63020]/5"
                : slots.length > 0
                ? "border-gray-200 hover:border-gray-300 bg-white"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <p className="text-4xl mb-3">{isDragging ? "🎯" : "📷"}</p>
            <p className="text-base font-bold text-[#1c1712]">
              {isDragging ? "Drop your photos!" : "Drop up to 7 photos here"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Or click to browse · JPG, PNG, HEIC · {slots.length}/{MAX_SLOTS} added
            </p>
            <input
              ref={fileInputRef}
              disabled={generating}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); }}
            />
          </div>
        )}

        {/* ── Thumbnails grid ── */}
        {slots.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#1c1712]">
                {phase === "upload" ? "Photos to schedule" : "Review & edit captions"}
                <span className="text-gray-400 font-normal ml-2">({slots.length} photo{slots.length !== 1 ? "s" : ""})</span>
              </h2>
              {phase === "upload" && slots.length < MAX_SLOTS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#e63020] hover:underline"
                >
                  + Add more
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {slots.map((slot, i) => (
                <SlotCard
                  key={i}
                  slot={slot}
                  index={i}
                  phase={phase}
                  onRemove={() => removeSlot(i)}
                  busy={generating}
                  onUpdate={(field, value) => updateCaption(i, field, value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Generate / action button (upload phase) ── */}
        {phase === "upload" && slots.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => void prepareAll(true)}
              disabled={generating || slots.length === 0}
              className="flex items-center gap-2 bg-[#1c1712] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Preparing photos…
                </>
              ) : (
                `✨ Generate ${slots.length} caption${slots.length !== 1 ? "s" : ""} with AI`
              )}
            </button>
            <button
              onClick={() => void prepareAll(false)}
              disabled={generating || slots.length === 0}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold disabled:opacity-50"
            >
              Write captions myself
            </button>
            <p className="text-xs text-gray-400">Manual entry uploads your photos without AI generation.</p>
          </div>
        )}

        {/* ── Schedule all (review phase, bottom CTA) ── */}
        {phase === "review" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#1c1712]">
                {readyCount} post{readyCount !== 1 ? "s" : ""} ready
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Each photo becomes one post with a separate delivery to each selected destination. Review the saved previews, then approve the whole batch once. Shared hashtags are included on both destinations.
              </p>
            </div>
            <button
              onClick={scheduleAll}
              disabled={saving || saveUncertain || readyCount === 0 || platforms.length === 0}
              className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#c8281a] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? "Saving…" : `Save ${readyCount} posts · ${readyCount * platforms.length} deliveries`}
            </button>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  slot, index, phase, onRemove, onUpdate, busy,
}: {
  slot: Slot;
  index: number;
  phase: "upload" | "review";
  onRemove: () => void;
  busy: boolean;
  onUpdate: (field: "captionInstagram" | "captionFacebook" | "captionTwitter" | "hashtags" | "scheduleTime", value: string) => void;
}) {
  function formatSchedule(iso: string) {
    if (!iso) return "—";
    let d: Date;
    try { d = new Date(reginaToIso(iso)); } catch { return "Choose a valid date and time"; }
    return d.toLocaleString("en-CA", { timeZone: "America/Regina", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      slot.error ? "border-red-200" : slot.done ? "border-green-200" : slot.processing ? "border-[#e63020]/30 animate-pulse" : "border-gray-200"
    }`}>
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="relative w-28 sm:w-40 flex-shrink-0 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slot.preview}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover min-h-[160px]"
          />
          {/* Status overlay */}
          {slot.processing && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-white text-xs font-semibold">Preparing…</span>
            </div>
          )}
          {slot.done && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              ✓
            </div>
          )}
          {/* Index badge */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-4">
          {/* Upload phase: just filename + remove */}
          {phase === "upload" && (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#1c1712] truncate max-w-xs">{slot.file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(slot.file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                onClick={onRemove}
                disabled={busy}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                ✕ Remove
              </button>
            </div>
          )}

          {/* Review phase: editable captions + schedule */}
          {phase === "review" && (
            <div className="space-y-3">
              {slot.error && (
                <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{slot.error}</p>
              )}

              {/* Instagram caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500">📸 Instagram</label>
                  <span className="text-xs text-gray-400 font-mono">{slot.captionInstagram.length}/220</span>
                </div>
                <textarea
                  value={slot.captionInstagram}
                  onChange={(e) => onUpdate("captionInstagram", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                />
              </div>

              {/* Facebook caption */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500">🌐 Facebook</label>
                  <span className="text-xs text-gray-400 font-mono">{slot.captionFacebook.length}/300</span>
                </div>
                <textarea
                  value={slot.captionFacebook}
                  onChange={(e) => onUpdate("captionFacebook", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Shared hashtags · both destinations</label>
                <input
                  type="text"
                  value={slot.hashtags}
                  onChange={e => onUpdate("hashtags", e.target.value)}
                  placeholder="#Saskatoon #Printing"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
                />
              </div>

              {/* Schedule time */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Scheduled</label>
                  <input
                    type="datetime-local"
                    value={slot.scheduleTime.slice(0, 16)}
                    onChange={(e) => onUpdate("scheduleTime", e.target.value ? e.target.value + ":00" : "")}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                  />
                </div>
                <div className="text-xs text-gray-400 pt-4">
                  {formatSchedule(slot.scheduleTime)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
