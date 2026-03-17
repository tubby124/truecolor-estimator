"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { SendToSocialModal } from "./SendToSocialModal";
import { toPublicUrl } from "@/lib/utils/social";

export interface GBPPost {
  postType: "Offer" | "Update" | "Event";
  title?: string;
  description: string;
  publishDate: string;
  publishTime: string;
  imagePath?: string; // e.g. "public/images/seasonal/mothers-day/hero.webp"
  // Offer-only
  offerStart?: string;
  offerStartTime?: string;
  offerEnd?: string;
  offerEndTime?: string;
  terms?: string;
  couponCode?: string;
  redeemUrl?: string;
  // Update + Event
  buttonType?: string;
  buttonUrl?: string;
  // Event-only
  eventStart?: string;
  eventStartTime?: string;
  eventEnd?: string;
  eventEndTime?: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }
  return (
    <button onClick={handleCopy} className="flex-shrink-0 ml-1">
      {copied ? (
        <span className="text-[10px] font-bold text-green-600">✓</span>
      ) : (
        <svg
          className="w-3.5 h-3.5 text-[#e63020] hover:text-[#c8281a] transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
          />
        </svg>
      )}
    </button>
  );
}

function Row({
  label,
  value,
  copyable = false,
  mono = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-36 flex-shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-5">
        {label}
      </span>
      <div className="flex-1 flex items-start gap-1 min-w-0">
        <span
          className={`text-sm text-gray-800 break-words flex-1 ${
            mono ? "font-mono text-[11px]" : ""
          }`}
        >
          {value}
        </span>
        {copyable && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

const LOCAL_BASE = "/Users/owner/Downloads/TRUE COLOR PRICING /truecolor-estimator/";

function toSrc(imagePath: string): string {
  return imagePath.startsWith("public/") ? imagePath.slice(6) : imagePath;
}

const BADGE_STYLES: Record<string, string> = {
  Offer: "bg-green-100 text-green-700 border-green-200",
  Update: "bg-blue-100 text-blue-700 border-blue-200",
  Event: "bg-amber-100 text-amber-700 border-amber-200",
};

export function GBPPostCard({ post, index }: { post: GBPPost; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const charCount = post.description.length;
  const titleLen = post.title?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Post {index + 1}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              BADGE_STYLES[post.postType] ?? ""
            }`}
          >
            {post.postType}
          </span>
          <span className="text-[10px] text-gray-400">
            {post.publishDate} · {post.publishTime}
          </span>
          <button
            onClick={() => setShowSendModal(true)}
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#e63020]/30 text-[#e63020] hover:bg-[#e63020]/5 transition-colors"
          >
            -&gt; Queue
          </button>
        </div>
      </div>

      {/* Image preview */}
      {post.imagePath && (
        <div className="relative w-full h-36 bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={toSrc(post.imagePath)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Fields */}
      <div className="px-5 py-3">
        <Row label="Post type" value={`${post.postType} ← click in GBP`} />

        {/* Image to upload — filename prominent for Spotlight search */}
        {post.imagePath && (() => {
          const filename = post.imagePath.split("/").pop() ?? post.imagePath;
          const fullPath = `${LOCAL_BASE}${post.imagePath}`;
          return (
            <div className="flex gap-3 items-start py-1.5 border-b border-gray-50">
              <span className="w-36 flex-shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-5">
                Upload image
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#1c1712] break-all flex-1">{filename}</span>
                  <CopyBtn text={fullPath} />
                </div>
                <span className="text-[10px] text-amber-600 font-semibold">JPG — ready to upload</span>
              </div>
            </div>
          );
        })()}

        {/* Title — Offer + Event only */}
        {post.title !== undefined && (
          <div className="flex gap-3 items-start py-1.5 border-b border-gray-50">
            <span className="w-36 flex-shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-5">
              Title* (58 max)
            </span>
            <div className="flex-1">
              <div className="flex items-start gap-1">
                <span className="text-sm text-gray-800 flex-1">{post.title}</span>
                <CopyBtn text={post.title} />
              </div>
              <span
                className={`text-[10px] ${
                  titleLen > 52 ? "text-amber-500 font-semibold" : "text-gray-400"
                }`}
              >
                {titleLen}/58
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex gap-3 items-start py-1.5 border-b border-gray-50">
          <span className="w-36 flex-shrink-0 text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-5">
            Description
          </span>
          <div className="flex-1">
            <div className="flex items-start gap-1">
              <p
                className={`text-sm text-gray-800 flex-1 whitespace-pre-line ${
                  expanded ? "" : "line-clamp-3"
                }`}
              >
                {post.description}
              </p>
              <CopyBtn text={post.description} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[10px] ${
                  charCount > 1200 ? "text-red-500 font-semibold" : "text-gray-400"
                }`}
              >
                {charCount}/1,500
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] font-bold text-[#e63020] hover:underline"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule toggle — all types */}
        <Row
          label="Schedule post"
          value={`Toggle ON → ${post.publishDate} at ${post.publishTime}`}
        />

        {/* Offer-specific fields */}
        {post.postType === "Offer" && (
          <>
            <Row label="Start date*" value={post.offerStart ?? post.publishDate} />
            <Row label="Start time" value={post.offerStartTime ?? "9:00 AM"} />
            <Row label="End date*" value={post.offerEnd ?? "—"} />
            <Row label="End time" value={post.offerEndTime ?? "11:59 PM"} />
            {post.terms && <Row label="+ Terms" value={post.terms} copyable />}
            <Row
              label="+ Coupon code"
              value={post.couponCode || "(leave blank)"}
            />
            {post.redeemUrl && (
              <Row label="+ Redeem link" value={post.redeemUrl} copyable mono />
            )}
          </>
        )}

        {/* Event-specific fields */}
        {post.postType === "Event" && (
          <>
            <Row label="Start date*" value={post.eventStart ?? "—"} />
            <Row label="Start time" value={post.eventStartTime ?? "9:00 AM"} />
            <Row label="End date*" value={post.eventEnd ?? "—"} />
            <Row label="End time" value={post.eventEndTime ?? "11:59 PM"} />
            {post.buttonType && <Row label="+ Button" value={post.buttonType} />}
            {post.buttonUrl && (
              <Row label="Button URL" value={post.buttonUrl} copyable mono />
            )}
          </>
        )}

        {/* Update-specific fields */}
        {post.postType === "Update" && (
          <>
            {post.buttonType && <Row label="+ Button" value={post.buttonType} />}
            {post.buttonUrl && (
              <Row label="Button URL" value={post.buttonUrl} copyable mono />
            )}
          </>
        )}
      </div>
      <SendToSocialModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        initialData={{
          imageUrls: post.imagePath ? [toPublicUrl(post.imagePath)] : [],
          caption: post.description,
          source: "gbp",
          scheduleDate: post.publishDate,
        }}
      />
    </motion.div>
  );
}
