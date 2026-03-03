"use client";

import { useState } from "react";
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

export function CaptionRewriter({ captionRaw, campaignSlug, onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RewriteResult | null>(null);

  async function handleRewrite() {
    if (!captionRaw.trim()) {
      setError("Write a raw caption first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/social/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption_raw: captionRaw, campaign_slug: campaignSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");
      setResult(data);
      onResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleRewrite}
        disabled={loading || !captionRaw.trim()}
        className="flex items-center gap-2 bg-[#1c1712] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Rewriting…
          </>
        ) : (
          <>
            <span>✨</span>
            Rewrite with AI
          </>
        )}
      </button>

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
              onUpdate={(v) => { setResult(r => r ? { ...r, instagram: v } : r); onResult({ ...result, instagram: v }); }}
            />
            <PlatformPreview
              platform="Facebook"
              icon="🌐"
              content={result.facebook}
              charLimit={300}
              color="#1877F2"
              onUpdate={(v) => { setResult(r => r ? { ...r, facebook: v } : r); onResult({ ...result, facebook: v }); }}
            />
            <PlatformPreview
              platform="X / Twitter"
              icon="🐦"
              content={result.twitter}
              charLimit={200}
              color="#1DA1F2"
              onUpdate={(v) => { setResult(r => r ? { ...r, twitter: v } : r); onResult({ ...result, twitter: v }); }}
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
