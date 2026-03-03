"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "facebook" | "twitter";

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

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayYMD() {
  return toYMD(new Date());
}

/** Returns the next Mon / Wed / Fri on or after `from` */
function nextMWF(from: Date): Date {
  const d = new Date(from);
  const targets = [1, 3, 5]; // Mon, Wed, Fri
  const day = d.getDay();
  const next = targets.find((t) => t >= day);
  if (next !== undefined) {
    d.setDate(d.getDate() + (next - day));
  } else {
    // Jump to next Monday
    d.setDate(d.getDate() + (8 - day));
  }
  return d;
}

/**
 * Given a start date and count, returns ISO timestamps spread Mon/Wed/Fri at `time`.
 * First slot uses `startDate` as-is; subsequent slots advance to the next M/W/F.
 */
function spreadSchedule(startYMD: string, count: number, time: string): string[] {
  if (!startYMD) return Array(count).fill("");
  const dates: string[] = [];
  let cursor = new Date(startYMD + "T12:00:00");
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      dates.push(`${startYMD}T${time}:00`);
    } else {
      // Advance cursor past the last used date
      cursor = new Date(dates[i - 1].slice(0, 10) + "T12:00:00");
      cursor.setDate(cursor.getDate() + 1);
      const next = nextMWF(cursor);
      dates.push(`${toYMD(next)}T${time}:00`);
    }
  }
  return dates;
}

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
  const res = await fetch("/api/staff/social/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

async function generateCaption(file: File, imageUrl: string) {
  const { base64, type } = await compressForAI(file);
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
  { key: "twitter",   icon: "🐦", label: "X / Twitter" },
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

  // Phase
  const [phase, setPhase] = useState<"upload" | "review" | "done">("upload");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

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

  // ── Generate all captions ───────────────────────────────────────────────────

  async function generateAll() {
    if (slots.length === 0) return;
    setGenerating(true);

    // Spread schedule first
    const times = spreadSchedule(startDate, slots.length, postTime);

    for (let i = 0; i < slots.length; i++) {
      if (slots[i].done) continue; // skip already processed

      setSlots((prev) => prev.map((s, j) => j === i ? { ...s, processing: true, error: null } : s));

      try {
        // 1. Upload
        const imageUrl = await uploadImage(slots[i].file);
        // 2. Generate
        const captions = await generateCaption(slots[i].file, imageUrl);

        setSlots((prev) => prev.map((s, j) => j === i ? {
          ...s,
          imageUrl,
          captionInstagram: captions.instagram,
          captionFacebook: captions.facebook,
          captionTwitter: captions.twitter,
          hashtags: captions.hashtags ?? "",
          scheduleTime: times[i],
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
    const readySlots = slots.filter((s) => s.imageUrl && (s.captionInstagram || s.captionFacebook));
    if (readySlots.length === 0) {
      showToast("No ready posts — generate captions first", "error");
      return;
    }
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
        schedule_time: s.scheduleTime,
      }));

      const res = await fetch("/api/staff/social/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Batch save failed");

      setSavedCount(data.created);
      setPhase("done");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to schedule", "error");
    } finally {
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

  // DONE phase
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-[#1c1712] mb-2">All Scheduled!</h2>
          <p className="text-gray-500 text-sm mb-6">
            {savedCount} post{savedCount !== 1 ? "s" : ""} added to your queue.
            They&apos;ll post automatically via Blotato on their scheduled dates.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setSlots([]); setPhase("upload"); setSavedCount(0); }}
              className="flex-1 border-2 border-gray-200 text-[#1c1712] text-sm font-bold py-3 rounded-xl hover:border-gray-300 transition-colors"
            >
              Schedule More
            </button>
            <button
              onClick={() => router.push("/staff/social/queue")}
              className="flex-1 bg-[#e63020] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#c8281a] transition-colors"
            >
              View Queue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1c1712]">Batch Schedule</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Upload up to {MAX_SLOTS} photos → AI writes captions → schedule all in one click
            </p>
          </div>
          {phase === "review" && (
            <button
              onClick={scheduleAll}
              disabled={saving || slots.filter(s => s.done).length === 0}
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
                `✓ Schedule ${slots.filter(s => s.done).length} Posts`
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

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
              <p className="text-xs text-gray-400 mt-1">Others auto-spread Mon/Wed/Fri</p>
            </div>

            {/* Post time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Post time (local)
              </label>
              <input
                type="time"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
              />
              <p className="text-xs text-gray-400 mt-1">Applied to all posts</p>
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
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
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
              onClick={generateAll}
              disabled={generating || slots.length === 0}
              className="flex items-center gap-2 bg-[#1c1712] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating captions…
                </>
              ) : (
                `✨ Generate ${slots.length} caption${slots.length !== 1 ? "s" : ""} with AI`
              )}
            </button>
            <p className="text-xs text-gray-400">
              Each photo is uploaded and analyzed — takes ~10s per photo
            </p>
          </div>
        )}

        {/* ── Schedule all (review phase, bottom CTA) ── */}
        {phase === "review" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#1c1712]">
                {slots.filter(s => s.done).length} post{slots.filter(s => s.done).length !== 1 ? "s" : ""} ready
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Captions and dates are locked in — hit Schedule to add them to your Blotato queue
              </p>
            </div>
            <button
              onClick={scheduleAll}
              disabled={saving || slots.filter(s => s.done).length === 0}
              className="flex items-center gap-2 bg-[#e63020] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#c8281a] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? "Saving…" : `✓ Schedule All`}
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
  slot, index, phase, onRemove, onUpdate,
}: {
  slot: Slot;
  index: number;
  phase: "upload" | "review";
  onRemove: () => void;
  onUpdate: (field: "captionInstagram" | "captionFacebook" | "captionTwitter" | "hashtags" | "scheduleTime", value: string) => void;
}) {
  function formatSchedule(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
              <span className="text-white text-xs font-semibold">Analyzing…</span>
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

              {/* Schedule time */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Scheduled</label>
                  <input
                    type="datetime-local"
                    value={slot.scheduleTime.slice(0, 16)}
                    onChange={(e) => onUpdate("scheduleTime", e.target.value + ":00")}
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
