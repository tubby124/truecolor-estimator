"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import type { Platform } from "@/lib/types/social";

interface SendToSocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    imageUrls?: string[];
    caption?: string;
    hashtags?: string;
    campaignId?: string;
    source?: "manual" | "gbp" | "image-prompt" | "skill" | "batch";
    scheduleDate?: string;
    altText?: string;
  };
}

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
];

export function SendToSocialModal({ isOpen, onClose, initialData }: SendToSocialModalProps) {
  const { toasts, showToast, dismissToast } = useToast();

  const [caption, setCaption] = useState(initialData?.caption ?? "");
  const [altText, setAltText] = useState(initialData?.altText ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "facebook"]);
  const [date, setDate] = useState(initialData?.scheduleDate ?? "");
  const [time, setTime] = useState("09:00");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const imageUrls = initialData?.imageUrls ?? [];

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleGenerateCaption() {
    setGenerating(true);
    try {
      const body = caption.trim()
        ? { caption_raw: caption }
        : { topic: "True Color print job" };

      const res = await fetch("/api/staff/social/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(d.error ?? "Generation failed");
      }

      const data = await res.json();
      if (data.instagram) setCaption(data.instagram);
      if (data.alt_text) setAltText(data.alt_text);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Caption generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(statusArg: "draft" | "ready") {
    if (!caption.trim()) {
      showToast("Write or generate a caption first", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption_raw: caption,
          image_url: imageUrls[0] || null,
          image_urls: imageUrls,
          platforms,
          schedule_date: date || null,
          schedule_time: date ? `${date}T${time}:00` : null,
          status: statusArg,
          source: initialData?.source || "manual",
          alt_text: altText || null,
          campaign_id: initialData?.campaignId || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(d.error ?? "Save failed");
      }

      showToast("Added to queue", "success");
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl">
              <h2 className="text-lg font-black text-[#1c1712]">Send to Social Queue</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1c1712] hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Image preview */}
              {imageUrls.length > 0 && (
                <div className="relative">
                  <img
                    src={imageUrls[0]}
                    alt={altText || "Post image"}
                    className="w-full max-h-48 object-cover rounded-xl border border-gray-100"
                  />
                  {imageUrls.length > 1 && (
                    <span className="absolute top-2 right-2 bg-[#1c1712]/80 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      +{imageUrls.length - 1} more
                    </span>
                  )}
                </div>
              )}

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#1c1712]">Caption</label>
                  <button
                    onClick={handleGenerateCaption}
                    disabled={generating}
                    className="text-xs font-semibold text-[#e63020] hover:text-[#c8281a] transition-colors disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Generate Caption"}
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  placeholder="Write a caption or click Generate..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] resize-none"
                />
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-sm font-semibold text-[#1c1712] mb-1.5">
                  Alt Text <span className="font-normal text-gray-400">(accessibility)</span>
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for screen readers"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                />
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold text-[#1c1712] mb-2">Platforms</label>
                <div className="flex gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => togglePlatform(p.key)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        platforms.includes(p.key)
                          ? "border-[#1c1712] bg-[#1c1712] text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020]"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="flex-1 border-2 border-gray-200 text-[#1c1712] text-sm font-bold py-3 rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave("ready")}
                  disabled={saving || platforms.length === 0}
                  className="flex-1 bg-[#e63020] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#c8281a] transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Mark Ready"}
                </button>
              </div>
            </div>
          </motion.div>

          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
