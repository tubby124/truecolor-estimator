"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { SocialCampaign } from "@/lib/types/social";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function buildProgress(campaign: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number }) {
  // 5 channels: email, landing, ig posts (3), gbp posts (2)
  let done = 0;
  const total = 5;
  if (campaign.brevo_campaign_ids?.length > 0) done++;
  if (campaign.landing_page_slug) done++;
  const igPosts = campaign.post_count ?? 0;
  if (igPosts >= 3) done += 2;
  else if (igPosts >= 1) done += 1;
  if (campaign.gbp_posts_done >= campaign.gbp_posts_total && campaign.gbp_posts_total > 0) done++;
  else if (campaign.gbp_posts_done > 0) done += 0.5;
  return Math.round((done / total) * 100);
}

function CampaignStatusDot({ status }: { status: string }) {
  const color = status === "in-progress" ? "bg-amber-400" : status === "complete" ? "bg-green-500" : status === "archived" ? "bg-gray-400" : "bg-gray-300";
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}

interface Props {
  campaign: SocialCampaign & { post_count?: number; posts_ready?: number; posts_posted?: number };
  index: number;
}

export function CampaignCard({ campaign, index }: Props) {
  const progress = buildProgress(campaign);
  const igCount = campaign.post_count ?? 0;
  const igTarget = 3;
  const gbpDone = campaign.gbp_posts_done ?? 0;
  const gbpTotal = campaign.gbp_posts_total ?? 2;
  const breCount = campaign.brevo_campaign_ids?.length ?? 0;

  const breevoUrl = `https://app.brevo.com/email-campaign/`;
  const landingUrl = campaign.landing_page_slug ? `https://truecolorprinting.ca/${campaign.landing_page_slug}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header strip with campaign color */}
      <div className="h-1" style={{ backgroundColor: campaign.campaign_color }} />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: campaign.campaign_color }} />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1c1712] leading-tight truncate">{campaign.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <CampaignStatusDot status={campaign.status} />
                {campaign.status.replace("-", " ")}
                {campaign.event_date && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>Event: {formatDate(campaign.event_date)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/staff/social/compose?campaign=${campaign.slug}`}
            className="flex-shrink-0 text-xs font-semibold text-[#e63020] bg-[#e63020]/8 hover:bg-[#e63020]/15 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            + Post
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-400 font-medium">Campaign build</span>
            <span className="text-[11px] font-bold" style={{ color: campaign.campaign_color }}>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: campaign.campaign_color }}
            />
          </div>
        </div>

        {/* Channel rows */}
        <div className="space-y-2">
          {/* Email */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base leading-none">📧</span>
            <span className="text-gray-500 w-16 flex-shrink-0">Email</span>
            {breCount > 0 ? (
              <a
                href={breevoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {breCount} campaign{breCount !== 1 ? "s" : ""}
                {campaign.lead_count > 0 && <span className="text-gray-400 font-normal"> · {campaign.lead_count} leads</span>}
              </a>
            ) : (
              <span className="text-gray-300">No campaigns yet</span>
            )}
          </div>

          {/* Landing page */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base leading-none">🌐</span>
            <span className="text-gray-500 w-16 flex-shrink-0">Landing</span>
            {landingUrl ? (
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                /{campaign.landing_page_slug}
              </a>
            ) : (
              <span className="text-gray-300">No landing page</span>
            )}
          </div>

          {/* Instagram posts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base leading-none">📸</span>
            <span className="text-gray-500 w-16 flex-shrink-0">Instagram</span>
            <Link
              href={`/staff/social/queue?campaign=${campaign.id}`}
              className="flex items-center gap-1.5 hover:underline"
            >
              <span className="flex gap-0.5">
                {Array.from({ length: igTarget }).map((_, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${i < igCount ? "bg-[#E1306C]" : "bg-gray-200"}`} />
                ))}
              </span>
              <span className={igCount === 0 ? "text-gray-300" : "text-gray-600 font-medium"}>
                {igCount}/{igTarget} in queue
              </span>
            </Link>
          </div>

          {/* GBP */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base leading-none">🗺️</span>
            <span className="text-gray-500 w-16 flex-shrink-0">GBP</span>
            <span className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                {Array.from({ length: gbpTotal }).map((_, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${i < gbpDone ? "bg-amber-500" : "bg-gray-200"}`} />
                ))}
              </span>
              <span className={gbpDone === 0 ? "text-gray-300" : "text-gray-600 font-medium"}>
                {gbpDone}/{gbpTotal} posted
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
