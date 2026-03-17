"use client";

import { motion, AnimatePresence } from "motion/react";

interface PostPreviewProps {
  imageUrls: string[];
  caption: string;
  hashtags?: string;
  platform: "instagram" | "facebook";
  altText?: string;
  onPlatformChange?: (platform: "instagram" | "facebook") => void;
}

function CharacterCountBar({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const color =
    pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
        <span>Characters</span>
        <span>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CarouselDots({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`block h-1.5 w-1.5 rounded-full ${
            i === 0 ? "bg-[#e63020]" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function InstagramPreview({
  imageUrls,
  caption,
  hashtags,
  altText,
}: Omit<PostPreviewProps, "platform" | "onPlatformChange">) {
  const totalChars = caption.length + (hashtags ? hashtags.length + 1 : 0);
  const truncated =
    caption.length > 125 ? caption.slice(0, 125).trimEnd() : caption;
  const isTruncated = caption.length > 125;

  return (
    <div className="mx-auto w-full max-w-[375px] rounded-[2rem] border border-gray-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E1306C] to-[#833AB4] text-[11px] font-bold text-white">
          TC
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-gray-900 truncate">
            truecolorprinting
          </p>
          <p className="text-[11px] leading-tight text-gray-500">
            Saskatoon, SK
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full bg-gray-100">
        {imageUrls.length > 0 && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[0]}
              alt={altText || "Post image"}
              className="h-full w-full object-cover"
            />
          </>
        )}
      </div>

      {/* Carousel dots */}
      <CarouselDots count={imageUrls.length} />

      {/* Action bar */}
      <div className="flex items-center gap-4 px-3 py-2 text-gray-800">
        <HeartIcon />
        <CommentIcon />
        <ShareIcon />
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p className="text-sm text-gray-900 leading-snug">
          <span className="font-semibold">truecolorprinting</span>{" "}
          {isTruncated ? (
            <>
              {truncated}
              <span className="text-gray-400">... more</span>
            </>
          ) : (
            caption
          )}
        </p>
        {hashtags && (
          <p className="mt-1 text-sm leading-snug text-[#00376b]">
            {hashtags}
          </p>
        )}
      </div>

      {/* Character count */}
      <CharacterCountBar current={totalChars} max={2200} />
    </div>
  );
}

function FacebookPreview({
  imageUrls,
  caption,
  hashtags,
  altText,
}: Omit<PostPreviewProps, "platform" | "onPlatformChange">) {
  const totalChars = caption.length + (hashtags ? hashtags.length + 1 : 0);
  const truncated =
    caption.length > 250 ? caption.slice(0, 250).trimEnd() : caption;
  const isTruncated = caption.length > 250;

  return (
    <div className="mx-auto w-full max-w-[500px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">
          TC
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-gray-900">
            True Color Display Printing
          </p>
          <p className="text-xs leading-tight text-gray-500">
            Saskatoon, SK
          </p>
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-900 leading-snug whitespace-pre-wrap">
          {isTruncated ? (
            <>
              {truncated}
              <span className="text-[#1877F2] cursor-pointer">... See more</span>
            </>
          ) : (
            caption
          )}
        </p>
        {hashtags && (
          <p className="mt-1 text-sm leading-snug text-[#1877F2]">
            {hashtags}
          </p>
        )}
      </div>

      {/* Image */}
      <div className="relative w-full bg-gray-100">
        {imageUrls.length > 0 && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[0]}
              alt={altText || "Post image"}
              className="h-auto w-full object-cover"
            />
          </>
        )}
      </div>

      {/* Carousel dots */}
      <CarouselDots count={imageUrls.length} />

      {/* Reactions bar */}
      <div className="flex items-center justify-around border-t border-gray-200 px-4 py-2.5">
        <button
          type="button"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Like
        </button>
        <button
          type="button"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Comment
        </button>
        <button
          type="button"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Share
        </button>
      </div>

      {/* Character count */}
      <CharacterCountBar current={totalChars} max={63000} />
    </div>
  );
}

export function PostPreview({
  imageUrls,
  caption,
  hashtags,
  platform,
  altText,
  onPlatformChange,
}: PostPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      {onPlatformChange && (
        <div className="flex items-center gap-4 border-b border-gray-200">
          {(["instagram", "facebook"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPlatformChange(p)}
              className={`relative pb-2 text-sm font-medium capitalize transition-colors ${
                platform === p ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {p}
              {platform === p && (
                <motion.div
                  layoutId="platform-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e63020] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {platform === "instagram" ? (
            <InstagramPreview
              imageUrls={imageUrls}
              caption={caption}
              hashtags={hashtags}
              altText={altText}
            />
          ) : (
            <FacebookPreview
              imageUrls={imageUrls}
              caption={caption}
              hashtags={hashtags}
              altText={altText}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
