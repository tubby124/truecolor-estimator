"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface RewriteResult {
  instagram: string;
  facebook: string;
  twitter: string;
}

interface Props {
  captionRaw: string;
  campaignSlug?: string;
  onResult: (result: RewriteResult) => void;
}

// Compress image to max 1024px JPEG before sending to AI
async function compressImage(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1024;
        const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not available")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve({ base64: dataUrl.split(",")[1], type: "image/jpeg" });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function CaptionRewriter({ captionRaw, campaignSlug, onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResult | null>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCaption = captionRaw.trim().length > 0;
  const hasImage = imageFile !== null;
  const canGenerate = hasCaption || hasImage;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!canGenerate) {
      setError("Write a caption or upload an image of your work.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = { campaign_slug: campaignSlug };

      if (hasImage && imageFile) {
        const { base64, type } = await compressImage(imageFile);
        payload.image_base64 = base64;
        payload.image_type = type;
        // Include any notes the staff wrote as additional context
        if (hasCaption) payload.caption_raw = captionRaw;
      } else {
        payload.caption_raw = captionRaw;
      }

      const res = await fetch("/api/staff/social/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
      onResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? hasImage ? "Analyzing image…" : "Generating…"
    : hasImage
    ? "✨ Generate from image"
    : "✨ Rewrite with AI";

  return (
    <div className="space-y-4">
      {/* Image drop zone */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Drop a photo of your work — AI generates the caption
        </p>
        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full max-h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <p className="text-white text-xs font-semibold truncate mr-2">
                  {imageFile?.name}
                </p>
                <button
                  onClick={removeImage}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/40 text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl px-6 py-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#e63020] bg-[#e63020]/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <p className="text-2xl mb-1.5">📷</p>
              <p className="text-sm font-semibold text-gray-600">
                {isDragging ? "Drop it!" : "Drop a photo or click to browse"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                JPG, PNG — AI will analyze it and write captions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !canGenerate}
        className="flex items-center gap-2 bg-[#1c1712] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {buttonLabel}
          </>
        ) : (
          buttonLabel
        )}
      </button>

      {!hasImage && !hasCaption && (
        <p className="text-xs text-gray-400">
          Write a caption above, or drop a photo — AI generates posts for all 3 platforms.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="grid gap-3"
          >
            <PlatformPreview
              platform="Instagram"
              icon="📸"
              content={result.instagram}
              charLimit={220}
              color="#E1306C"
              onUpdate={(v) => {
                setResult((r) => r ? { ...r, instagram: v } : r);
                onResult({ ...result, instagram: v });
              }}
            />
            <PlatformPreview
              platform="Facebook"
              icon="🌐"
              content={result.facebook}
              charLimit={300}
              color="#1877F2"
              onUpdate={(v) => {
                setResult((r) => r ? { ...r, facebook: v } : r);
                onResult({ ...result, facebook: v });
              }}
            />
            <PlatformPreview
              platform="X / Twitter"
              icon="🐦"
              content={result.twitter}
              charLimit={200}
              color="#1DA1F2"
              onUpdate={(v) => {
                setResult((r) => r ? { ...r, twitter: v } : r);
                onResult({ ...result, twitter: v });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlatformPreview({
  platform, icon, content, charLimit, color, onUpdate,
}: {
  platform: string; icon: string; content: string; charLimit: number; color: string; onUpdate: (v: string) => void;
}) {
  const over = content.length > charLimit;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-600">{icon} {platform}</span>
        <span className={`text-xs font-mono ${over ? "text-red-500 font-bold" : "text-gray-400"}`}>
          {content.length}/{charLimit}
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        rows={3}
        className="w-full px-3 py-2.5 text-sm text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-inset"
        style={{ "--tw-ring-color": color } as React.CSSProperties}
      />
    </div>
  );
}
