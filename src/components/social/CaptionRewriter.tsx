"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generateCaptions, GenerationRequestError } from "@/lib/social/generation-client";
import type { GenerationChannel, GenerationResponse } from "@/lib/social/generation-contract";
import { GenerationUsageSettings } from "./GenerationUsageSettings";
import { PRODUCTS } from "@/lib/data/products-content";

interface RewriteResult {
  instagram: string;
  facebook: string;
  twitter: string;
  hashtags?: string;
  angle?: string;
  gbp?: string;
  facts?: GenerationResponse["facts"];
  jobId?: string;
}

interface Props {
  captionRaw: string;
  campaignSlug?: string;
  onResult: (result: RewriteResult) => void;
  onImageUploaded?: (url: string) => void;
  selectedChannels?: GenerationChannel[];
  businessId?: string;
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

// Upload image to Supabase Storage via our API, returns public URL
async function uploadImage(file: File, businessId?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/staff/social/upload", {
    method: "POST",
    body: form,
    headers: businessId ? { "X-Social-Business-Id": businessId } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

export function CaptionRewriter({ captionRaw, campaignSlug, onResult, onImageUploaded, selectedChannels, businessId }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"uploading" | "generating" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResult | null>(null);

  const [channels, setChannels] = useState<GenerationChannel[]>(selectedChannels ?? ["instagram", "facebook"]);
  const [productSlug, setProductSlug] = useState("");
  const [includePrice, setIncludePrice] = useState(false);
  const [needsNewRequest, setNeedsNewRequest] = useState(false);
  const [generation, setGeneration] = useState<GenerationResponse | null>(null);
  const requestRef = useRef<{ key: string; id: string } | null>(null);
  const uploadedRef = useRef<{ file: File; url: string; businessId?: string } | null>(null);
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCaption = captionRaw.trim().length > 0;
  const hasImage = imageFile !== null;
  const canGenerate = (hasCaption || hasImage || !!productSlug) && channels.length > 0;

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

  async function handleGenerate(resumeJobId?: string, newRequest = false) {
    if (!canGenerate) {
      setError("Write a caption or upload an image of your work.");
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsNewRequest(false);
    try {
      const payload: Record<string, unknown> = { campaign_slug: campaignSlug, selectedChannels: channels, productSlug: productSlug || undefined, includePrice };

      if (hasImage && imageFile) {
        // Step 1: Upload image to Supabase Storage → get public URL
        setLoadingStep("uploading");
        const publicUrl = uploadedRef.current?.file === imageFile && uploadedRef.current.businessId === businessId ? uploadedRef.current.url : await uploadImage(imageFile, businessId);
        uploadedRef.current = { file: imageFile, url: publicUrl, businessId };
        onImageUploaded?.(publicUrl);

        // Step 2: Compress for AI vision analysis
        setLoadingStep("generating");
        const { base64, type } = await compressImage(imageFile);
        payload.image_base64 = base64;
        payload.image_type = type;
        payload.image_url = publicUrl; // helps AI know where it'll be hosted
        if (hasCaption) payload.caption_raw = captionRaw;
      } else {
        setLoadingStep("generating");
        payload.caption_raw = captionRaw;
      }

      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
      const storageKey = `social-generation:${businessId ?? "default"}:${key}`;
      if (resumeJobId || newRequest) {
        requestRef.current = { key, id: crypto.randomUUID() };
        if (resumeJobId) payload.resumeJobId = resumeJobId;
      } else if (requestRef.current?.key !== key) {
        let saved: string | null = null;
        try { saved = sessionStorage.getItem(storageKey); } catch { /* Storage may be unavailable. */ }
        requestRef.current = { key, id: saved ?? crypto.randomUUID() };
      }
      try { sessionStorage.setItem(storageKey, requestRef.current.id); } catch { /* Current request still retains its ID. */ }
      const settingsResponse = await fetch("/api/staff/social/generation/settings", { headers: businessId ? { "X-Social-Business-Id": businessId } : {} });
      const settings = await settingsResponse.json();
      if (!settingsResponse.ok) throw new Error(settings.error ?? "Generation settings unavailable.");
      let data: GenerationResponse;
      if (settings.configured) {
        data = await generateCaptions({ ...payload, requestId: requestRef.current.id, selectedChannels: channels } as Parameters<typeof generateCaptions>[0], businessId);
      } else {
        // Compatibility only while approved migrations are pending. No hidden retry.
        const res = await fetch("/api/staff/social/captions", { method: "POST", headers: { "Content-Type": "application/json", ...(businessId ? { "X-Social-Business-Id": businessId } : {}) }, body: JSON.stringify(payload) });
        data = await res.json();
        if (!res.ok) throw new Error((data as unknown as { error: string }).error ?? "Generation failed");
      }
      setGeneration(data);
      setResult(data);
      onResult(data);
      if (data.errors.length) setError(data.errors.join(" "));
      if (data.status === "held" || data.status === "running") setError("This job is " + data.status + ". Keep the request ID for recovery; do not start a duplicate generation.");
    } catch (e) {
      setNeedsNewRequest(e instanceof GenerationRequestError && e.status === 409);
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  }

  const buttonLabel = loading
    ? loadingStep === "uploading" ? "Uploading image…" : "Analyzing & generating…"
    : hasImage
    ? "✨ Generate from image"
    : "✨ Rewrite with AI";

  return (
    <div className="space-y-4">
      {/* Image drop zone */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Drop a photo of your work — choose channels and review the draft
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
                  disabled={loading}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/40 text-white text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
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
                AI observes visible details; select a catalogue product for verified pricing
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

      <div className="space-y-2 text-xs">
        <div className="flex gap-3">{(["instagram", "facebook", "gbp"] as GenerationChannel[]).map(channel => <label key={channel}><input type="checkbox" checked={channels.includes(channel)} disabled={loading} onChange={() => { setChannels(current => current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]); }} /> {channel === "gbp" ? "Google Business Profile" : channel}</label>)}</div>
        <label className="block">Catalogue product (optional for showcases)<select aria-label="Catalogue product" value={productSlug} onChange={e => { setProductSlug(e.target.value); setIncludePrice(false); }} className="block border rounded p-2 w-full"><option value="">Photo showcase without pricing</option>{Object.entries(PRODUCTS).filter(([, p]) => !p.comingSoon && !p.serviceMode && p.sizePresets.length).map(([slug, p]) => <option key={slug} value={slug}>{p.name}</option>)}</select></label>
        <label className="block"><input type="checkbox" checked={includePrice} disabled={!productSlug} onChange={e => setIncludePrice(e.target.checked)} /> Include verified catalogue configuration and order-minimum disclosure</label>
      </div>
      <GenerationUsageSettings businessId={businessId} />
      {/* Generate button */}
      <button
        onClick={() => handleGenerate()}
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
          Write a caption above, or drop a photo — AI drafts only your selected channels.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {generation && <p className="text-xs text-gray-500">{generation.cacheHit ? "Reused saved copy · " : ""}{generation.usage.calls} AI calls · {generation.usage.costUsd === null ? "Cost unavailable" : `USD ${generation.usage.costUsd.toFixed(4)}`} · {generation.status}. Job {generation.jobId}. Hashtags: {generation.hashtagEvidence.kind === "researched" ? `research dated ${generation.hashtagEvidence.researchedAt}` : "generic suggestions"}.</p>}
      {generation?.status === "partial" && <button type="button" disabled={loading} onClick={() => handleGenerate(generation.jobId)} className="text-xs border rounded px-3 py-2">Retry missing channels (uses generation allowance)</button>}
      {needsNewRequest && <button type="button" disabled={loading} onClick={() => handleGenerate(undefined, true)} className="text-xs border rounded px-3 py-2">Start with current catalogue facts</button>}
      {/* AI angle note */}
      <AnimatePresence>
        {result?.angle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-400 italic bg-gray-50 px-3 py-2 rounded-lg"
          >
            AI angle: {result.angle}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="grid gap-3"
          >
            {channels.includes("instagram") && <PlatformPreview
              platform="Instagram"
              icon="📸"
              content={result.instagram}
              charLimit={2200}
              color="#E1306C"
              onUpdate={(v) => {
                setResult((r) => r ? { ...r, instagram: v } : r);
                onResult({ ...result, instagram: v });
              }}
            />
            }
            {channels.includes("facebook") && <PlatformPreview
              platform="Facebook"
              icon="🌐"
              content={result.facebook}
              charLimit={5000}
              color="#1877F2"
              onUpdate={(v) => {
                setResult((r) => r ? { ...r, facebook: v } : r);
                onResult({ ...result, facebook: v });
              }}
            />
            }
            {channels.includes("gbp") && <PlatformPreview platform="Google Business Profile" icon="📍" content={result.gbp ?? ""} charLimit={1500} color="#4285f4" onUpdate={v => { setResult(r => r ? { ...r, gbp: v } : r); onResult({ ...result, gbp: v }); }} />}
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
